/**
 * Class Journal controller — Sổ đầu bài.
 *   - GVBM: ghi 1 dòng/tiết môn mình dạy (subject_id phải đúng assignment)
 *   - GVCN: ghi nhận xét tổng buổi cho lớp mình (subject_id = null)
 *   - HS / PH: chỉ xem sổ đầu bài của lớp mình / con mình
 */
const { ClassJournal, Subject, User, Class, Student, TeacherAssignment } = require('../models');
const { success, error } = require('../utils/responseHelper');

const create = async (req, res) => {
  try {
    const { class_id, subject_id, lesson_date, period, content, discipline_note, rating, absent_count } = req.body;
    if (!class_id || !lesson_date) {
      return error(res, 'Thiếu class_id hoặc lesson_date', 400);
    }

    // Phân quyền:
    if (req.user.role !== 'admin') {
      const cls = await Class.findByPk(class_id);
      if (!cls) return error(res, 'Không tìm thấy lớp', 404);

      if (subject_id) {
        // Ghi tiết môn → phải có assignment
        const allowed = await TeacherAssignment.findOne({
          where: { teacher_id: req.user.id, class_id, subject_id, is_active: true },
        });
        if (!allowed) return error(res, 'Bạn không được ghi sổ tiết này (không có phân công)', 403);
      } else {
        // Ghi tổng buổi → phải là GVCN lớp đó
        if (cls.homeroom_teacher_id !== req.user.id) {
          return error(res, 'Chỉ GVCN được ghi nhận xét tổng cho lớp', 403);
        }
      }
    }

    const item = await ClassJournal.create({
      class_id, subject_id, lesson_date, period, content, discipline_note, rating, absent_count,
      teacher_id: req.user.id,
    });
    return success(res, item, 'Ghi sổ đầu bài thành công', 201);
  } catch (err) {
    return error(res, 'Ghi sổ thất bại', 400, err.message);
  }
};

const update = async (req, res) => {
  try {
    const j = await ClassJournal.findByPk(req.params.id);
    if (!j) return error(res, 'Không tìm thấy bản ghi', 404);
    if (req.user.role !== 'admin' && j.teacher_id !== req.user.id) {
      return error(res, 'Chỉ giáo viên tạo bản ghi mới được sửa', 403);
    }
    await j.update(req.body);
    return success(res, j, 'Cập nhật sổ thành công');
  } catch (err) {
    return error(res, 'Cập nhật thất bại', 400, err.message);
  }
};

/** Liệt kê sổ theo lớp & ngày (PH/HS truy cập lớp của con/mình). */
const listByClass = async (req, res) => {
  try {
    const { class_id } = req.params;
    const { from, to } = req.query;

    // Phân quyền xem sổ lớp:
    if (req.user.role === 'student') {
      const stu = await Student.findOne({ where: { user_id: req.user.id } });
      if (!stu || stu.class_id !== parseInt(class_id, 10)) {
        return error(res, 'Bạn chỉ xem được sổ lớp mình', 403);
      }
    } else if (req.user.role === 'parent') {
      const parent = await User.findByPk(req.user.id, { include: [{ model: Student, as: 'children' }] });
      const ok = (parent.children || []).some((c) => c.class_id === parseInt(class_id, 10));
      if (!ok) return error(res, 'Bạn chỉ xem được sổ lớp của con', 403);
    } else if (['homeroom', 'subject'].includes(req.user.role)) {
      const cls = await Class.findByPk(class_id);
      const isHR = cls?.homeroom_teacher_id === req.user.id;
      const isAssigned = await TeacherAssignment.findOne({
        where: { teacher_id: req.user.id, class_id, is_active: true },
      });
      if (!isHR && !isAssigned) return error(res, 'Bạn không có quyền xem sổ lớp này', 403);
    }

    const where = { class_id };
    if (from && to) where.lesson_date = { [require('sequelize').Op.between]: [from, to] };

    const items = await ClassJournal.findAll({
      where,
      include: [
        { model: Subject, as: 'subject' },
        { model: User, as: 'teacher', attributes: ['id', 'full_name'] },
      ],
      order: [['lesson_date', 'DESC'], ['period', 'ASC']],
    });
    return success(res, items);
  } catch (err) {
    return error(res, 'Lỗi tải sổ đầu bài', 500, err.message);
  }
};

const remove = async (req, res) => {
  try {
    const j = await ClassJournal.findByPk(req.params.id);
    if (!j) return error(res, 'Không tìm thấy', 404);
    if (req.user.role !== 'admin' && j.teacher_id !== req.user.id) {
      return error(res, 'Bạn không có quyền xóa', 403);
    }
    await j.destroy();
    return success(res, {}, 'Đã xóa');
  } catch (err) {
    return error(res, 'Xóa thất bại', 400, err.message);
  }
};

module.exports = { create, update, listByClass, remove };
