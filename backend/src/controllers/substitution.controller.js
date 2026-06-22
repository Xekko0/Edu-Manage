/**
 * Substitution Controller — API đề xuất dạy thay.
 */
const substitutionService = require('../services/substitution.service');
const { success, error } = require('../utils/responseHelper');

/** GET /schedules/:id/substitutes — Tìm GV thay thế */
const getSubstitutes = async (req, res) => {
  try {
    const { school_year } = req.query;
    const candidates = await substitutionService.findSubstitutes(req.params.id, school_year);
    return success(res, candidates);
  } catch (err) {
    return error(res, 'Lỗi tìm GV thay thế', 500, err.message);
  }
};

module.exports = { getSubstitutes };
