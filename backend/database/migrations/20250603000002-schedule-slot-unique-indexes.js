'use strict';

/**
 * Dọn trùng ô lớp / ô GV rồi thêm unique — một tiết mỗi ô lớp, một GV mỗi khung giờ.
 */
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;

    // Giữ bản ghi id nhỏ nhất mỗi ô lớp trùng (SQLite + PostgreSQL)
    await sequelize.query(`
      DELETE FROM schedules
      WHERE id IN (
        SELECT s1.id FROM schedules s1
        INNER JOIN schedules s2 ON
          s1.class_id = s2.class_id
          AND s1.school_year = s2.school_year
          AND s1.day_of_week = s2.day_of_week
          AND s1.session = s2.session
          AND s1.period = s2.period
          AND s1.id > s2.id
      )
    `);

    await sequelize.query(`
      DELETE FROM schedules
      WHERE id IN (
        SELECT s1.id FROM schedules s1
        INNER JOIN schedules s2 ON
          s1.teacher_id = s2.teacher_id
          AND s1.school_year = s2.school_year
          AND s1.day_of_week = s2.day_of_week
          AND s1.session = s2.session
          AND s1.period = s2.period
          AND s1.id > s2.id
      )
    `);

    try {
      await queryInterface.removeIndex('schedules', 'schedules_class_slot_unique');
    } catch {
      /* chưa có */
    }
    try {
      await queryInterface.removeIndex('schedules', 'schedules_teacher_slot_unique');
    } catch {
      /* chưa có */
    }

    await queryInterface.addIndex(
      'schedules',
      ['class_id', 'school_year', 'day_of_week', 'session', 'period'],
      { unique: true, name: 'schedules_class_slot_unique' },
    );

    await queryInterface.addIndex(
      'schedules',
      ['teacher_id', 'school_year', 'day_of_week', 'session', 'period'],
      { unique: true, name: 'schedules_teacher_slot_unique' },
    );
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeIndex('schedules', 'schedules_teacher_slot_unique');
    } catch { /* ignore */ }
    try {
      await queryInterface.removeIndex('schedules', 'schedules_class_slot_unique');
    } catch { /* ignore */ }
  },
};
