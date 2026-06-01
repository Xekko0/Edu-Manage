/**
 * Bảng student_activity — bảng nối HS × hoạt động ngoại khóa.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StudentActivity = sequelize.define('StudentActivity', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  activity_id: { type: DataTypes.INTEGER, allowNull: false },
  registered_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  attended: { type: DataTypes.BOOLEAN, defaultValue: false },
  achievement: { type: DataTypes.STRING(255) },
}, {
  tableName: 'student_activity',
  indexes: [
    { unique: true, fields: ['student_id', 'activity_id'] },
  ],
});

module.exports = StudentActivity;
