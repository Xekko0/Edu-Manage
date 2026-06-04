'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const schoolYear = '2024-2025';
    const [rows] = await queryInterface.sequelize.query(
      'SELECT id FROM timetable_configs WHERE school_year = ? LIMIT 1',
      { replacements: [schoolYear] },
    );
    if (rows?.length) return;

    await queryInterface.bulkInsert('timetable_configs', [{
      school_year: schoolYear,
      days_of_week: JSON.stringify([1, 2, 3, 4, 5]),
      morning_periods: 5,
      afternoon_periods: 5,
      afternoon_enabled: true,
      created_at: now,
      updated_at: now,
    }]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('timetable_configs', { school_year: '2024-2025' }, {});
  },
};
