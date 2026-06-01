'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('student_activity', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      student_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'students', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      activity_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'extracurriculars', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      registered_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      attended: { type: Sequelize.BOOLEAN, defaultValue: false },
      achievement: { type: Sequelize.STRING(255) },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('student_activity', ['student_id', 'activity_id'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('student_activity');
  },
};
