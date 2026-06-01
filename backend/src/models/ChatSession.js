/**
 * Bảng chat_sessions — lịch sử chat AI Widget.
 * Lưu toàn bộ messages dưới dạng JSON array (không cần bảng riêng cho từng message).
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatSession = sequelize.define('ChatSession', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  session_token: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  messages: {
    type: DataTypes.JSON, // SQLite-compat (lưu TEXT JSON-serialize). Postgres tự dùng JSONB.
    defaultValue: [],
    // Mỗi message: { role: 'user'|'assistant', content, intent?, timestamp }
  },
  total_tokens: { type: DataTypes.INTEGER, defaultValue: 0 },
  ended_at: { type: DataTypes.DATE },
}, {
  tableName: 'chat_sessions',
});

module.exports = ChatSession;
