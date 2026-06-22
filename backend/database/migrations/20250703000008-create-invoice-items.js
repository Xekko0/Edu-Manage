'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invoice_items', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      invoice_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'invoices', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      description: { type: Sequelize.STRING(200), allowNull: false },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      category: {
        type: Sequelize.ENUM('tuition', 'insurance', 'lab_fee', 'class_fund', 'other'),
        defaultValue: 'tuition',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('invoice_items', ['invoice_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('invoice_items');
  },
};
