'use strict';

/**
 * Seed điểm 2 học kỳ cho 90 HS × 6 môn (Toán, Lý, Hóa, Văn, Anh, Tin)
 * Mỗi môn / mỗi HK:
 *   - 2 điểm miệng (oral)
 *   - 2 điểm 15 phút (15min)
 *   - 1 điểm 1 tiết (1period)
 *   - 1 điểm học kỳ (semester)
 * → 6 dòng/môn × 6 môn × 2 HK = 72 dòng/HS × 90 HS = 6,480 dòng.
 *
 * entered_by: GVBM tương ứng đã được phân công (lấy từ teacher_assignments).
 */

const SUBJECT_CODES = ['TOAN', 'VLY', 'HOA', 'VAN', 'ANH', 'TIN'];

// Sinh điểm ngẫu nhiên có phân phối tự nhiên (5.0–9.5, hơi cao cho TB > 5)
const randomScore = (min = 4.5, max = 9.8) =>
  Math.round((min + Math.random() * (max - min)) * 10) / 10;

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const students = await queryInterface.sequelize.query(
      'SELECT id, class_id FROM students',
      { type: Sequelize.QueryTypes.SELECT },
    );
    const subjects = await queryInterface.sequelize.query(
      "SELECT id, code FROM subjects WHERE code IN ('TOAN','VLY','HOA','VAN','ANH','TIN')",
      { type: Sequelize.QueryTypes.SELECT },
    );
    const assignments = await queryInterface.sequelize.query(
      'SELECT teacher_id, class_id, subject_id FROM teacher_assignments',
      { type: Sequelize.QueryTypes.SELECT },
    );

    const subjectByCode = Object.fromEntries(subjects.map((s) => [s.code, s.id]));
    const teacherFor = (classId, subjectId) => {
      const a = assignments.find((x) => x.class_id === classId && x.subject_id === subjectId);
      return a?.teacher_id || 1; // fallback admin
    };

    const rows = [];

    for (const semester of [1, 2]) {
      for (const stu of students) {
        for (const code of SUBJECT_CODES) {
          const subjectId = subjectByCode[code];
          const teacherId = teacherFor(stu.class_id, subjectId);
          const base = {
            student_id: stu.id,
            subject_id: subjectId,
            class_id: stu.class_id,
            semester,
            school_year: '2024-2025',
            entered_by: teacherId,
            created_at: now,
            updated_at: now,
          };

          // 2 oral + 2 15min + 1 1period + 1 semester
          rows.push({ ...base, score_type: 'oral', score_value: randomScore() });
          rows.push({ ...base, score_type: 'oral', score_value: randomScore() });
          rows.push({ ...base, score_type: '15min', score_value: randomScore() });
          rows.push({ ...base, score_type: '15min', score_value: randomScore() });
          rows.push({ ...base, score_type: '1period', score_value: randomScore(5.0, 9.5) });
          rows.push({ ...base, score_type: 'semester', score_value: randomScore(5.0, 9.5) });
        }
      }
    }

    // Insert theo batch 1000 dòng để tránh "too many SQL variables" của SQLite
    const BATCH = 1000;
    for (let i = 0; i < rows.length; i += BATCH) {
      await queryInterface.bulkInsert('scores', rows.slice(i, i + BATCH));
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('scores', null, {});
  },
};
