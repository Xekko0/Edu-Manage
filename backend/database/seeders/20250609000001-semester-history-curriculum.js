'use strict';

/**
 * Môn Sử 1,5 tiết/tuần (52/năm) → HK1: 2 tiết/tuần, HK2: 1 tiết/tuần.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const schoolYear = '2024-2025';
    const subjects = await queryInterface.sequelize.query(
      "SELECT id FROM subjects WHERE code = 'SU'",
      { type: Sequelize.QueryTypes.SELECT },
    );
    const suId = subjects[0]?.id;
    if (!suId) return;

    await queryInterface.bulkDelete('curriculum_standards', {
      school_year: schoolYear,
      subject_id: suId,
    }, {});

    const now = new Date();
    const rows = [];
    for (const grade_level of [10, 11, 12]) {
      rows.push({
        school_year: schoolYear,
        grade_level,
        subject_id: suId,
        semester: 1,
        total_periods_per_year: 35,
        teaching_weeks: 17,
        periods_per_week: 2,
        is_required: true,
        created_at: now,
        updated_at: now,
      });
      rows.push({
        school_year: schoolYear,
        grade_level,
        subject_id: suId,
        semester: 2,
        total_periods_per_year: 17,
        teaching_weeks: 18,
        periods_per_week: 1,
        is_required: true,
        created_at: now,
        updated_at: now,
      });
    }
    await queryInterface.bulkInsert('curriculum_standards', rows);
  },

  async down(queryInterface, Sequelize) {
    const subjects = await queryInterface.sequelize.query(
      "SELECT id FROM subjects WHERE code = 'SU'",
      { type: Sequelize.QueryTypes.SELECT },
    );
    const suId = subjects[0]?.id;
    if (!suId) return;
    await queryInterface.bulkDelete('curriculum_standards', {
      school_year: '2024-2025',
      subject_id: suId,
      semester: [1, 2],
    }, {});
  },
};
