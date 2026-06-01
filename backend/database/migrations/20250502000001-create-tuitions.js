'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tuitions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      class_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'classes', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      school_year: { type: Sequelize.STRING(9), allowNull: false },
      semester: { type: Sequelize.INTEGER, allowNull: false },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      due_date: { type: Sequelize.DATEONLY },
      description: { type: Sequelize.STRING(255) },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('tuitions', ['class_id', 'school_year', 'semester']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('tuitions');
  },
};
