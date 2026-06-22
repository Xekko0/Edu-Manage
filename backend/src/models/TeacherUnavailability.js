'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TeacherUnavailability = sequelize.define('TeacherUnavailability', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  teacher_id: { type: DataTypes.INTEGER, allowNull: false },
  school_year: { type: DataTypes.STRING(9), allowNull: false },
  day_of_week: { type: DataTypes.INTEGER, allowNull: false },
  session: { type: DataTypes.STRING(20), allowNull: true },
  period: { type: DataTypes.INTEGER, allowNull: true },
  reason: { type: DataTypes.STRING(200), allowNull: true },
}, {
  tableName: 'teacher_unavailability',
  underscored: true,
  indexes: [
    { fields: ['teacher_id', 'school_year', 'day_of_week'] },
  ],
});

module.exports = TeacherUnavailability;
