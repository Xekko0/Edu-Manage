/**
 * Bảng scores — điểm số.
 * Mỗi điểm là 1 dòng kèm score_type để dễ mở rộng.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Score = sequelize.define('Score', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  subject_id: { type: DataTypes.INTEGER, allowNull: false },
  class_id: { type: DataTypes.INTEGER, allowNull: false },
  score_type: {
    type: DataTypes.ENUM('oral', '15min', '1period', 'semester'),
    allowNull: false,
  },
  score_value: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    validate: { min: 0, max: 10 },
  },
  semester: { type: DataTypes.INTEGER, allowNull: false }, // 1 hoặc 2
  school_year: { type: DataTypes.STRING(9), allowNull: false },
  entered_by: { type: DataTypes.INTEGER, allowNull: false }, // user_id
  note: { type: DataTypes.STRING(255) },
}, {
  tableName: 'scores',
  indexes: [
    { fields: ['student_id', 'subject_id', 'semester', 'school_year'] },
  ],
});

module.exports = Score;
