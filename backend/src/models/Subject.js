/**
 * Bảng subjects — danh mục môn học.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subject = sequelize.define('Subject', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT },
  preferred_room_type: { type: DataTypes.STRING(20), allowNull: true },
  program_component: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'elective',
  },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'subjects',
});

module.exports = Subject;
