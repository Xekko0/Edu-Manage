/**
 * Bảng teacher_assignments — MỚI v1.1
 * Trung tâm phân quyền nhập điểm cho GVBM:
 *   teacher_id × class_id × subject_id × school_year
 * Backend luôn truy vấn bảng này trước khi cho phép GVBM thao tác điểm.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TeacherAssignment = sequelize.define('TeacherAssignment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  teacher_id: { type: DataTypes.INTEGER, allowNull: false },
  class_id: { type: DataTypes.INTEGER, allowNull: false },
  subject_id: { type: DataTypes.INTEGER, allowNull: false },
  school_year: { type: DataTypes.STRING(9), allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'teacher_assignments',
  indexes: [
    { unique: true, fields: ['teacher_id', 'class_id', 'subject_id', 'school_year'] },
    { fields: ['teacher_id'] },
    { fields: ['class_id', 'subject_id'] },
  ],
});

module.exports = TeacherAssignment;
