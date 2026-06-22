/**
 * Invite service — mã mời liên kết PH–HS (Secure Invite Code).
 */
const crypto = require('crypto');
const { Student, User } = require('../models');

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;
const EXPIRY_DAYS = 30;

/** Sinh mã mời ngẫu nhiên */
const generateCode = (length = CODE_LENGTH) => {
  let code = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += CHARSET[bytes[i] % CHARSET.length];
  }
  return code;
};

/** Tạo mã mời cho 1 học sinh */
const generateInviteCode = async (studentId) => {
  const student = await Student.findByPk(studentId);
  if (!student) throw new Error('Không tìm thấy học sinh');

  const code = generateCode();
  const expires = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await student.update({
    parent_invite_code: code,
    invite_code_expires_at: expires,
  });

  return { code, expires };
};

/** Xác thực mã mời và liên kết PH–HS */
const redeemCode = async (code, parentId) => {
  // Tìm HS theo mã mời
  const student = await Student.findOne({
    where: { parent_invite_code: code },
  });

  if (!student) throw new Error('Mã mời không hợp lệ');

  // Kiểm tra hết hạn
  if (student.invite_code_expires_at && new Date() > student.invite_code_expires_at) {
    throw new Error('Mã mời đã hết hạn. Vui lòng liên hệ GVCN để lấy mã mới.');
  }

  // Kiểm tra PH tồn tại
  const parent = await User.findByPk(parentId);
  if (!parent || parent.role !== 'parent') {
    throw new Error('Tài khoản không phải phụ huynh');
  }

  // Kiểm tra đã liên kết chưa
  const children = await parent.getChildren({ where: { id: student.id } });
  if (children.length > 0) {
    throw new Error('Đã liên kết với học sinh này rồi');
  }

  // Liên kết
  await parent.addChild(student);

  return {
    student_id: student.id,
    student_code: student.student_code,
    message: 'Liên kết thành công!',
  };
};

/** Lấy mã mời của HS (dành cho HS xem) */
const getMyInviteCode = async (userId) => {
  const student = await Student.findOne({ where: { user_id: userId } });
  if (!student) throw new Error('Không tìm thấy hồ sơ học sinh');

  // Tạo mã mới nếu chưa có hoặc đã hết hạn
  if (!student.parent_invite_code || (student.invite_code_expires_at && new Date() > student.invite_code_expires_at)) {
    return generateInviteCode(student.id);
  }

  return {
    code: student.parent_invite_code,
    expires: student.invite_code_expires_at,
  };
};

module.exports = {
  generateCode,
  generateInviteCode,
  redeemCode,
  getMyInviteCode,
};
