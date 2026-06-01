/**
 * Lớp 4 — AI Advice (~380 token).
 * Chỉ gọi khi intent = ai_advice.
 * Trả lời tư vấn học tập có ngữ cảnh điểm + 2 quick chips gợi ý câu hỏi tiếp theo.
 */
const Anthropic = require('@anthropic-ai/sdk');
const env = require('../../config/env');

const client = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

const generateAdvice = async (subjectAverages, focusSubject) => {
  if (!client) {
    return {
      content: 'Không thể kết nối dịch vụ AI lúc này. Vui lòng thử lại sau.',
      chips: ['Xem điểm', 'Lịch học tuần này'],
    };
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
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 400,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const fullText = response.content?.[0]?.text || '';
    const chipMatch = fullText.match(/\{\s*"chips"\s*:\s*\[[^\]]+\]\s*\}/);
    let chips = ['Xem điểm chi tiết', 'Lịch học tuần này'];
    if (chipMatch) {
      try {
        chips = JSON.parse(chipMatch[0]).chips;
      } catch (_) {}
    }

    const content = fullText.replace(/\{\s*"chips".*\}\s*$/s, '').trim();
    return { content, chips };
  } catch (err) {
    console.error('[AI] Advice failed:', err.message);
    return {
      content: 'Hệ thống AI tạm thời gặp sự cố. Vui lòng thử lại sau.',
      chips: ['Xem điểm', 'Lịch học tuần này'],
    };
  }
};

module.exports = { generateAdvice };
