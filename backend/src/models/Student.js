/**
 * Bảng students — hồ sơ học sinh, liên kết tài khoản users.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  student_code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  date_of_birth: { type: DataTypes.DATEONLY },
  gender: { type: DataTypes.ENUM('male', 'female', 'other') },
  address: { type: DataTypes.STRING(500) },
  class_id: { type: DataTypes.INTEGER },
  enrollment_year: { type: DataTypes.INTEGER },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'students',
});

module.exports = Student;
