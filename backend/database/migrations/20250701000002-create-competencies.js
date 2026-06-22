'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('competencies', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(200), allowNull: false },
      description: { type: Sequelize.TEXT },
      category: {
        type: Sequelize.ENUM('core', 'subject', 'cross_curricular'),
        allowNull: false,
        defaultValue: 'core',
      },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('competencies', ['category']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('competencies');
  },
};
