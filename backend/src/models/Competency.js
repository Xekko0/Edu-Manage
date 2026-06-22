/**
 * Bảng competencies — khung năng lực cốt lõi (GDPT 2018).
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Competency = sequelize.define('Competency', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  category: {
    type: DataTypes.ENUM('core', 'subject', 'cross_curricular'),
    allowNull: false,
    defaultValue: 'core',
  },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'competencies',
});

module.exports = Competency;
