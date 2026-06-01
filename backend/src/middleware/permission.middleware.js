/**
 * Permission middleware — kiểm tra role có permission cụ thể không.
 * Dùng kết hợp với scope middleware (homeroom/assignment/parentLink) khi cần.
 *
 * Cách dùng:
 *   router.post('/foo', auth, permission('user.create.any'), ctrl.foo);
 */
const { can } = require('../config/permissions');
const { error } = require('../utils/responseHelper');

const permission = (permKey) => (req, res, next) => {
  if (!req.user) return error(res, 'Chưa xác thực', 401);
  if (!can(req.user.role, permKey)) {
    return error(res, `Bạn không có quyền (${permKey})`, 403);
  }
  next();
};

module.exports = permission;
