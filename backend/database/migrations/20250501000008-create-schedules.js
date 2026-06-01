'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('schedules', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
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
      teacher_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      day_of_week: { type: Sequelize.INTEGER, allowNull: false },
      period: { type: Sequelize.INTEGER, allowNull: false },
      room: { type: Sequelize.STRING(50) },
      school_year: { type: Sequelize.STRING(9), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('schedules', ['class_id', 'day_of_week', 'period']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('schedules');
  },
};
