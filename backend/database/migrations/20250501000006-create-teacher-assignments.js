'use strict';

/**
 * MỚI v1.1 — Bảng trung tâm phân quyền GVBM.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('teacher_assignments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      teacher_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      class_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'classes', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      subject_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'subjects', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      school_year: { type: Sequelize.STRING(9), allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex(
      'teacher_assignments',
      ['teacher_id', 'class_id', 'subject_id', 'school_year'],
      { unique: true, name: 'uniq_teacher_class_subject_year' },
    );
    await queryInterface.addIndex('teacher_assignments', ['teacher_id']);
    await queryInterface.addIndex('teacher_assignments', ['class_id', 'subject_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('teacher_assignments');
  },
};
