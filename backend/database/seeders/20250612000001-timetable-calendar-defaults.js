'use strict';

const { defaultCalendarDates } = require('../../src/services/academic-calendar.service');

module.exports = {
  async up(queryInterface) {
    const schoolYear = '2024-2025';
    const defaults = defaultCalendarDates(schoolYear);
    const now = new Date();
    await queryInterface.sequelize.query(
      `UPDATE timetable_configs SET
        semester1_start = COALESCE(semester1_start, ?),
        semester1_end = COALESCE(semester1_end, ?),
        semester2_start = COALESCE(semester2_start, ?),
        semester2_end = COALESCE(semester2_end, ?),
        holidays = COALESCE(holidays, ?),
        morning_break_after_period = COALESCE(morning_break_after_period, 2),
        morning_break_minutes = COALESCE(morning_break_minutes, 20),
        afternoon_break_minutes = COALESCE(afternoon_break_minutes, 20),
        updated_at = ?
      WHERE school_year = ?`,
      {
        replacements: [
          defaults.semester1_start,
          defaults.semester1_end,
          defaults.semester2_start,
          defaults.semester2_end,
          JSON.stringify(defaults.holidays),
          now,
          schoolYear,
        ],
      },
    );
  },

  async down() {
    /* giữ dữ liệu lịch đã cấu hình */
  },
};
