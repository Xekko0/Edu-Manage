/**
 * Bảng users — tài khoản toàn hệ thống.
 * role: admin | homeroom | subject | parent | student
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING(255), allowNull: false },
  full_name: { type: DataTypes.STRING(150), allowNull: false },
  role: {
    type: DataTypes.ENUM('admin', 'homeroom', 'subject', 'parent', 'student'),
    allowNull: false,
  },
  phone: { type: DataTypes.STRING(20) },
  avatar_url: { type: DataTypes.STRING(500) },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  failed_login_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  locked_until: { type: DataTypes.DATE },
  last_login_at: { type: DataTypes.DATE },
}, {
  tableName: 'users',
});

module.exports = User;
