/**
 * Bảng extracurriculars — danh sách hoạt động ngoại khóa.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Extracurricular = sequelize.define('Extracurricular', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  start_date: { type: DataTypes.DATE, allowNull: false },
  end_date: { type: DataTypes.DATE },
  location: { type: DataTypes.STRING(255) },
  organizer: { type: DataTypes.STRING(150) },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'extracurriculars',
});

module.exports = Extracurricular;
