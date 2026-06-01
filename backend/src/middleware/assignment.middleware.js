/**
 * Kiểm tra giáo viên có quyền thao tác điểm môn × lớp đang yêu cầu không.
 *
 * Logic theo SRS 2.6 + PERMISSIONS.md:
 *   - Admin   : bypass
 *   - GVBM    : phải có dòng active trong teacher_assignments(teacher_id, class_id, subject_id)
 *   - GVCN    : có quyền nếu đồng thời được phân công GVBM môn đó ở lớp đó
 *               (chỉ là GVCN KHÔNG đủ — phải có assignment thêm)
 *               → đảm bảo "GVCN không sửa điểm môn không phải mình dạy".
 */
const { TeacherAssignment } = require('../models');
const { error } = require('../utils/responseHelper');

const assignmentMiddleware = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') return next();

    const class_id = req.body.class_id || req.params.class_id || req.query.class_id;
    const subject_id = req.body.subject_id || req.params.subject_id || req.query.subject_id;

    if (!class_id || !subject_id) {
      return error(res, 'Thiếu class_id hoặc subject_id', 400);
    }

    const allowed = await TeacherAssignment.findOne({
      where: {
        teacher_id: req.user.id,
        class_id,
        subject_id,
        is_active: true,
      },
    });

    if (!allowed) {
      return error(res, 'Không có quyền nhập/sửa điểm môn này tại lớp này', 403);
    }

    req.teacherAssignment = allowed;
    next();
  } catch (err) {
    return error(res, 'Lỗi kiểm tra phân công giáo viên', 500, err.message);
  }
};

module.exports = assignmentMiddleware;
