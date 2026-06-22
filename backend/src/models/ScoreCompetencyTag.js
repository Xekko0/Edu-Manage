/**
 * Bảng score_competency_tags — gán nhãn năng lực cho đầu điểm.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScoreCompetencyTag = sequelize.define('ScoreCompetencyTag', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  score_id: { type: DataTypes.INTEGER, allowNull: false },
  competency_id: { type: DataTypes.INTEGER, allowNull: false },
  proficiency_level: {
    type: DataTypes.ENUM('beginner', 'developing', 'proficient', 'advanced'),
    defaultValue: 'developing',
  },
}, {
  tableName: 'score_competency_tags',
  indexes: [
    { unique: true, fields: ['score_id', 'competency_id'] },
    { fields: ['competency_id'] },
  ],
});

module.exports = ScoreCompetencyTag;
