/**
 * Hội thoại tự do — GV / Admin.
 */
const llm = require('./llm.service');
const { buildStaffSnapshot, snapshotToText, formatFeaturesText } = require('./staff-data.service');
const { getStaffCapabilities, HOW_TO_GUIDES } = require('./staff-capabilities');

const DEFAULT_CHIPS = [
  'Tôi có thể làm gì?',
  'Danh sách lớp tôi quản lý',
  'Điểm trung bình lớp',
  'Cách nhập điểm',
];

const PERSONA_PROMPTS = {
  admin: 'quản trị viên — toàn quyền hệ thống, không bịa thống kê.',
  gvcn: 'giáo viên chủ nhiệm — được quản lý HS/PH/điểm danh lớp CN + nhập điểm môn dạy.',
  gvbm: 'giáo viên bộ môn — CHỈ môn/lớp được phân công; KHÔNG điểm danh hay liên kết PH.',
};

const buildSystemPrompt = (snapshot, ctx) => {
  const p = ctx.persona || snapshot.staff?.persona || 'gvbm';
  const who = PERSONA_PROMPTS[p] || 'nhân viên';
  return `Bạn là trợ lý AI EduSmart cho ${who} (${snapshot.staff.name}).

QUY TẮC:
- CHỈ dùng dữ liệu JSON bên dưới.
- Gợi ý menu/path (/admin/..., /teacher/...).
- Không bịa số liệu. Tiếng Việt, ≤250 từ.

DỮ LIỆU:
${snapshotToText(snapshot)}`;
};

const parseChips = (text) => {
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

const answerWithoutLlm = (message, snapshot, ctx) => {
  const n = (message || '').toLowerCase();
  const caps = getStaffCapabilities(ctx.user_role, { isHomeroom: ctx.is_homeroom });

  if (/quyền|chức năng|làm gì|menu/.test(n)) {
    return { type: 'chat', message: formatFeaturesText(caps), payload: caps.features, chips: DEFAULT_CHIPS };
  }

  if (/lịch học|lich hoc|thời khóa biểu|thoi khoa bieu|tkb|tiết học|tiet hoc/.test(n)) {
    return {
      type: 'chat',
      message: 'Để xem TKB chi tiết, hãy hỏi **「Thời khóa biểu lớp」** / **「Lịch dạy của tôi」** hoặc mở **Lịch học** (/schedule).',
      payload: null,
      chips: ['Thời khóa biểu lớp', 'Lịch dạy của tôi', 'Tôi có thể làm gì?'],
      chip_actions: [{ label: 'Mở Lịch học', path: '/schedule' }],
    };
  }

  if (snapshot.school_stats) {
    const s = snapshot.school_stats;
    return {
      type: 'chat',
      message: `📊 Thống kê: ${s.classes} lớp, ${s.students} học sinh, ${s.teachers} giáo viên, ${s.assignments} phân công.`,
      payload: s,
      chips: ['Tôi có thể làm gì?', 'Danh sách lớp', 'Cách phân công GV'],
    };
  }

  if (snapshot.class_detail) {
    const d = snapshot.class_detail;
    return {
      type: 'chat',
      message: `Lớp ${snapshot.active_class?.name}: ${d.student_count} HS. TB cao nhất: ${d.score_overview_hk1[0]?.name || '—'} (${d.score_overview_hk1[0]?.overall?.toFixed(1) || '—'}).`,
      payload: d,
      chips: ['Điểm lớp HK1', 'Danh sách học sinh', 'Cách điểm danh'],
    };
  }

  return {
    type: 'chat',
    message: `${formatFeaturesText(caps)}\n\n_(Thêm API key LLM để hỏi tự do chi tiết hơn.)_`,
    payload: null,
    chips: DEFAULT_CHIPS,
  };
};

const answerStaffFreeform = async ({ message, ctx, chatHistory = [], persona }) => {
  if (persona) ctx.persona = persona;
  const snapshot = await buildStaffSnapshot(ctx);

  if (!llm.isConfigured()) {
    return answerWithoutLlm(message, snapshot, ctx);
  }

  const system = buildSystemPrompt(snapshot, ctx);
  const history = (chatHistory || [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-10)
    .map((m) => ({ role: m.role, content: (m.content || '').slice(0, 500) }));

  const userContent = `${message}\n\n(Cuối trả lời: {"chips":["...","...","..."]})`;

  const raw = await llm.chat({
    system,
    messages: [...history, { role: 'user', content: userContent }],
    maxTokens: 800,
  });

  if (!raw) return answerWithoutLlm(message, snapshot, ctx);

  const { content, chips } = parseChips(raw);
  return { type: 'chat', message: content, payload: { staff: true }, chips };
};

module.exports = { answerStaffFreeform, answerWithoutLlm, DEFAULT_CHIPS };
