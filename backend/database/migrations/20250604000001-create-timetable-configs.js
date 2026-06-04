'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('timetable_configs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      school_year: { type: Sequelize.STRING(9), allowNull: false, unique: true },
      days_of_week: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '[1,2,3,4,5]',
      },
      morning_periods: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5 },
      afternoon_periods: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5 },
      afternoon_enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('timetable_configs');
  },
};
