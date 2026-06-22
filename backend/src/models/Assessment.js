/**
 * Bảng assessments — Bài đánh giá (Formative + Summative).
 * Formative: BT, 15p, 1 tiết (GVBM nhập)
 * Summative: Giữa kỳ, Cuối kỳ (exam_periods)
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Assessment = sequelize.define('Assessment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  subject_id: { type: DataTypes.INTEGER, allowNull: false },
  class_id: { type: DataTypes.INTEGER, allowNull: false },
  exam_period_id: { type: DataTypes.INTEGER },
  assessment_type: {
    type: DataTypes.ENUM('formative', 'summative'),
    allowNull: false,
    defaultValue: 'formative',
  },
  score_type: { type: DataTypes.STRING(20), allowNull: false },
  raw_score: { type: DataTypes.DECIMAL(4, 2), allowNull: false },
  weight: { type: DataTypes.DECIMAL(3, 2), defaultValue: 1.0 },
  semester: { type: DataTypes.INTEGER, allowNull: false },
  school_year: { type: DataTypes.STRING(9), allowNull: false },
  entered_by: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'assessments',
  indexes: [
    { fields: ['student_id', 'subject_id', 'semester', 'school_year'] },
    { fields: ['exam_period_id'] },
  ],
});

module.exports = Assessment;
