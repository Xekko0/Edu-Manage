/**
 * Lớp 1 — Intent Detection.
 * Gửi prompt ~150 token tới LLM (Claude Haiku / Gemini Flash) → trả JSON intent.
 */
const Anthropic = require('@anthropic-ai/sdk');
const env = require('../../config/env');

const SYSTEM_PROMPT = `Bạn là bộ phân loại ý định cho ứng dụng quản lý học sinh EduSmart.
Nhiệm vụ: đọc tin nhắn của phụ huynh/học sinh và trả về DUY NHẤT một JSON với các trường:
{
  "intent": "view_scores" | "view_scores_subject" | "view_schedule" | "view_attendance" | "ai_advice" | "view_extracurricular" | "unknown",
  "subject": <tên môn nếu có, ví dụ "Toán", "Vật lý">,
  "semester": 1 | 2 | null,
  "week": <số tuần nếu có>
}
KHÔNG giải thích. KHÔNG markdown. CHỈ JSON hợp lệ.`;

const client = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

const detectIntent = async (message) => {
  if (!client) {
    return { intent: 'unknown', subject: null, semester: null, week: null };
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 150,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: message }],
    });

    const text = response.content?.[0]?.text || '{}';
    const cleaned = text.trim().replace(/^```json\s*|\s*```$/g, '');
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[AI] Intent detection failed:', err.message);
    return { intent: 'unknown', subject: null, semester: null, week: null };
  }
};

module.exports = { detectIntent };
