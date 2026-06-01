'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Project bật paranoid + underscored mặc định, nên các bảng cần có deleted_at
    // để tránh lỗi khi Sequelize tự thêm điều kiện `deleted_at IS NULL` vào JOIN.
    await queryInterface.addColumn('student_activity', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('student_activity', 'deleted_at');
  },
};

