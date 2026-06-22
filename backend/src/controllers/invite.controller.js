/**
 * Invite Controller — API mã mời liên kết PH–HS.
 */
const inviteService = require('../services/invite.service');
const { success, error } = require('../utils/responseHelper');

/** POST /invite/generate — Tạo mã mời (admin/GVCN) */
const generateCode = async (req, res) => {
  try {
    const { student_id } = req.body;
    if (!student_id) return error(res, 'Cần cung cấp student_id', 400);
    const result = await inviteService.generateInviteCode(student_id);
    return success(res, result, 'Tạo mã mời thành công');
  } catch (err) {
    return error(res, err.message || 'Lỗi tạo mã mời', 400);
  }
};

/** POST /invite/redeem — Nhập mã mời (PH) */
const redeemCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return error(res, 'Cần cung cấp mã mời', 400);
    const result = await inviteService.redeemCode(code.toUpperCase(), req.user.id);
    return success(res, result, 'Liên kết thành công!');
  } catch (err) {
    return error(res, err.message || 'Lỗi liên kết', 400);
  }
};

/** GET /invite/my-code — Xem mã mời (HS) */
const getMyCode = async (req, res) => {
  try {
    const result = await inviteService.getMyInviteCode(req.user.id);
    return success(res, result);
  } catch (err) {
    return error(res, err.message || 'Lỗi lấy mã mời', 400);
  }
};

module.exports = { generateCode, redeemCode, getMyCode };
