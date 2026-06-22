/**
 * Bảng grading_periods — kỳ chốt điểm (hạn khóa sổ).
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GradingPeriod = sequelize.define('GradingPeriod', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  school_year: { type: DataTypes.STRING(9), allowNull: false },
  semester: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  lock_date: { type: DataTypes.DATE },
  is_locked: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'grading_periods',
});

module.exports = GradingPeriod;
