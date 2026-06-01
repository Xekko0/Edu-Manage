'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attendance', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      student_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'students', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      schedule_id: {
        type: Sequelize.INTEGER,
        references: { model: 'schedules', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      attendance_date: { type: Sequelize.DATEONLY, allowNull: false },
      status: {
        type: Sequelize.ENUM('present', 'excused', 'absent'),
        allowNull: false, defaultValue: 'present',
      },
      note: { type: Sequelize.STRING(255) },
      marked_by: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('attendance', ['student_id', 'attendance_date']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('attendance');
  },
};
