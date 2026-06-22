'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('exam_periods', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      school_year: { type: Sequelize.STRING(9), allowNull: false },
      semester: { type: Sequelize.INTEGER, allowNull: false },
      start_date: { type: Sequelize.DATEONLY },
      end_date: { type: Sequelize.DATEONLY },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('exam_periods', ['school_year', 'semester']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('exam_periods');
  },
};
