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
  room_id: { type: DataTypes.INTEGER, allowNull: true },
  delivery_mode: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'offline',
  },
  online_meeting_url: { type: DataTypes.TEXT, allowNull: true },
  lesson_topic: { type: DataTypes.STRING(200), allowNull: true },
  homework_reminder: { type: DataTypes.TEXT, allowNull: true },
  school_year: { type: DataTypes.STRING(9), allowNull: false },
  program_component: { type: DataTypes.STRING(30), allowNull: true },
}, {
  tableName: 'schedules',
  /** TKB dùng unique index ô lớp/GV — không soft-delete (tránh “ô trống” nhưng không thêm được). */
  paranoid: false,
});

module.exports = Schedule;
