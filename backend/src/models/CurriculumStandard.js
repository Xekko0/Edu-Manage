'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CurriculumStandard = sequelize.define('CurriculumStandard', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  school_year: { type: DataTypes.STRING(9), allowNull: false },
  grade_level: { type: DataTypes.INTEGER, allowNull: false },
  subject_id: { type: DataTypes.INTEGER, allowNull: false },
  periods_per_week: { type: DataTypes.INTEGER, allowNull: false },
  is_required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'curriculum_standards',
  underscored: true,
  paranoid: false,
  indexes: [
    { unique: true, fields: ['school_year', 'grade_level', 'subject_id'] },
  ],
});

module.exports = CurriculumStandard;
