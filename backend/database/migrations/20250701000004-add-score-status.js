'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('scores', 'status', {
      type: Sequelize.ENUM('draft', 'published'),
      allowNull: false,
      defaultValue: 'draft',
    });
    await queryInterface.addColumn('scores', 'published_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addIndex('scores', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('scores', 'status');
    await queryInterface.removeColumn('scores', 'published_at');
  },
};
