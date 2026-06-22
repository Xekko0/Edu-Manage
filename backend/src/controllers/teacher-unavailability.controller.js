'use strict';

const { TeacherUnavailability, User } = require('../models');
const { success, error } = require('../utils/responseHelper');

const parseSchoolYear = (req) =>
  req.query.school_year || req.body.school_year || process.env.CURRENT_SCHOOL_YEAR || '2024-2025';

const list = async (req, res) => {
  try {
    const school_year = parseSchoolYear(req);
    const { teacher_id } = req.query;
    const where = { school_year };
    if (teacher_id) where.teacher_id = teacher_id;
    const items = await TeacherUnavailability.findAll({
      where,
      include: [{ model: User, as: 'teacher', attributes: ['id', 'full_name'] }],
      order: [['teacher_id', 'ASC'], ['day_of_week', 'ASC']],
    });
    return success(res, items);
  } catch (err) {
    return error(res, 'Lỗi tải lịch bận GV', 500, err.message);
  }
};

const create = async (req, res) => {
  try {
    const school_year = parseSchoolYear(req);
    const { teacher_id, day_of_week, session, period, reason } = req.body;
    if (!teacher_id || !day_of_week) {
      return error(res, 'Thiếu teacher_id hoặc day_of_week', 400);
    }
    const item = await TeacherUnavailability.create({
      teacher_id,
      school_year,
      day_of_week: parseInt(day_of_week, 10),
      session: session || null,
      period: period != null ? parseInt(period, 10) : null,
      reason: reason || null,
    });
    return success(res, item, 'Đã lưu lịch bận', 201);
  } catch (err) {
    return error(res, err.message || 'Lưu thất bại', 400);
  }
};

const remove = async (req, res) => {
  try {
    await TeacherUnavailability.destroy({ where: { id: req.params.id } });
    return success(res, {}, 'Đã xóa');
  } catch (err) {
    return error(res, 'Xóa thất bại', 400, err.message);
  }
};

module.exports = { list, create, remove };
