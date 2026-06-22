/**
 * Bảng invoices — Hóa đơn tổng theo kỳ (Finance Ledger).
 * Status tính động từ paid_amount vs total_amount.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  school_year: { type: DataTypes.STRING(9), allowNull: false },
  semester: { type: DataTypes.INTEGER, allowNull: false },
  total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  paid_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  status: {
    type: DataTypes.ENUM('unpaid', 'partial', 'paid'),
    allowNull: false,
    defaultValue: 'unpaid',
  },
  due_date: { type: DataTypes.DATEONLY },
  description: { type: DataTypes.STRING(255) },
  created_by: { type: DataTypes.INTEGER },
}, {
  tableName: 'invoices',
  indexes: [
    { fields: ['student_id', 'school_year', 'semester'] },
    { fields: ['status'] },
  ],
});

module.exports = Invoice;
