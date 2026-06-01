/**
 * Bảng evaluations — Đánh giá / nhận xét học sinh.
 * Người ghi: GVCN (đánh giá tổng quát) hoặc GVBM (đánh giá môn học).
 * Loại:
 *   - homeroom : đánh giá tổng (chỉ GVCN)
 *   - subject  : đánh giá môn cụ thể (GVBM)
 *   - conduct  : hạnh kiểm (GVCN)
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Evaluation = sequelize.define('Evaluation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  teacher_id: { type: DataTypes.INTEGER, allowNull: false },
  subject_id: { type: DataTypes.INTEGER }, // null khi type=homeroom|conduct
  type: {
    type: DataTypes.ENUM('homeroom', 'subject', 'conduct'),
    allowNull: false,
  },
  semester: { type: DataTypes.INTEGER, allowNull: false }, // 1 | 2 | 0 (cả năm)
  school_year: { type: DataTypes.STRING(9), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  conduct_grade: { type: DataTypes.ENUM('excellent', 'good', 'fair', 'weak') }, // chỉ dùng khi type=conduct
}, {
  tableName: 'evaluations',
  indexes: [
    { fields: ['student_id', 'semester', 'school_year'] },
  ],
});

module.exports = Evaluation;
