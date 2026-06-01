/**
 * Bảng notifications — thông báo nội bộ + log email.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  type: {
    type: DataTypes.ENUM('system', 'score', 'attendance', 'event', 'message'),
    defaultValue: 'system',
  },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  email_sent: { type: DataTypes.BOOLEAN, defaultValue: false },
  metadata: { type: DataTypes.JSON }, // SQLite-compat
}, {
  tableName: 'notifications',
});

module.exports = Notification;
