/**
 * Bảng payment_transactions — Nhật ký giao dịch (Finance Ledger).
 * Lưu vết audit: số tiền, phương thức, người duyệt, mã tham chiếu.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaymentTransaction = sequelize.define('PaymentTransaction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  invoice_id: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  method: {
    type: DataTypes.ENUM('cash', 'bank_transfer', 'momo', 'vnpay', 'other'),
    allowNull: false,
    defaultValue: 'cash',
  },
  reference_code: { type: DataTypes.STRING(100) },
  approved_by: { type: DataTypes.INTEGER },
  note: { type: DataTypes.STRING(255) },
  paid_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'payment_transactions',
  indexes: [
    { fields: ['invoice_id'] },
    { fields: ['paid_at'] },
  ],
});

module.exports = PaymentTransaction;
