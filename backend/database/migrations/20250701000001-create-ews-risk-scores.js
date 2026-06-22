'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ews_risk_scores', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      student_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'students', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      semester: { type: Sequelize.INTEGER, allowNull: false },
      school_year: { type: Sequelize.STRING(9), allowNull: false },
      attendance_score: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      behavior_score: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      academic_score: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      composite_index: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      risk_level: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'low',
      },
      flagged_at: { type: Sequelize.DATE },
      computed_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('ews_risk_scores', ['student_id', 'semester', 'school_year'], { unique: true });
    await queryInterface.addIndex('ews_risk_scores', ['risk_level']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ews_risk_scores');
  },
};
