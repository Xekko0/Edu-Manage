'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('teacher_unavailability');
    if (!tableDesc.deleted_at) {
      await queryInterface.addColumn('teacher_unavailability', 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('teacher_unavailability', 'deleted_at');
  },
};
