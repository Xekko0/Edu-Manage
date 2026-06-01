/**
 * Bảng attendance — điểm danh theo buổi học.
 * status: present | excused | absent
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  schedule_id: { type: DataTypes.INTEGER },
  attendance_date: { type: DataTypes.DATEONLY, allowNull: false },
  status: {
    type: DataTypes.ENUM('present', 'excused', 'absent'),
    allowNull: false,
    defaultValue: 'present',
  },
  note: { type: DataTypes.STRING(255) },
  marked_by: { type: DataTypes.INTEGER },
}, {
  tableName: 'attendance',
  indexes: [
    { fields: ['student_id', 'attendance_date'] },
  ],
});

module.exports = Attendance;
