/**
 * Report controller — báo cáo, thống kê (SRS 2.10).
 */
const { Score, Student, Class } = require('../models');
const scoreService = require('../services/score.service');
const { success, error } = require('../utils/responseHelper');

const classOverview = async (req, res) => {
  try {
    const { class_id } = req.params;
    const { semester = 1, school_year } = req.query;

    const students = await Student.findAll({ where: { class_id } });
    const result = [];
    for (const s of students) {
      const subjects = await scoreService.getStudentSubjectAverages(s.id, semester, school_year);
      const overall = scoreService.getOverallAverage(subjects);
      result.push({ student_id: s.id, student_code: s.student_code, overall });
    }
    result.sort((a, b) => b.overall - a.overall);
    return success(res, result);
  } catch (err) {
    return error(res, 'Lỗi báo cáo', 500, err.message);
  }
};

const promotionForecast = async (_req, res) => {
  // TODO: tỷ lệ lên lớp dự kiến (SRS 2.10)
  return success(res, { rate: null, note: 'Chức năng dự kiến — Tuần 11' });
};

module.exports = { classOverview, promotionForecast };
