'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('teacher_unavailability', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      teacher_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      school_year: { type: Sequelize.STRING(9), allowNull: false },
      day_of_week: { type: Sequelize.INTEGER, allowNull: false },
      session: { type: Sequelize.STRING(20), allowNull: true },
      period: { type: Sequelize.INTEGER, allowNull: true },
      reason: { type: Sequelize.STRING(200), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex(
      'teacher_unavailability',
      ['teacher_id', 'school_year', 'day_of_week'],
      { name: 'teacher_unavail_teacher_year_day' },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('teacher_unavailability');
  },
};
