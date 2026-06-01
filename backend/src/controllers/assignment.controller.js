/**
 * Assignment controller — phân công GVBM (SRS 2.6) — MỚI v1.1.
 */
const { TeacherAssignment, User, Class, Subject } = require('../models');
const { success, error } = require('../utils/responseHelper');

const list = async (req, res) => {
  try {
    const { teacher_id, class_id, school_year } = req.query;
    const where = { is_active: true };
    if (teacher_id) where.teacher_id = teacher_id;
    if (class_id) where.class_id = class_id;
    if (school_year) where.school_year = school_year;

    const items = await TeacherAssignment.findAll({
      where,
      include: [
        { model: User, as: 'teacher', attributes: ['id', 'full_name', 'email'] },
        { model: Class, as: 'class' },
        { model: Subject, as: 'subject' },
      ],
      order: [['id', 'DESC']],
    });
    return success(res, items);
  } catch (err) {
    return error(res, 'Lỗi tải phân công', 500, err.message);
  }
};

const create = async (req, res) => {
  try {
    const { teacher_id, class_id, subject_id, school_year } = req.body;
    const item = await TeacherAssignment.create({ teacher_id, class_id, subject_id, school_year });
    return success(res, item, 'Phân công thành công', 201);
  } catch (err) {
    return error(res, 'Phân công thất bại', 400, err.message);
  }
};

const remove = async (req, res) => {
  try {
    await TeacherAssignment.destroy({ where: { id: req.params.id } });
    return success(res, {}, 'Đã hủy phân công');
  } catch (err) {
    return error(res, 'Hủy phân công thất bại', 400, err.message);
  }
};

const myAssignments = async (req, res) => {
  try {
    const items = await TeacherAssignment.findAll({
      where: { teacher_id: req.user.id, is_active: true },
      include: [
        { model: Class, as: 'class' },
        { model: Subject, as: 'subject' },
      ],
    });
    return success(res, items);
  } catch (err) {
    return error(res, 'Lỗi tải phân công', 500, err.message);
  }
};

module.exports = { list, create, remove, myAssignments };
