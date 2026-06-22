/**
 * Bảng grading_scales — Quy đổi điểm: thang 10 → chữ → GPA.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GradingScale = sequelize.define('GradingScale', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  min_score: { type: DataTypes.DECIMAL(4, 2), allowNull: false },
  max_score: { type: DataTypes.DECIMAL(4, 2), allowNull: false },
  letter_grade: { type: DataTypes.STRING(5), allowNull: false },
  gpa_points: { type: DataTypes.DECIMAL(3, 2), allowNull: false },
  description: { type: DataTypes.STRING(50) },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'grading_scales',
});

module.exports = GradingScale;
