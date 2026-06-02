/**
 * Hội thoại tự do — trả lời mọi câu hỏi dựa trên dữ liệu học sinh + lịch sử chat.
 * Dùng API Claude/Gemini (SDK), không gọi CLI.
 */
const llm = require('./llm.service');
const { buildStudentSnapshot, snapshotToText } = require('./student-data.service');

const DEFAULT_CHIPS = [
  'Tóm tắt tình hình học tập',
  'Môn nào cần cải thiện?',
  'Học phí đã đóng chưa?',
  'Lịch học tuần này',
];

const CONDUCT_LABELS = {
  excellent: 'Tốt',
  good: 'Khá',
  fair: 'Trung bình',
  weak: 'Yếu',
};

const buildSystemPrompt = (snapshot, userRole, persona) => {
  const who = persona === 'parent' || userRole === 'parent'
    ? 'phụ huynh'
    : 'học sinh';
  return `Bạn là trợ lý AI EduSmart, hỗ trợ ${who} tra cứu và tư vấn học tập.

QUY TẮC:
- CHỈ trả lời dựa trên DỮ LIỆU HỌC SINH bên dưới. Không bịa điểm, lịch, học phí.
- Nếu dữ liệu không có, nói rõ và gợi ý hỏi giáo viên/nhà trường.
- Tiếng Việt, thân thiện, ngắn gọn (ưu tiên ≤200 từ), có bullet khi liệt kê.
- Có thể: so sánh môn, giải thích điểm, gợi ý ôn tập, nhận xét nhận xét GV, học phí, thông báo, lịch, điểm danh, ngoại khóa.
- KHÔNG đưa lời khuyên y tế/pháp lý. KHÔNG tiết lộ email người khác.

DỮ LIỆU HỌC SINH (JSON):
${snapshotToText(snapshot)}`;
};

const parseChipsFromText = (text) => {
  const match = text.match(/\{\s*"chips"\s*:\s*\[[^\]]+\]\s*\}/);
  if (!match) return { content: text.trim(), chips: DEFAULT_CHIPS };
  try {
    const chips = JSON.parse(match[0]).chips;
    const content = text.replace(/\{\s*"chips".*\}\s*$/s, '').trim();
    return { content, chips: chips?.length ? chips : DEFAULT_CHIPS };
  } catch (_) {
    return { content: text.trim(), chips: DEFAULT_CHIPS };
  }
};

