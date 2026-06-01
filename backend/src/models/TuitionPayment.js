/**
 * Bảng tuition_payments — ghi nhận đóng học phí của từng HS.
 * Liên kết với tuitions (theo lớp/năm/kỳ). 1 HS có thể có nhiều dòng trả nhiều lần.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TuitionPayment = sequelize.define('TuitionPayment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tuition_id: { type: DataTypes.INTEGER, allowNull: false },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  amount_paid: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  status: {
    type: DataTypes.ENUM('unpaid', 'partial', 'paid'),
    allowNull: false,
    defaultValue: 'unpaid',
  },
  paid_at: { type: DataTypes.DATE },
  note: { type: DataTypes.STRING(255) },
}, {
  tableName: 'tuition_payments',
  indexes: [
    { fields: ['student_id', 'tuition_id'], unique: true },
  ],
});

module.exports = TuitionPayment;
