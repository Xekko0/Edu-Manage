'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('course_enrollments', {
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
      semester: { type: Sequelize.INTEGER, allowNull: false },
      school_year: { type: Sequelize.STRING(9), allowNull: false },
      status: {
        type: Sequelize.ENUM('registered', 'dropped', 'completed'),
        allowNull: false,
        defaultValue: 'registered',
      },
      registered_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('course_enrollments', ['student_id', 'subject_id', 'semester', 'school_year'], { unique: true });
    await queryInterface.addIndex('course_enrollments', ['subject_id', 'semester', 'school_year']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('course_enrollments');
  },
};
