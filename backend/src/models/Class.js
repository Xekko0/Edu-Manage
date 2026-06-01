/**
 * Bảng classes — lớp học, có GVCN phụ trách.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Class = sequelize.define('Class', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false }, // vd: 10A1
  grade_level: { type: DataTypes.INTEGER, allowNull: false }, // 10, 11, 12
  school_year: { type: DataTypes.STRING(9), allowNull: false }, // vd: 2024-2025
  homeroom_teacher_id: { type: DataTypes.INTEGER },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'classes',
});

module.exports = Class;
