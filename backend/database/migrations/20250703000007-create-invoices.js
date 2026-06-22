'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invoices', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      student_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'students', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      school_year: { type: Sequelize.STRING(9), allowNull: false },
      semester: { type: Sequelize.INTEGER, allowNull: false },
      total_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      paid_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      status: {
        type: Sequelize.ENUM('unpaid', 'partial', 'paid'),
        allowNull: false,
        defaultValue: 'unpaid',
      },
      due_date: { type: Sequelize.DATEONLY },
      description: { type: Sequelize.STRING(255) },
      created_by: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('invoices', ['student_id', 'school_year', 'semester']);
    await queryInterface.addIndex('invoices', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('invoices');
  },
};
