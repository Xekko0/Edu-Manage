/**
 * Bảng transcripts — Bảng điểm tổng kết + GPA (thang 4.0).
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transcript = sequelize.define('Transcript', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  semester: { type: DataTypes.INTEGER, allowNull: false },
  school_year: { type: DataTypes.STRING(9), allowNull: false },
  overall_average: { type: DataTypes.DECIMAL(4, 2) },
  letter_grade: { type: DataTypes.STRING(5) },
  gpa_score: { type: DataTypes.DECIMAL(3, 2) },
  class_rank: { type: DataTypes.INTEGER },
  computed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'transcripts',
  indexes: [
    { unique: true, fields: ['student_id', 'semester', 'school_year'] },
  ],
});

module.exports = Transcript;
