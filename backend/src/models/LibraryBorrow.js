/**
 * Bảng library_borrows — Mượn trả sách.
 * AI Chatbot đọc bảng này để nhắc HS khi sắp đến hạn trả.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LibraryBorrow = sequelize.define('LibraryBorrow', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  book_title: { type: DataTypes.STRING(300), allowNull: false },
  book_isbn: { type: DataTypes.STRING(20) },
  borrow_date: { type: DataTypes.DATEONLY, allowNull: false },
  due_date: { type: DataTypes.DATEONLY, allowNull: false },
  return_date: { type: DataTypes.DATEONLY },
  status: {
    type: DataTypes.ENUM('borrowed', 'returned', 'overdue'),
    allowNull: false,
    defaultValue: 'borrowed',
  },
  notes: { type: DataTypes.STRING(255) },
}, {
  tableName: 'library_borrows',
  indexes: [
    { fields: ['student_id'] },
    { fields: ['status', 'due_date'] },
  ],
});

module.exports = LibraryBorrow;
