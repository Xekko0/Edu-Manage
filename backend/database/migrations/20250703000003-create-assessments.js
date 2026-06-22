'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('assessments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      student_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'students', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      subject_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'subjects', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      class_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'classes', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      exam_period_id: {
        type: Sequelize.INTEGER,
        references: { model: 'exam_periods', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      assessment_type: {
        type: Sequelize.ENUM('formative', 'summative'),
        allowNull: false,
        defaultValue: 'formative',
      },
      score_type: { type: Sequelize.STRING(20), allowNull: false },
      raw_score: { type: Sequelize.DECIMAL(4, 2), allowNull: false },
      weight: { type: Sequelize.DECIMAL(3, 2), defaultValue: 1.0 },
      semester: { type: Sequelize.INTEGER, allowNull: false },
      school_year: { type: Sequelize.STRING(9), allowNull: false },
      entered_by: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('assessments', ['student_id', 'subject_id', 'semester', 'school_year']);
    await queryInterface.addIndex('assessments', ['exam_period_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('assessments');
  },
};
