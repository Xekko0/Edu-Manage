'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payment_transactions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      invoice_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'invoices', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      method: {
        type: Sequelize.ENUM('cash', 'bank_transfer', 'momo', 'vnpay', 'other'),
        allowNull: false,
        defaultValue: 'cash',
      },
      reference_code: { type: Sequelize.STRING(100) },
      approved_by: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      note: { type: Sequelize.STRING(255) },
      paid_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('payment_transactions', ['invoice_id']);
    await queryInterface.addIndex('payment_transactions', ['paid_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payment_transactions');
  },
};
