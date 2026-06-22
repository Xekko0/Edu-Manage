/**
 * Bảng course_enrollments — Đăng ký môn học tự chọn (Elective).
 * Dùng Database Transaction Lock chống Over-enrollment.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CourseEnrollment = sequelize.define('CourseEnrollment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  subject_id: { type: DataTypes.INTEGER, allowNull: false },
  semester: { type: DataTypes.INTEGER, allowNull: false },
  school_year: { type: DataTypes.STRING(9), allowNull: false },
  status: {
    type: DataTypes.ENUM('registered', 'dropped', 'completed'),
    allowNull: false,
    defaultValue: 'registered',
  },
  registered_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'course_enrollments',
  indexes: [
    { unique: true, fields: ['student_id', 'subject_id', 'semester', 'school_year'] },
    { fields: ['subject_id', 'semester', 'school_year'] },
  ],
});

module.exports = CourseEnrollment;
