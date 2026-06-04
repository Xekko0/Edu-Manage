'use strict';

const { CurriculumStandard, Subject } = require('../models');
const { success, error } = require('../utils/responseHelper');
const env = require('../config/env');
const { listCurriculumForGrade } = require('../services/scheduling/curriculum');

const parseSchoolYear = (req) =>
  req.query.school_year || req.body.school_year || env.CURRENT_SCHOOL_YEAR || '2024-2025';

const list = async (req, res) => {
  try {
    const school_year = parseSchoolYear(req);
    const { grade_level } = req.query;
    const where = { school_year };
    if (grade_level) where.grade_level = parseInt(grade_level, 10);

    const items = await CurriculumStandard.findAll({
      where,
      include: [{ model: Subject, as: 'subject', attributes: ['id', 'code', 'name'] }],
      order: [['grade_level', 'ASC'], ['subject_id', 'ASC']],
    });
    return success(res, items);
  } catch (err) {
    return error(res, 'Lỗi tải khung chương trình', 500, err.message);
  }
};

const upsert = async (req, res) => {
  try {
    const school_year = parseSchoolYear(req);
    const {
      grade_level, subject_id, periods_per_week, is_required,
    } = req.body;
    if (!grade_level || !subject_id || periods_per_week === undefined) {
      return error(res, 'Thiếu grade_level, subject_id hoặc periods_per_week', 400);
    }
    const periods = parseInt(periods_per_week, 10);
    if (Number.isNaN(periods) || periods < 1 || periods > 10) {
      return error(res, 'Số tiết/tuần phải từ 1 đến 10', 400);
    }

    let row = await CurriculumStandard.findOne({
      where: {
        school_year,
        grade_level: parseInt(grade_level, 10),
        subject_id: parseInt(subject_id, 10),
      },
    });
    const payload = {
      school_year,
      grade_level: parseInt(grade_level, 10),
      subject_id: parseInt(subject_id, 10),
      periods_per_week: periods,
      is_required: is_required !== false,
    };
    if (!row) {
      row = await CurriculumStandard.create(payload);
    } else {
      await row.update(payload);
      await row.reload();
    }
    const full = await CurriculumStandard.findByPk(row.id, {
      include: [{ model: Subject, as: 'subject', attributes: ['id', 'code', 'name'] }],
    });
    return success(res, full, 'Đã lưu khung chương trình');
  } catch (err) {
    return error(res, err.message || 'Lưu thất bại', 400);
  }
};

const remove = async (req, res) => {
  try {
    await CurriculumStandard.destroy({ where: { id: req.params.id } });
    return success(res, {}, 'Đã xóa');
  } catch (err) {
    return error(res, 'Xóa thất bại', 400, err.message);
  }
};

const lookupForClass = async (req, res) => {
  try {
    const school_year = parseSchoolYear(req);
    const grade_level = parseInt(req.query.grade_level, 10);
    if (!grade_level) return error(res, 'Thiếu grade_level', 400);
    const items = await listCurriculumForGrade(school_year, grade_level);
    return success(res, items);
  } catch (err) {
    return error(res, 'Lỗi tra cứu khung CT', 500, err.message);
  }
};

module.exports = { list, upsert, remove, lookupForClass };
