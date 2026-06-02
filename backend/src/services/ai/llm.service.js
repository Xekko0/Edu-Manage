/**
 * Lớp LLM thống nhất — Anthropic hoặc Gemini (theo AI_PROVIDER / key có sẵn).
 */
const Anthropic = require('@anthropic-ai/sdk');
const env = require('../../config/env');

const ANTHROPIC_MODEL = 'claude-3-5-haiku-latest';
const GEMINI_MODEL = 'gemini-2.0-flash';

let anthropicClient = null;
let geminiModel = null;
let lastChatError = null;

/** Key mẫu trong .env.example — không coi là đã cấu hình LLM */
const isPlaceholderKey = (key) => {
  if (!key || typeof key !== 'string') return true;
  const k = key.trim();
  if (k.length < 24) return true;
  if (/\.\.\.|your_|api_key|xxx|placeholder|changeme/i.test(k)) return true;
  if (/^sk-ant-\.\.\.$/i.test(k)) return true;
  return false;
};

const initClients = () => {
  if (env.ANTHROPIC_API_KEY && !isPlaceholderKey(env.ANTHROPIC_API_KEY) && !anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  if (env.GEMINI_API_KEY && !isPlaceholderKey(env.GEMINI_API_KEY) && !geminiModel) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      geminiModel = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    } catch (err) {
      console.warn('[AI] Gemini SDK chưa cài hoặc lỗi khởi tạo:', err.message);
    }
  }
};

/** Provider đang dùng: anthropic | gemini | null */
const getProvider = () => {
  initClients();
  const preferred = (env.AI_PROVIDER || 'anthropic').toLowerCase();
  if (preferred === 'gemini' && geminiModel && !isPlaceholderKey(env.GEMINI_API_KEY)) return 'gemini';
  if (preferred === 'anthropic' && anthropicClient && !isPlaceholderKey(env.ANTHROPIC_API_KEY)) {
    return 'anthropic';
  }
  if (anthropicClient && !isPlaceholderKey(env.ANTHROPIC_API_KEY)) return 'anthropic';
  if (geminiModel && !isPlaceholderKey(env.GEMINI_API_KEY)) return 'gemini';
  return null;
};

const isConfigured = () => !!getProvider();

const getLastChatError = () => lastChatError;

/**
 * Gọi LLM một lượt — trả text hoặc null.
 */
const complete = async ({ system, user, maxTokens = 300 }) =>
  chat({
    system,
    messages: [{ role: 'user', content: user }],
    maxTokens,
  });

/**
 * Hội thoại nhiều lượt — messages: [{ role: 'user'|'assistant', content }]
 */
const chat = async ({ system, messages, maxTokens = 700 }) => {
  const provider = getProvider();
  if (!provider || !messages?.length) return null;

  const safeMessages = messages
    .filter((m) => m.content?.trim())
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content.trim(),
    }));

  if (!safeMessages.length) return null;

  try {
    if (provider === 'anthropic') {
      const payload = {
        model: ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        messages: safeMessages,
      };
      if (system) payload.system = system;
      const response = await anthropicClient.messages.create(payload);
      return response.content?.[0]?.text?.trim() || null;
    }

    const history = safeMessages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const last = safeMessages[safeMessages.length - 1];
    const chatSession = geminiModel.startChat({
      history,
      systemInstruction: system || undefined,
    });
    const result = await chatSession.sendMessage(last.content);
    return result.response?.text?.()?.trim() || null;
  } catch (err) {
    lastChatError = err.message || String(err);
    console.error(`[AI] LLM chat (${provider}) failed:`, lastChatError);
    return null;
  }
};

module.exports = {
  complete,
  chat,
  getProvider,
  isConfigured,
  isPlaceholderKey,
  getLastChatError,
  GEMINI_MODEL,
  ANTHROPIC_MODEL,
};
