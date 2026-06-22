/**
 * Bảng pending_attendance_alerts — cảnh báo vắng chờ 15 phút.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PendingAttendanceAlert = sequelize.define('PendingAttendanceAlert', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  attendance_date: { type: DataTypes.DATEONLY, allowNull: false },
  schedule_id: { type: DataTypes.INTEGER },
  marked_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  status: {
    type: DataTypes.ENUM('pending', 'cancelled', 'sent'),
    allowNull: false,
    defaultValue: 'pending',
  },
  parent_email: { type: DataTypes.STRING(150) },
}, {
  tableName: 'pending_attendance_alerts',
  indexes: [
    { fields: ['status', 'marked_at'] },
    { fields: ['student_id', 'attendance_date'] },
  ],
});

module.exports = PendingAttendanceAlert;
