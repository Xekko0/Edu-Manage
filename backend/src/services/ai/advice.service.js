/**
 * Lớp 4 — AI Advice (~380 token khi có LLM).
 * Không có API → tư vấn mẫu từ điểm thực tế (0 token).
 */
const llm = require('./llm.service');

const DEFAULT_CHIPS = ['Xem điểm chi tiết', 'Lịch học tuần này'];

const generateAdviceByRules = (subjectAverages, focusSubject) => {
  const list = focusSubject
    ? subjectAverages.filter((s) =>
        s.subject_name.toLowerCase().includes((focusSubject || '').toLowerCase()),
      )
    : subjectAverages;

  if (!list.length) {
    return {
      content: 'Chưa có dữ liệu điểm để tư vấn. Bạn có thể hỏi "Điểm con tôi" hoặc "Lịch học tuần này".',
      chips: DEFAULT_CHIPS,
    };
  }

  const sorted = [...list].sort((a, b) => a.average - b.average);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];
  const focus = focusSubject || weakest.subject_name;

  let content = `📊 Tổng quan môn ${focus}:\n`;
  list.forEach((s) => {
    content += `• ${s.subject_name}: ${s.average.toFixed(2)} (${s.grade})\n`;
  });

  if (weakest.average < 5) {
    content += `\nMôn ${weakest.subject_name} cần ưu tiên (TB ${weakest.average.toFixed(2)}). `
      + 'Gợi ý: ôn 20–30 phút/ngày, làm bài tập về nhà đầy đủ, hỏi thầy cô phần chưa hiểu.';
  } else if (weakest.average < 6.5) {
    content += `\nCó thể cải thiện ${weakest.subject_name} lên khá bằng luyện đề và xem lại lỗi sai cũ.`;
  } else {
    content += `\nKết quả ổn định. Nên duy trì thói quen học đều và thử thách thêm bài nâng cao.`;
  }

  if (strongest.subject_name !== weakest.subject_name && strongest.average >= 8) {
    content += `\nĐiểm mạnh: ${strongest.subject_name} (${strongest.average.toFixed(2)}) — có thể kết hợp phương pháp học môn này cho các môn khác.`;
  }

  if (!llm.isConfigured()) {
    content += '\n\n_(Chế độ cơ bản — thêm API key LLM hợp lệ vào backend/.env để tư vấn chi tiết từ AI.)_';
  }

  return {
    content: content.trim(),
    chips: [`Điểm môn ${focus}`, 'Lịch học tuần này', 'Con có vắng buổi nào không?'],
  };
};

const parseAdviceResponse = (fullText) => {
  const chipMatch = fullText.match(/\{\s*"chips"\s*:\s*\[[^\]]+\]\s*\}/);
  let chips = DEFAULT_CHIPS;
  if (chipMatch) {
    try {
      chips = JSON.parse(chipMatch[0]).chips;
    } catch (_) {}
  }
  const content = fullText.replace(/\{\s*"chips".*\}\s*$/s, '').trim();
  return { content, chips };
};

const generateAdvice = async (subjectAverages, focusSubject) => {
  if (!subjectAverages?.length) {
    return generateAdviceByRules([], focusSubject);
  }

  if (!llm.isConfigured()) {
    return generateAdviceByRules(subjectAverages, focusSubject);
  }

  const summary = subjectAverages
    .map((s) => `- ${s.subject_name}: ${s.average.toFixed(2)} (${s.grade})`)
    .join('\n');

  const userPrompt = `Dữ liệu điểm hiện tại của học sinh:\n${summary}\n\nMôn cần tư vấn: ${focusSubject || 'tổng quát'}.\n
Hãy trả lời ngắn gọn (≤120 từ), thân thiện, bằng tiếng Việt:
1) Nhận xét tình hình học tập môn này.
2) Đưa 2-3 gợi ý cụ thể để cải thiện.
Sau đó, ở dòng cuối cùng, in DUY NHẤT một JSON: {"chips":["...","..."]} chứa 2 câu hỏi gợi ý tiếp theo (≤10 từ mỗi câu).`;

  try {
    const fullText = await llm.complete({ user: userPrompt, maxTokens: 400 });
    if (!fullText) return generateAdviceByRules(subjectAverages, focusSubject);
    return parseAdviceResponse(fullText);
  } catch (err) {
    console.error('[AI] Advice failed:', err.message);
    return generateAdviceByRules(subjectAverages, focusSubject);
  }
};

module.exports = { generateAdvice, generateAdviceByRules };
