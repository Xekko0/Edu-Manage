'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transcripts', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      student_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'students', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      semester: { type: Sequelize.INTEGER, allowNull: false },
      school_year: { type: Sequelize.STRING(9), allowNull: false },
      overall_average: { type: Sequelize.DECIMAL(4, 2) },
      letter_grade: { type: Sequelize.STRING(5) },
      gpa_score: { type: Sequelize.DECIMAL(3, 2) },
      class_rank: { type: Sequelize.INTEGER },
      computed_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('transcripts', ['student_id', 'semester', 'school_year'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('transcripts');
  },
};
