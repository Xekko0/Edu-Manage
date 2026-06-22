'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('grading_periods', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      school_year: { type: Sequelize.STRING(9), allowNull: false },
      semester: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      lock_date: { type: Sequelize.DATE, allowNull: true },
      is_locked: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('grading_periods', ['school_year', 'semester']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('grading_periods');
  },
};
