/**
 * Report controller — báo cáo, thống kê (SRS 2.10).
 */
const { Score, Student, Class } = require('../models');
const scoreService = require('../services/score.service');
const ewsService = require('../services/ews.service');
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

/**
 * Dự báo lên lớp — EWS (Early Warning System).
 * Tính tỷ lệ HS an toàn / có nguy cơ / nguy cơ cao theo mô hình ABC.
 */
const promotionForecast = async (req, res) => {
  try {
    const { class_id } = req.params;
    const { semester = 1, school_year } = req.query;

    if (!class_id) {
      // Tổng hợp toàn trường
      const summary = await ewsService.getDashboardSummary(semester, school_year);
      const rate = summary.total > 0
        ? Math.round(((summary.low + summary.medium) / summary.total) * 100)
        : null;
      return success(res, {
        rate,
        summary,
        note: rate !== null
          ? `${rate}% HS có triển vọng lên lớp (low + medium risk)`
          : 'Chưa có dữ liệu EWS',
      });
    }

    // Tổng hợp theo lớp
    const risks = await ewsService.computeClassRiskScores(class_id, semester, school_year);
    const summary = { total: risks.length, critical: 0, high: 0, medium: 0, low: 0 };
    risks.forEach((r) => { summary[r.risk_level]++; });

    const rate = summary.total > 0
      ? Math.round(((summary.low + summary.medium) / summary.total) * 100)
      : null;

    return success(res, {
      rate,
      summary,
      risks,
      note: rate !== null
        ? `${rate}% HS lớp này có triển vọng lên lớp`
        : 'Chưa có dữ liệu EWS cho lớp này',
    });
  } catch (err) {
    return error(res, 'Lỗi dự báo', 500, err.message);
  }
};

module.exports = { classOverview, promotionForecast };
