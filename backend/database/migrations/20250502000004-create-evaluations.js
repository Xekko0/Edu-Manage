'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('evaluations', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      student_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'students', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      teacher_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      subject_id: {
        type: Sequelize.INTEGER,
        references: { model: 'subjects', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      type: {
        type: Sequelize.ENUM('homeroom', 'subject', 'conduct'),
        allowNull: false,
      },
      semester: { type: Sequelize.INTEGER, allowNull: false },
      school_year: { type: Sequelize.STRING(9), allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      conduct_grade: { type: Sequelize.ENUM('excellent', 'good', 'fair', 'weak') },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('evaluations', ['student_id', 'semester', 'school_year']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('evaluations');
  },
};