/** Trả lời khi không có API LLM */
const answerWithoutLlm = (message, snapshot) => {
  const n = (message || '').toLowerCase();
  const s = snapshot;
  const hk1 = s.scores.semester_1;
  const weakest = [...hk1].sort((a, b) => a.average - b.average)[0];
  const unpaid = s.tuition.filter((t) => t.status !== 'paid');

  let content = `📌 ${s.student.name} — lớp ${s.student.class}\n\n`;

  if (/học phí|hoc phi|đóng tiền|dong tien/.test(n)) {
    if (!s.tuition.length) content += 'Chưa có thông tin học phí trong hệ thống.';
    else {
      content += 'Học phí:\n';
      s.tuition.forEach((t) => {
        content += `• HK${t.semester}: ${t.status === 'paid' ? 'Đã đóng' : t.status === 'partial' ? 'Đóng một phần' : 'Chưa đóng'} (${Number(t.paid).toLocaleString('vi-VN')} / ${Number(t.amount).toLocaleString('vi-VN')} đ)\n`;
      });
    }
  } else if (/nhận xét|nhan xet|đánh giá|danh gia|hạnh kiểm|hanh kiem/.test(n)) {
    if (!s.evaluations.length) content += 'Chưa có nhận xét từ giáo viên.';
    else {
      content += 'Nhận xét gần đây:\n';
      s.evaluations.slice(0, 3).forEach((e) => {
        const label = e.conduct_grade ? CONDUCT_LABELS[e.conduct_grade] : '';
        content += `• [${e.type}${e.subject ? ` - ${e.subject}` : ''}] ${(e.content || '').slice(0, 80)}${label ? ` (${label})` : ''}\n`;
      });
    }
  } else if (/thông báo|thong bao/.test(n)) {
    if (!s.notifications.length) content += 'Không có thông báo mới.';
    else {
      content += 'Thông báo:\n';
      s.notifications.slice(0, 4).forEach((x) => {
        content += `• ${x.title}${x.read ? '' : ' (chưa đọc)'}\n`;
      });
    }
  } else if (/lịch học|lich hoc|thời khóa biểu|thoi khoa bieu|tkb|tuan nay|tuần này|tiết học|tiet hoc/.test(n)) {
    content += 'Để xem TKB chi tiết, hãy chọn gợi ý **「Lịch học tuần này」** hoặc mở **Lịch học** (/schedule).';
  } else if (/tóm tắt|tom tat|tổng quan|tong quan|tình hình/.test(n)) {
    content += `Điểm HK1: ${hk1.map((x) => `${x.subject} ${x.average.toFixed(1)}`).join(', ') || 'chưa có'}\n`;
    content += `Vắng (20 buổi gần nhất): ${s.attendance.recent_absent_days} buổi\n`;
    if (weakest) content += `Cần chú ý: ${weakest.subject} (TB ${weakest.average.toFixed(1)})\n`;
    if (unpaid.length) content += `Học phí: còn ${unpaid.length} khoản chưa đóng đủ.\n`;
  } else {
    content += 'Em chỉ hỗ trợ tra cứu học tập trên EduSmart (điểm, lịch, học phí, nhận xét…). Thử hỏi:\n';
    content += '• "Tóm tắt tình hình học tập"\n';
    content += '• "Học phí đã đóng chưa?"\n';
    content += '• "Điểm con tôi môn Toán?"\n';
  }

  return { type: 'chat', message: content.trim(), payload: null, chips: DEFAULT_CHIPS };
};

const buildLlmUnavailableHint = () => {
  const err = llm.getLastChatError?.();
  if (err && /401|403|invalid|authentication|api.key/i.test(err)) {
    return '\n\n_(API key LLM không hợp lệ — cập nhật ANTHROPIC_API_KEY hoặc GEMINI_API_KEY thật trong backend/.env, rồi khởi động lại server.)_';
  }
  if (!llm.isConfigured()) {
    return '\n\n_(Chưa cấu hình LLM — thêm API key vào backend/.env để hỏi tự do bằng AI.)_';
  }
  return '\n\n_(AI tạm thời không phản hồi — thử lại sau hoặc dùng các câu tra cứu bên dưới.)_';
};

const answerFreeform = async ({ message, childId, chatHistory = [], userRole = 'parent', persona }) => {
  const snapshot = await buildStudentSnapshot(childId);
  if (!snapshot) {
    return {
      type: 'chat',
      message: 'Không tải được hồ sơ học sinh.',
      payload: null,
      chips: DEFAULT_CHIPS,
    };
  }

  if (!llm.isConfigured()) {
    return answerWithoutLlm(message, snapshot);
  }

  const system = buildSystemPrompt(snapshot, userRole, persona || userRole);
  const history = (chatHistory || [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-10)
    .map((m) => ({
      role: m.role,
      content: (m.content || '').slice(0, 500),
    }));

  const userContent = `${message}

(Cuối câu trả lời, thêm 1 dòng JSON: {"chips":["câu hỏi 1","câu hỏi 2","câu hỏi 3"]} — gợi ý tiếp, ≤12 từ mỗi câu)`;

  try {
    const raw = await llm.chat({
      system,
      messages: [...history, { role: 'user', content: userContent }],
      maxTokens: 700,
    });

    if (!raw) {
      const fb = await answerWithoutLlm(message, snapshot);
      return { ...fb, message: fb.message + buildLlmUnavailableHint() };
    }

    const { content, chips } = parseChipsFromText(raw);
    return {
      type: 'chat',
      message: content,
      payload: { snapshot_summary: true },
      chips,
    };
  } catch (err) {
    console.error('[AI] Conversational failed:', err.message);
    return answerWithoutLlm(message, snapshot);
  }
};

module.exports = { answerFreeform, answerWithoutLlm, DEFAULT_CHIPS };
