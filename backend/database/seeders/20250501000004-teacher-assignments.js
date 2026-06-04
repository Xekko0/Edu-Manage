'use strict';

/**
 * Phân công GVBM (bảng teacher_assignments — MỚI v1.1).
 * Mỗi GVBM dạy 1 môn × 3 lớp (10A1, 10A2, 11A1).
 * GVCN cũng được phân công dạy 1 môn ở lớp khác (để test scenario "GVCN + GVBM").
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const teachers = await queryInterface.sequelize.query(
      "SELECT id, email FROM users WHERE role IN ('subject','homeroom')",
      { type: Sequelize.QueryTypes.SELECT },
    );
    const classes = await queryInterface.sequelize.query(
      'SELECT id, name FROM classes',
      { type: Sequelize.QueryTypes.SELECT },
    );
    const subjects = await queryInterface.sequelize.query(
      'SELECT id, code FROM subjects',
      { type: Sequelize.QueryTypes.SELECT },
    );

    const teacherByEmail = Object.fromEntries(teachers.map((t) => [t.email, t.id]));
    const classByName = Object.fromEntries(classes.map((c) => [c.name, c.id]));
    const subjectByCode = Object.fromEntries(subjects.map((s) => [s.code, s.id]));

    const periodsByCode = {
      TOAN: 4, VLY: 4, VAN: 4, HOA: 3, ANH: 3, TIN: 2, SINH: 2,
    };

    const assignments = [];

    const teacherSubjectMap = [
      { email: 'gv.toan@edusmart.local', code: 'TOAN' },
      { email: 'gv.ly@edusmart.local', code: 'VLY' },
      { email: 'gv.hoa@edusmart.local', code: 'HOA' },
      { email: 'gv.van@edusmart.local', code: 'VAN' },
      { email: 'gv.anh@edusmart.local', code: 'ANH' },
      { email: 'gv.tin@edusmart.local', code: 'TIN' },
    ];

    for (const { email, code } of teacherSubjectMap) {
      for (const className of ['10A1', '10A2', '11A1']) {
        assignments.push({
          teacher_id: teacherByEmail[email],
          class_id: classByName[className],
          subject_id: subjectByCode[code],
          school_year: '2024-2025',
          periods_per_week: periodsByCode[code] || 2,
          is_active: true,
          created_at: now,
          updated_at: now,
        });
      }
    }

    assignments.push({
      teacher_id: teacherByEmail['gvcn.10a1@edusmart.local'],
      class_id: classByName['10A2'],
      subject_id: subjectByCode['SINH'],
      school_year: '2024-2025',
      periods_per_week: periodsByCode.SINH,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    await queryInterface.bulkInsert('teacher_assignments', assignments);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('teacher_assignments', null, {});
  },
};
