'use strict';

/**
 * Seed mẫu:
 *  - 5 dòng sổ đầu bài cho mỗi lớp (5 ngày gần nhất)
 *  - 1 đánh giá tổng (homeroom) + 1 đánh giá hạnh kiểm (conduct) cho mỗi HS HK1
 *  - 1 đánh giá môn Toán (subject) cho mỗi HS lớp 10A1 HK1
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const classes = await queryInterface.sequelize.query(
      'SELECT id, name, homeroom_teacher_id FROM classes',
      { type: Sequelize.QueryTypes.SELECT },
    );
    const subjects = await queryInterface.sequelize.query(
      "SELECT id, code FROM subjects WHERE code = 'TOAN'",
      { type: Sequelize.QueryTypes.SELECT },
    );
    const toanId = subjects[0]?.id;
    const toanTeacher = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'gv.toan@edusmart.local'",
      { type: Sequelize.QueryTypes.SELECT },
    );
    const toanTeacherId = toanTeacher[0]?.id;

    // === Sổ đầu bài ===
    const journals = [];
    for (const cls of classes) {
      for (let i = 0; i < 5; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        journals.push({
          class_id: cls.id,
          subject_id: null, // ghi tổng từ GVCN
          teacher_id: cls.homeroom_teacher_id,
          lesson_date: d.toISOString().slice(0, 10),
          period: null,
          content: `Nhận xét chung buổi học ngày ${d.toLocaleDateString('vi-VN')} — lớp ${cls.name}.`,
          discipline_note: i % 3 === 0 ? 'Một số HS đi học muộn.' : 'Cả lớp giữ trật tự tốt.',
          rating: i % 4 === 0 ? 'fair' : 'good',
          absent_count: i % 3,
          created_at: now, updated_at: now,
        });
      }
    }
    await queryInterface.bulkInsert('class_journals', journals);

    // === Đánh giá GVCN + Hạnh kiểm cho tất cả HS ===
    const students = await queryInterface.sequelize.query(
      'SELECT s.id, s.class_id, c.homeroom_teacher_id FROM students s JOIN classes c ON c.id = s.class_id',
      { type: Sequelize.QueryTypes.SELECT },
    );

    const evaluations = [];
    for (const s of students) {
      evaluations.push({
        student_id: s.id, teacher_id: s.homeroom_teacher_id, subject_id: null,
        type: 'homeroom', semester: 1, school_year: '2024-2025',
        content: 'Học sinh có ý thức học tập tốt, tham gia tích cực các hoạt động lớp.',
        created_at: now, updated_at: now,
      });
      evaluations.push({
        student_id: s.id, teacher_id: s.homeroom_teacher_id, subject_id: null,
        type: 'conduct', semester: 1, school_year: '2024-2025',
        content: 'Chấp hành tốt nội quy nhà trường.',
        conduct_grade: 'good',
        created_at: now, updated_at: now,
      });
    }

    // Thêm đánh giá môn Toán cho HS lớp 10A1
    const class10a1 = classes.find((c) => c.name === '10A1');
    if (class10a1 && toanId && toanTeacherId) {
      const class10a1Students = students.filter((s) => s.class_id === class10a1.id);
      class10a1Students.forEach((s) => {
        evaluations.push({
          student_id: s.id, teacher_id: toanTeacherId, subject_id: toanId,
          type: 'subject', semester: 1, school_year: '2024-2025',
          content: 'Tiếp thu bài Toán khá. Cần tăng cường luyện tập hình học không gian.',
          created_at: now, updated_at: now,
        });
      });
    }

    await queryInterface.bulkInsert('evaluations', evaluations);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('class_journals', null, {});
    await queryInterface.bulkDelete('evaluations', null, {});
  },
};
