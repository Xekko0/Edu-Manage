/**
 * Verify JWT access token + gắn req.user.
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { error } = require('../utils/responseHelper');

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return error(res, 'Thiếu token xác thực', 401);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return error(res, 'Token không hợp lệ hoặc đã hết hạn', 401);
  }
};

module.exports = authMiddleware;
