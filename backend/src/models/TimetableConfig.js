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
  period_duration_minutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 45 },
  grade_10_annual_periods: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1015 },
  grade_11_annual_periods: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1032 },
  grade_12_annual_periods: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1032 },
  semester1_start: { type: DataTypes.DATEONLY, allowNull: true },
  semester1_end: { type: DataTypes.DATEONLY, allowNull: true },
  semester2_start: { type: DataTypes.DATEONLY, allowNull: true },
  semester2_end: { type: DataTypes.DATEONLY, allowNull: true },
  holidays: { type: DataTypes.JSON, allowNull: true },
  morning_break_after_period: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
  morning_break_minutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 20 },
  afternoon_break_after_period: { type: DataTypes.INTEGER, allowNull: true },
  afternoon_break_minutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 20 },
}, {
  tableName: 'timetable_configs',
  underscored: true,
  paranoid: false,
});

module.exports = TimetableConfig;
