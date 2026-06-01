/**
 * Parent-link middleware — kiểm tra PH có liên kết với student_id đang xem không.
 * Admin & GV bypass. Học sinh chỉ được xem chính mình (xử lý ở selfStudent).
 *
 * Cách dùng:
 *   router.get('/scores/student/:student_id', auth, parentLink, ctrl.foo);
 */
const { User, Student } = require('../models');
const { error } = require('../utils/responseHelper');

const parentLink = async (req, res, next) => {
  try {
    const role = req.user.role;
    if (['admin', 'homeroom', 'subject'].includes(role)) return next();

    const student_id = parseInt(req.params.student_id || req.query.student_id || req.body.student_id, 10);
    if (!student_id) return error(res, 'Thiếu student_id', 400);

    if (role === 'student') {
      const own = await Student.findOne({ where: { user_id: req.user.id } });
      if (!own || own.id !== student_id) {
        return error(res, 'Bạn chỉ được xem dữ liệu của bản thân', 403);
      }
      return next();
    }

    if (role === 'parent') {
      const parent = await User.findByPk(req.user.id, {
        include: [{ model: Student, as: 'children', where: { id: student_id }, required: false }],
      });
      const linked = (parent?.children || []).some((c) => c.id === student_id);
      if (!linked) {
        return error(res, 'Bạn chỉ được xem dữ liệu của con đã được liên kết', 403);
      }
      return next();
    }

    return error(res, 'Không xác định được quyền truy cập', 403);
  } catch (err) {
    return error(res, 'Lỗi kiểm tra liên kết PH-HS', 500, err.message);
  }
};

module.exports = parentLink;
