/**
 * Bảng score_audit_log — Nhật ký kiểm toán điểm số (không thể xóa/sửa).
 * Tự động ghi khi điểm số bị cập nhật.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScoreAuditLog = sequelize.define('ScoreAuditLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  score_id: { type: DataTypes.INTEGER, allowNull: false },
  old_value: { type: DataTypes.DECIMAL(4, 2) },
  new_value: { type: DataTypes.DECIMAL(4, 2), allowNull: false },
  modified_by: { type: DataTypes.INTEGER, allowNull: false },
  modified_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  reason: { type: DataTypes.TEXT },
}, {
  tableName: 'score_audit_log',
  timestamps: false, // Không có created_at/updated_at/deleted_at
  paranoid: false,   // Không soft delete — audit log không thể xóa
});

module.exports = ScoreAuditLog;
