/**
 * Competency Controller — API cho khung năng lực.
 */
const competencyService = require('../services/competency.service');
const { success, error } = require('../utils/responseHelper');

/** GET /competencies — Danh sách năng lực */
const list = async (req, res) => {
  try {
    const { category } = req.query;
    const items = await competencyService.listCompetencies(category ? { category } : {});
    return success(res, items);
  } catch (err) {
    return error(res, 'Lỗi tải năng lực', 500, err.message);
  }
};

/** GET /competencies/student/:student_id/profile — Profile năng lực HS */
const getStudentProfile = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { semester = 1, school_year } = req.query;
    const profile = await competencyService.getStudentCompetencyProfile(student_id, semester, school_year);
    return success(res, profile);
  } catch (err) {
    return error(res, 'Lỗi tải profile năng lực', 500, err.message);
  }
};

module.exports = { list, getStudentProfile };
