'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TimetableConfig = sequelize.define('TimetableConfig', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  school_year: { type: DataTypes.STRING(9), allowNull: false, unique: true },
  days_of_week: { type: DataTypes.JSON, allowNull: false, defaultValue: [1, 2, 3, 4, 5] },
  morning_periods: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
  afternoon_periods: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
  afternoon_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  period_times: { type: DataTypes.JSON, allowNull: true },
}, {
  tableName: 'timetable_configs',
  underscored: true,
  paranoid: false,
});

module.exports = TimetableConfig;
