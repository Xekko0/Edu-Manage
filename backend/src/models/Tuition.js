/**
 * Bảng tuitions — học phí.
 * Admin cấu hình theo lớp × năm học × kỳ.
 * PH/HS xem học phí của (con) mình.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tuition = sequelize.define('Tuition', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  class_id: { type: DataTypes.INTEGER, allowNull: false },
  school_year: { type: DataTypes.STRING(9), allowNull: false },
  semester: { type: DataTypes.INTEGER, allowNull: false }, // 1 | 2 | 0 (cả năm)
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false }, // VND
  due_date: { type: DataTypes.DATEONLY },
  description: { type: DataTypes.STRING(255) },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'tuitions',
  indexes: [
    { fields: ['class_id', 'school_year', 'semester'] },
  ],
});

module.exports = Tuition;
