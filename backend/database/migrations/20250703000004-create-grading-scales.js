'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('grading_scales', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      min_score: { type: Sequelize.DECIMAL(4, 2), allowNull: false },
      max_score: { type: Sequelize.DECIMAL(4, 2), allowNull: false },
      letter_grade: { type: Sequelize.STRING(5), allowNull: false },
      gpa_points: { type: Sequelize.DECIMAL(3, 2), allowNull: false },
      description: { type: Sequelize.STRING(50) },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('grading_scales', ['min_score', 'max_score']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('grading_scales');
  },
};
