'use strict';

/**
 * Sửa homeroom_teacher_id theo email GVCN (id user có thể lệch sau re-seed users).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const pairs = [
      ['10A1', 'gvcn.10a1@edusmart.local'],
      ['10A2', 'gvcn.10a2@edusmart.local'],
      ['11A1', 'gvcn.11a1@edusmart.local'],
    ];

    for (const [className, email] of pairs) {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT u.id AS teacher_id FROM users u WHERE u.email = :email AND u.deleted_at IS NULL LIMIT 1`,
        { replacements: { email }, type: Sequelize.QueryTypes.SELECT },
      );
      const teacher = Array.isArray(rows) ? rows[0] : rows;
      if (!teacher?.teacher_id) continue;

      await queryInterface.sequelize.query(
        `UPDATE classes SET homeroom_teacher_id = :teacherId, updated_at = datetime('now')
         WHERE name = :className AND deleted_at IS NULL`,
        { replacements: { teacherId: teacher.teacher_id, className } },
      );
    }
  },

  async down() {
    /* no-op — dữ liệu demo */
  },
};
