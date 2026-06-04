/**
 * Kiểm tra GV/Admin được xem dữ liệu theo lớp:
 * - Admin: mọi lớp
 * - GVCN: lớp chủ nhiệm (full)
 * - GVBM: lớp có phân công (lọc theo môn ở controller)
 */
const { canAccessClass } = require('../services/access/teacher-capabilities.service');
const { error } = require('../utils/responseHelper');

const classView = async (req, res, next) => {
  try {
    const class_id = parseInt(
      req.params.class_id || req.body.class_id || req.query.class_id,
      10,
    );
    if (!class_id) return error(res, 'Thiếu class_id', 400);

    const access = await canAccessClass(req.user.id, class_id, req.user.role);
    if (!access.ok) {
      return error(res, 'Bạn không có quyền xem dữ liệu lớp này', 403);
    }

    req.classView = { class_id, ...access };
    next();
  } catch (err) {
    return error(res, 'Lỗi kiểm tra quyền lớp', 500, err.message);
  }
};

module.exports = classView;
