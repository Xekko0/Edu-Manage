/**
 * Kiểm tra role người dùng (RBAC).
 * Sử dụng: roleMiddleware('admin', 'homeroom')
 */
const { error } = require('../utils/responseHelper');

const roleMiddleware = (...allowed) => (req, res, next) => {
  if (!req.user) return error(res, 'Chưa xác thực', 401);
  if (!allowed.includes(req.user.role)) {
    return error(res, 'Bạn không có quyền truy cập chức năng này', 403);
  }
  next();
};

module.exports = roleMiddleware;
