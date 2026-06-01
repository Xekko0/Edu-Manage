'use strict';

/** Cho phép nhiều môn trong cùng một ô lớp (trùng lịch hiển thị đỏ). */
module.exports = {
  async up(queryInterface) {
    try {
      await queryInterface.removeIndex('schedules', 'schedules_class_slot_unique');
    } catch {
      /* đã gỡ hoặc tên khác */
    }
  },

  async down(queryInterface) {
    await queryInterface.addIndex(
      'schedules',
      ['class_id', 'school_year', 'day_of_week', 'session', 'period'],
      { unique: true, name: 'schedules_class_slot_unique' },
    );
  },
};
