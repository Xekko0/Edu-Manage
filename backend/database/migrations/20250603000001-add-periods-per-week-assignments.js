'use strict';

/** Số tiết/tuần mỗi phân công GV — dùng cho auto xếp TKB. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('teacher_assignments', 'periods_per_week', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 2,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('teacher_assignments', 'periods_per_week');
  },
};
