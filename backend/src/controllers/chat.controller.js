/**
 * Chat controller — AI Chatbot Widget (SRS 2.7).
 * Pipeline 4 lớp: Intent → Context → Router → (Advice nếu cần)
 */
const crypto = require('crypto');
const { ChatSession } = require('../models');
const intentService = require('../services/ai/intent.service');
const contextService = require('../services/ai/context.service');
const routerService = require('../services/ai/router.service');
const { success, error } = require('../utils/responseHelper');

const sendMessage = async (req, res) => {
  try {
    if (!['parent', 'student'].includes(req.user.role)) {
      return error(res, 'Chỉ Phụ huynh và Học sinh được dùng AI Widget', 403);
    }

    const { message, session_token } = req.body;
    if (!message?.trim()) return error(res, 'Tin nhắn rỗng', 400);

    // Lớp 1: Intent
    const intent = await intentService.detectIntent(message);

    // Lớp 2: Inject context (0 token)
    const ctx = await contextService.injectContext(intent, req.user);

    // Lớp 3: Function router (Lớp 4 — advice — gọi bên trong nếu intent=ai_advice)
    const result = await routerService.route(ctx);

    // Lưu lịch sử chat (theo session)
    const token = session_token || crypto.randomBytes(16).toString('hex');
    const [session] = await ChatSession.findOrCreate({
      where: { session_token: token },
      defaults: { user_id: req.user.id, session_token: token, messages: [] },
    });
    const messages = [
      ...(session.messages || []),
      { role: 'user', content: message, timestamp: Date.now() },
      { role: 'assistant', content: result.message, intent: intent.intent, timestamp: Date.now() },
    ];
    session.messages = messages;
    await session.save();

    return success(res, {
      session_token: token,
      intent: intent.intent,
      type: result.type,
      message: result.message,
      payload: result.payload,
      chips: result.chips,
    });
  } catch (err) {
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

module.exports = { sendMessage, endSession };
