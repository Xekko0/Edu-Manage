/**
 * Evaluation controller — đánh giá / nhận xét học sinh.
 *
 *   - GVCN: tạo type='homeroom' và 'conduct' cho HS lớp mình
 *   - GVBM: tạo type='subject' cho HS lớp mình DẠY môn đó
 *   - HS / PH: xem đánh giá của bản thân / con
 */
const { Evaluation, Student, Subject, User, Class, TeacherAssignment } = require('../models');
const { success, error } = require('../utils/responseHelper');

const create = async (req, res) => {
  try {
    const { student_id, subject_id, type, semester, school_year, content, conduct_grade } = req.body;
    if (!student_id || !type || !semester || !school_year || !content) {
      return error(res, 'Thiếu trường bắt buộc', 400);
    }

    const student = await Student.findByPk(student_id);
    if (!student) return error(res, 'Không tìm thấy học sinh', 404);

    if (req.user.role !== 'admin') {
      if (type === 'subject') {
        if (!subject_id) return error(res, 'Đánh giá môn cần subject_id', 400);
        const allowed = await TeacherAssignment.findOne({
          where: {
            teacher_id: req.user.id,
            class_id: student.class_id,
            subject_id,
            is_active: true,
          },
        });
        if (!allowed) return error(res, 'Bạn chưa được phân công dạy môn này tại lớp HS', 403);
      } else {
        // homeroom | conduct → phải là GVCN lớp đó
        const cls = await Class.findByPk(student.class_id);
        if (!cls || cls.homeroom_teacher_id !== req.user.id) {
          return error(res, 'Chỉ GVCN được tạo đánh giá tổng / hạnh kiểm', 403);
        }
      }
    }

    const evaluation = await Evaluation.create({
      student_id, subject_id, type, semester, school_year, content, conduct_grade,
      teacher_id: req.user.id,
    });
    return success(res, evaluation, 'Tạo đánh giá thành công', 201);
  } catch (err) {
    return error(res, 'Tạo đánh giá thất bại', 400, err.message);
  }
};

const update = async (req, res) => {
  try {
    const ev = await Evaluation.findByPk(req.params.id);
    if (!ev) return error(res, 'Không tìm thấy đánh giá', 404);
    if (req.user.role !== 'admin' && ev.teacher_id !== req.user.id) {
      return error(res, 'Bạn không có quyền sửa đánh giá này', 403);
    }
    await ev.update(req.body);
    return success(res, ev, 'Cập nhật đánh giá thành công');
  } catch (err) {
    return error(res, 'Cập nhật thất bại', 400, err.message);
  }
};

/** Lấy danh sách đánh giá của 1 HS (HS/PH đã pass parentLink ở route). */
const listByStudent = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { semester, school_year, type } = req.query;
    const where = { student_id };
    if (semester) where.semester = semester;
    if (school_year) where.school_year = school_year;
    if (type) where.type = type;

    const items = await Evaluation.findAll({
      where,
      include: [
        { model: User, as: 'teacher', attributes: ['id', 'full_name'] },
        { model: Subject, as: 'subject' },
      ],
      order: [['createdAt', 'DESC']],
    });
    return success(res, items);
  } catch (err) {
    return error(res, 'Lỗi tải đánh giá', 500, err.message);
  }
};

const remove = async (req, res) => {
  try {
    const ev = await Evaluation.findByPk(req.params.id);
    if (!ev) return error(res, 'Không tìm thấy', 404);
    if (req.user.role !== 'admin' && ev.teacher_id !== req.user.id) {
      return error(res, 'Bạn không có quyền xóa', 403);
    }
    await ev.destroy();
    return success(res, {}, 'Đã xóa đánh giá');
  } catch (err) {
    return error(res, 'Xóa thất bại', 400, err.message);
  }
};

module.exports = { create, update, listByStudent, remove };
