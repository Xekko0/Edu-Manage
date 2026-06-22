'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pending_attendance_alerts', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      student_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'students', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      attendance_date: { type: Sequelize.DATEONLY, allowNull: false },
      schedule_id: {
        type: Sequelize.INTEGER,
        references: { model: 'schedules', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      marked_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      status: {
        type: Sequelize.ENUM('pending', 'cancelled', 'sent'),
        allowNull: false,
        defaultValue: 'pending',
      },
      parent_email: { type: Sequelize.STRING(150) },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('pending_attendance_alerts', ['status', 'marked_at']);
    await queryInterface.addIndex('pending_attendance_alerts', ['student_id', 'attendance_date']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pending_attendance_alerts');
  },
};
