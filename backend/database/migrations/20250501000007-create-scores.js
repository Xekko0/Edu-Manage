'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('scores', {
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
      score_type: {
        type: Sequelize.ENUM('oral', '15min', '1period', 'semester'),
        allowNull: false,
      },
      score_value: { type: Sequelize.DECIMAL(4, 2), allowNull: false },
      semester: { type: Sequelize.INTEGER, allowNull: false },
      school_year: { type: Sequelize.STRING(9), allowNull: false },
      entered_by: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      note: { type: Sequelize.STRING(255) },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('scores', ['student_id', 'subject_id', 'semester', 'school_year']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('scores');
  },
};
