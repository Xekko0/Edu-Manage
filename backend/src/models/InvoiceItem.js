/**
 * Bảng invoice_items — Chi tiết khoản thu (HP, BH, Lab, Quỹ lớp).
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InvoiceItem = sequelize.define('InvoiceItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  invoice_id: { type: DataTypes.INTEGER, allowNull: false },
  description: { type: DataTypes.STRING(200), allowNull: false },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  category: {
    type: DataTypes.ENUM('tuition', 'insurance', 'lab_fee', 'class_fund', 'other'),
    defaultValue: 'tuition',
  },
}, {
  tableName: 'invoice_items',
});

module.exports = InvoiceItem;
