/**
 * Bảng exam_periods — Kỳ thi tập trung (Giữa kỳ, Cuối kỳ).
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExamPeriod = sequelize.define('ExamPeriod', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  school_year: { type: DataTypes.STRING(9), allowNull: false },
  semester: { type: DataTypes.INTEGER, allowNull: false },
  start_date: { type: DataTypes.DATEONLY },
  end_date: { type: DataTypes.DATEONLY },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'exam_periods',
});

module.exports = ExamPeriod;
