'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('score_competency_tags', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      score_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'scores', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      competency_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'competencies', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      proficiency_level: {
        type: Sequelize.ENUM('beginner', 'developing', 'proficient', 'advanced'),
        defaultValue: 'developing',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('score_competency_tags', ['score_id', 'competency_id'], { unique: true });
    await queryInterface.addIndex('score_competency_tags', ['competency_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('score_competency_tags');
  },
};
