/**
 * EWS Controller — API cho hệ thống cảnh báo sớm.
 */
const ewsService = require('../services/ews.service');
const { success, error } = require('../utils/responseHelper');

/** GET /ews/student/:student_id — Lấy risk scores 1 HS */
const getStudentRisk = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { semester = 1, school_year } = req.query;
    const risk = await ewsService.computeRiskIndex(student_id, semester, school_year);
    return success(res, risk);
  } catch (err) {
    return error(res, 'Lỗi tính chỉ số rủi ro', 500, err.message);
  }
};

/** GET /ews/class/:class_id — Danh sách HS + risk level */
const getClassRisks = async (req, res) => {
  try {
    const { class_id } = req.params;
    const { semester = 1, school_year } = req.query;
    const risks = await ewsService.computeClassRiskScores(class_id, semester, school_year);
    return success(res, risks);
  } catch (err) {
    return error(res, 'Lỗi tính chỉ số lớp', 500, err.message);
  }
};

/** GET /ews/dashboard — Tổng hợp số HS red/yellow/green */
const getDashboardSummary = async (req, res) => {
  try {
    const { semester = 1, school_year } = req.query;
    const summary = await ewsService.getDashboardSummary(semester, school_year);
    return success(res, summary);
  } catch (err) {
    return error(res, 'Lỗi tổng hợp EWS', 500, err.message);
  }
};

/** POST /ews/recompute — Batch recompute (admin) */
const recompute = async (req, res) => {
  try {
    const { class_id, semester = 1, school_year } = req.body;
    if (class_id) {
      const risks = await ewsService.computeClassRiskScores(class_id, semester, school_year);
      return success(res, { computed: risks.length });
    }
    return error(res, 'Cần cung cấp class_id', 400);
  } catch (err) {
    return error(res, 'Lỗi recompute', 500, err.message);
  }
};

module.exports = { getStudentRisk, getClassRisks, getDashboardSummary, recompute };
