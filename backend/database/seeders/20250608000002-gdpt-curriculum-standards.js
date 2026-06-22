'use strict';

/**
 * Khung CT THPT theo GDPT 2018 (tiết/năm, 35 tuần) — thay demo periods_per_week cũ.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const schoolYear = '2024-2025';
    const teachingWeeks = 35;

    await queryInterface.bulkDelete('curriculum_standards', { school_year: schoolYear }, {});

    const subjects = await queryInterface.sequelize.query(
      'SELECT id, code FROM subjects',
      { type: Sequelize.QueryTypes.SELECT },
    );
    const byCode = Object.fromEntries(subjects.map((s) => [s.code, s.id]));

    const annualByCode = {
      TOAN: 105,
      VAN: 105,
      ANH: 105,
      SU: 52,
      TD: 70,
      GDQP: 35,
      HTTN: 35,
      VLY: 70,
      HOA: 70,
      SINH: 70,
      DIA: 70,
      GDKTPL: 52,
      CN: 70,
      TIN: 70,
      AMNHAC: 35,
      MTHUAT: 35,
    };

    const now = new Date();
    const rows = [];
    for (const grade_level of [10, 11, 12]) {
      for (const [code, total] of Object.entries(annualByCode)) {
        const subject_id = byCode[code];
        if (!subject_id) continue;
        const periods_per_week = Math.round(total / teachingWeeks);
        rows.push({
          school_year: schoolYear,
          grade_level,
          subject_id,
          total_periods_per_year: total,
          teaching_weeks: teachingWeeks,
          periods_per_week,
          is_required: ['TOAN', 'VAN', 'ANH', 'SU', 'TD', 'GDQP', 'HTTN'].includes(code),
          created_at: now,
          updated_at: now,
        });
      }
    }

    if (rows.length) {
      await queryInterface.bulkInsert('curriculum_standards', rows);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('curriculum_standards', { school_year: '2024-2025' }, {});
  },
};
