'use strict';

const crypto = require('crypto');

/**
 * Sinh mã mời liên kết PH–HS cho tất cả học sinh hiện có.
 * Mã 8 ký tự, uppercase, dễ đọc (loại bỏ O/0/I/1 để tránh nhầm).
 */
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(length = 8) {
  let code = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += CHARSET[bytes[i] % CHARSET.length];
  }
  return code;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const students = await queryInterface.sequelize.query(
      'SELECT id FROM students',
      { type: Sequelize.QueryTypes.SELECT },
    );

    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 ngày

    for (const stu of students) {
      await queryInterface.sequelize.query(
        'UPDATE students SET parent_invite_code = :code, invite_code_expires_at = :expires WHERE id = :id',
        {
          replacements: { code: generateCode(), expires, id: stu.id },
          type: Sequelize.QueryTypes.UPDATE,
        },
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE students SET parent_invite_code = NULL, invite_code_expires_at = NULL"
    );
  },
};
