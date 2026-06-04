/**
 * Readonly middleware — chặn HS/PH thực hiện method ghi (POST/PUT/PATCH/DELETE).
 * Đặt sớm trước các route group nên tự decode JWT (auth.middleware chỉ chạy sau).
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Endpoint mà HS/PH được phép POST/PATCH dù read-only
const ALLOWED_WRITE_PREFIXES = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/chat/message',
  '/api/chat/end-session',
  '/api/push/subscribe',
];

// PATCH thông báo (đánh dấu đã đọc) đặt ngoại lệ riêng:
//   PATCH /api/notifications/:id/read  → hợp lệ
const isMarkNotificationRead = (url, method) =>
  method === 'PATCH' && /^\/api\/notifications\/\d+\/read$/.test(url);

const readonlyForStudentParent = (req, res, next) => {
  if (!WRITE_METHODS.has(req.method)) return next();

  // Cho phép các endpoint công khai (login/refresh/...)
  if (ALLOWED_WRITE_PREFIXES.some((p) => req.originalUrl.startsWith(p))) return next();

  // Lấy token từ header
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(); // auth.middleware sẽ chặn riêng

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch (_) {
    return next();
  }

  if (!['student', 'parent'].includes(payload.role)) return next();

  // Cho phép HS/PH PATCH thông báo của chính mình + các endpoint trong whitelist
  if (isMarkNotificationRead(req.originalUrl, req.method)) return next();
  if (
    (req.method === 'POST' && req.originalUrl.startsWith('/api/chat')) ||
    (req.method === 'POST' && req.originalUrl.startsWith('/api/auth')) ||
    (req.method === 'POST' && req.originalUrl.startsWith('/api/push/subscribe')) ||
    (req.method === 'DELETE' && req.originalUrl.startsWith('/api/push/subscribe'))
  ) return next();

  return res.status(403).json({
    success: false,
    message: 'Tài khoản học sinh/phụ huynh không có quyền chỉnh sửa dữ liệu',
  });
};

module.exports = readonlyForStudentParent;
