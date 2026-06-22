/**
 * Bảng ews_risk_scores — chỉ số rủi ro học tập theo mô hình ABC.
 * A = Attendance, B = Behavior, C = Course Performance
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EWSRiskScore = sequelize.define('EWSRiskScore', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  semester: { type: DataTypes.INTEGER, allowNull: false },
  school_year: { type: DataTypes.STRING(9), allowNull: false },
  attendance_score: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  behavior_score: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  academic_score: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  composite_index: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  risk_level: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'low',
  },
  flagged_at: { type: DataTypes.DATE },
  computed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'ews_risk_scores',
  indexes: [
    { unique: true, fields: ['student_id', 'semester', 'school_year'] },
    { fields: ['risk_level'] },
  ],
});

module.exports = EWSRiskScore;
