/**
 * Rate limit toàn cục: 100 req/phút/IP (theo SRS mục 3).
 */
const rateLimit = require('express-rate-limit');

const rateLimitMiddleware = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau ít phút.' },
});

module.exports = rateLimitMiddleware;
