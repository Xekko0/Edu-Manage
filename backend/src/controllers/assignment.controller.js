/**
 * Assignment controller — phân công GVBM (SRS 2.6) — MỚI v1.1.
 */
const { TeacherAssignment, User, Class, Subject } = require('../models');
const { success, error } = require('../utils/responseHelper');
const {
  validateAssignmentAgainstCurriculum,
  syncAssignmentsFromCurriculum,
} = require('../services/scheduling/curriculum');

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

const parsePeriodsPerWeek = (value) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 1 || n > 10) {
    const err = new Error('Số tiết/tuần phải từ 1 đến 10');
    err.status = 400;
    throw err;
  }
  return n;
};

const create = async (req, res) => {
  try {
    const {
      teacher_id, class_id, subject_id, school_year, periods_per_week, allow_override,
    } = req.body;
    const sy = school_year || process.env.CURRENT_SCHOOL_YEAR || '2024-2025';
    const periods = periods_per_week !== undefined
      ? parsePeriodsPerWeek(periods_per_week)
      : 2;

    await validateAssignmentAgainstCurriculum({
      class_id,
      subject_id,
      school_year: sy,
      periods_per_week: periods,
      allow_override: !!allow_override,
    });

    const item = await TeacherAssignment.create({
      teacher_id,
      class_id,
      subject_id,
      school_year: sy,
      periods_per_week: periods,
    });
    return success(res, item, 'Phân công thành công', 201);
  } catch (err) {
    return error(res, err.message || 'Phân công thất bại', err.status || 400, err.message);
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

const syncCurriculum = async (req, res) => {
  try {
    const school_year = req.body.school_year
      || req.query.school_year
      || process.env.CURRENT_SCHOOL_YEAR
      || '2024-2025';
    const result = await syncAssignmentsFromCurriculum(school_year);
    const msg = result.curriculum_ok
      ? `Đã đồng bộ ${result.updated_count} phân công — khớp khung CT`
      : `Đã cập nhật ${result.updated_count} phân công; còn ${result.remaining_issues} lệch (thiếu khung CT môn)`;
    return success(res, result, msg);
  } catch (err) {
    return error(res, err.message || 'Đồng bộ thất bại', err.status || 400);
  }
};

module.exports = { list, create, remove, myAssignments, syncCurriculum };
