/**
 * Chat controller — AI Widget (5 persona).
 */
const crypto = require('crypto');
const { ChatSession } = require('../models');
const orchestrator = require('../services/ai/chat-orchestrator.service');
const llm = require('../services/ai/llm.service');
const { success, error } = require('../utils/responseHelper');

const estimateTokens = (text) => Math.ceil((text || '').length / 4);

const saveSession = async (token, userId, message, intent, result, persona) => {
  const [session] = await ChatSession.findOrCreate({
    where: { session_token: token },
    defaults: { user_id: userId, session_token: token, messages: [] },
  });
  const added = estimateTokens(message) + estimateTokens(result.message);
  session.messages = [
    ...(session.messages || []),
    { role: 'user', content: message, timestamp: Date.now() },
    {
      role: 'assistant',
      content: result.message,
      intent: intent.intent,
      persona,
      timestamp: Date.now(),
    },
  ];
  session.total_tokens = (session.total_tokens || 0) + added;
  await session.save();
  return session;
};

const sendMessage = async (req, res) => {
  try {
    const { message, session_token, student_id, class_id } = req.body;
    if (!message?.trim()) return error(res, 'Tin nhắn rỗng', 400);

    const token = session_token || crypto.randomBytes(16).toString('hex');
    const [session] = await ChatSession.findOrCreate({
      where: { session_token: token },
      defaults: { user_id: req.user.id, session_token: token, messages: [] },
    });
    const chatHistory = (session.messages || []).slice(-12);

    const out = await orchestrator.handleMessage(req.user, {
      message,
      chatHistory,
      student_id,
      class_id,
    });

    await saveSession(token, req.user.id, message, out.intent, out.result, out.persona);

    return success(res, {
      session_token: token,
      persona: out.persona,
      audience: out.audience,
      intent: out.intent.intent,
      intent_source: out.intent_source,
      ai_mode: out.ai_mode,
      source: out.meta?.source || 'module',
      tool_id: out.meta?.toolId || out.intent.intent,
      type: out.result.type,
      message: out.result.message,
      payload: out.result.payload,
      chips: out.result.chips,
      ...(out.result.chip_actions ? { chip_actions: out.result.chip_actions } : {}),
      ...(out.activeClassId ? { active_class_id: out.activeClassId } : {}),
    });
  } catch (err) {
    if (err.statusCode === 403) return error(res, err.message, 403);
    if (err.statusCode === 404) return error(res, err.message, 404);
    console.error('[CHAT] error:', err);
    return error(res, 'Lỗi xử lý chat AI', 500, err.message);
  }
};

const endSession = async (req, res) => {
  try {
    const { session_token } = req.body;
    await ChatSession.update(
      { ended_at: new Date() },
      { where: { session_token, user_id: req.user.id } },
    );
    return success(res, {}, 'Đã kết thúc phiên chat');
  } catch (err) {
    return error(res, 'Lỗi kết thúc phiên', 500, err.message);
  }
};

const getAiStatus = async (req, res) => {
  try {
    const persona = await orchestrator.resolvePersona(req.user);
    if (!persona) return error(res, 'Vai trò không hỗ trợ AI Widget', 403);

    const provider = llm.getProvider();
    const llmConfigured = llm.isConfigured();
    return success(res, {
      widget_enabled: true,
      persona,
      audience: orchestrator.FAMILY_PERSONAS.includes(persona) ? 'family' : 'staff',
      role: req.user.role,
      llm_configured: llmConfigured,
      provider: provider || null,
      mode: llmConfigured ? 'conversational' : 'rules',
      capabilities: orchestrator.getCapabilitiesForPersona(persona),
      hint: llmConfigured
        ? `AI đang dùng ${provider} API`
        : 'Cấu hình ANTHROPIC_API_KEY hoặc GEMINI_API_KEY hợp lệ trong backend/.env (không dùng giá trị mẫu sk-ant-...)',
    });
  } catch (err) {
    return error(res, 'Lỗi trạng thái AI', 500, err.message);
  }
};

const listSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.findAll({
      where: { user_id: req.user.id },
      order: [['updated_at', 'DESC']],
      limit: 20,
    });
    const items = sessions.map((s) => ({
      session_token: s.session_token,
      message_count: (s.messages || []).length,
      total_tokens: s.total_tokens,
      ended_at: s.ended_at,
      preview: (s.messages || []).slice(-1)[0]?.content?.slice(0, 80) || '',
      updated_at: s.updatedAt,
    }));
    return success(res, items);
  } catch (err) {
    return error(res, 'Lỗi tải phiên chat', 500, err.message);
  }
};

const getSessionHistory = async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      where: { session_token: req.params.token, user_id: req.user.id },
    });
    if (!session) return error(res, 'Không tìm thấy phiên', 404);
    return success(res, {
      session_token: session.session_token,
      messages: session.messages || [],
      ended_at: session.ended_at,
    });
  } catch (err) {
    return error(res, 'Lỗi tải lịch sử', 500, err.message);
  }
};

const deleteSession = async (req, res) => {
  try {
    const deleted = await ChatSession.destroy({
      where: { session_token: req.params.token, user_id: req.user.id },
    });
    if (!deleted) return error(res, 'Không tìm thấy phiên', 404);
    return success(res, {}, 'Đã xóa phiên chat');
  } catch (err) {
    return error(res, 'Lỗi xóa phiên', 500, err.message);
  }
};

module.exports = {
  sendMessage,
  endSession,
  getAiStatus,
  listSessions,
  getSessionHistory,
  deleteSession,
};
