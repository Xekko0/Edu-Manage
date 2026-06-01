/**
 * Bảng schedules — thời khóa biểu theo tuần/buổi/tiết.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Schedule = sequelize.define('Schedule', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  class_id: { type: DataTypes.INTEGER, allowNull: false },
  subject_id: { type: DataTypes.INTEGER, allowNull: false },
  teacher_id: { type: DataTypes.INTEGER, allowNull: false },
  day_of_week: { type: DataTypes.INTEGER, allowNull: false }, // 1=Mon ... 5=Fri
  session: {
    type: DataTypes.ENUM('morning', 'afternoon'),
    allowNull: false,
    defaultValue: 'morning',
  },
  period: { type: DataTypes.INTEGER, allowNull: false }, // 1..5 per session
  room: { type: DataTypes.STRING(50) },
  school_year: { type: DataTypes.STRING(9), allowNull: false },
}, {
  tableName: 'schedules',
});

module.exports = Schedule;
