/**
 * Rate limit — toàn cục + chat riêng.
 */
const rateLimit = require('express-rate-limit');

const rateLimitMiddleware = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau ít phút.' },
});

/** ~20 tin chat / phút / user (theo user id sau auth) */
const chatRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `chat-${req.user?.id || req.ip}`,
  message: { success: false, message: 'Bạn gửi tin nhắn quá nhanh. Vui lòng đợi một chút.' },
});

module.exports = rateLimitMiddleware;
module.exports.chatRateLimit = chatRateLimit;
