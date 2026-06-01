'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('class_journals', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      class_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'classes', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      subject_id: {
        type: Sequelize.INTEGER,
        references: { model: 'subjects', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      teacher_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      lesson_date: { type: Sequelize.DATEONLY, allowNull: false },
      period: { type: Sequelize.INTEGER },
      content: { type: Sequelize.TEXT },
      discipline_note: { type: Sequelize.STRING(500) },
      rating: { type: Sequelize.ENUM('good', 'fair', 'average', 'poor') },
      absent_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('class_journals', ['class_id', 'lesson_date']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('class_journals');
  },
};
