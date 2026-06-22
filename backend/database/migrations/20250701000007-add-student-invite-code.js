'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('students', 'parent_invite_code', {
      type: Sequelize.STRING(32),
      allowNull: true,
    });
    await queryInterface.addColumn('students', 'invite_code_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addIndex('students', ['parent_invite_code']);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('students', 'parent_invite_code');
    await queryInterface.removeColumn('students', 'invite_code_expires_at');
  },
};
