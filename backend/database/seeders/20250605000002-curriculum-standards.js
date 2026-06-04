'use strict';

/**
 * Khung chương trình THPT theo khối — đồng bộ periods với seed phân công.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const schoolYear = '2024-2025';
    const subjects = await queryInterface.sequelize.query(
      'SELECT id, code FROM subjects',
      { type: Sequelize.QueryTypes.SELECT },
    );
    const byCode = Object.fromEntries(subjects.map((s) => [s.code, s.id]));

    const periodsByCode = {
      TOAN: 4, VLY: 4, VAN: 4, HOA: 3, ANH: 3, TIN: 2, SINH: 2,
    };

    const now = new Date();
    const rows = [];
    for (const grade_level of [10, 11, 12]) {
      for (const [code, periods] of Object.entries(periodsByCode)) {
        const subject_id = byCode[code];
        if (!subject_id) continue;
        rows.push({
          school_year: schoolYear,
          grade_level,
          subject_id,
          periods_per_week: periods,
          is_required: true,
          created_at: now,
          updated_at: now,
        });
      }
    }

    if (rows.length) {
      await queryInterface.bulkInsert('curriculum_standards', rows);
    }

    const roomTypeByCode = {
      HOA: 'lab',
      VLY: 'lab',
      TIN: 'computer',
      SINH: 'lab',
    };
    for (const [code, room_type] of Object.entries(roomTypeByCode)) {
      if (byCode[code]) {
        await queryInterface.sequelize.query(
          'UPDATE subjects SET preferred_room_type = ? WHERE id = ?',
          { replacements: [room_type, byCode[code]] },
        );
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('curriculum_standards', { school_year: '2024-2025' }, {});
  },
};
