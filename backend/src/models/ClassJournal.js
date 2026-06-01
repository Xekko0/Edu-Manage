/**
 * Bảng class_journals — Sổ đầu bài.
 * Mỗi buổi học → 1 dòng do GVBM (tiết môn) hoặc GVCN (tổng buổi) ghi.
 * Trường:
 *   - lesson_date    : ngày
 *   - period         : tiết (1..10) — null nếu là ghi chú tổng buổi của GVCN
 *   - subject_id     : null nếu là ghi chú tổng (GVCN), có giá trị nếu là tiết môn (GVBM)
 *   - content        : nội dung dạy
 *   - discipline_note: nhận xét nề nếp
 *   - rating         : enum tốt/khá/tb/yếu (cho cả lớp tiết đó)
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClassJournal = sequelize.define('ClassJournal', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  class_id: { type: DataTypes.INTEGER, allowNull: false },
  subject_id: { type: DataTypes.INTEGER }, // null = ghi chú tổng của GVCN
  teacher_id: { type: DataTypes.INTEGER, allowNull: false },
  lesson_date: { type: DataTypes.DATEONLY, allowNull: false },
  period: { type: DataTypes.INTEGER },
  content: { type: DataTypes.TEXT },
  discipline_note: { type: DataTypes.STRING(500) },
  rating: { type: DataTypes.ENUM('good', 'fair', 'average', 'poor') },
  absent_count: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'class_journals',
  indexes: [
    { fields: ['class_id', 'lesson_date'] },
  ],
});

module.exports = ClassJournal;
