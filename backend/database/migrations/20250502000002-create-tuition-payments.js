'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tuition_payments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tuition_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'tuitions', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      student_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'students', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      amount_paid: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      status: {
        type: Sequelize.ENUM('unpaid', 'partial', 'paid'),
        allowNull: false, defaultValue: 'unpaid',
      },
      paid_at: { type: Sequelize.DATE },
      note: { type: Sequelize.STRING(255) },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('tuition_payments', ['student_id', 'tuition_id'], { unique: true });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('tuition_payments');
  },
};
