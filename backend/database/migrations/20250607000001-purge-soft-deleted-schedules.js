'use strict';

/** Xóa hẳn TKB đã soft-delete — tránh chặn unique index ô lớp/GV. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'DELETE FROM schedules WHERE deleted_at IS NOT NULL',
    );
  },

  async down() {
    /* không khôi phục */
  },
};
