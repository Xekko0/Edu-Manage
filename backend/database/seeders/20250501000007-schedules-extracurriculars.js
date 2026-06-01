'use strict';

/**
 * Seed thời khóa biểu mẫu (5 ngày × 5 tiết / lớp) + 3 hoạt động ngoại khóa.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const classes = await queryInterface.sequelize.query(
      'SELECT id, name FROM classes',
      { type: Sequelize.QueryTypes.SELECT },
    );
    const assignments = await queryInterface.sequelize.query(
      'SELECT teacher_id, class_id, subject_id FROM teacher_assignments',
      { type: Sequelize.QueryTypes.SELECT },
    );

    const schedules = [];
    for (const cls of classes) {
      const subjectsOfClass = assignments.filter((a) => a.class_id === cls.id);
      if (subjectsOfClass.length === 0) continue;

      let cursor = 0;
      for (const session of ['morning', 'afternoon']) {
        for (let day = 1; day <= 5; day++) {
          const maxPeriod = session === 'morning' ? 5 : 3;
          for (let period = 1; period <= maxPeriod; period++) {
            const slot = subjectsOfClass[cursor % subjectsOfClass.length];
            cursor++;
            schedules.push({
              class_id: cls.id,
              subject_id: slot.subject_id,
              teacher_id: slot.teacher_id,
              day_of_week: day,
              session,
              period,
              room: `P${cls.name}-${session === 'morning' ? 'S' : 'C'}${period}`,
              school_year: '2024-2025',
              created_at: now,
              updated_at: now,
            });
          }
        }
      }
    }
    await queryInterface.bulkInsert('schedules', schedules);

    // 3 hoạt động ngoại khóa
    const activities = [
      {
        name: 'Hội thi Khoa học Kỹ thuật cấp trường',
        description: 'Triển lãm dự án STEM của học sinh khối 10-12.',
        start_date: new Date('2025-03-15T08:00:00'),
        end_date: new Date('2025-03-15T17:00:00'),
        location: 'Hội trường lớn',
        organizer: 'Tổ chuyên môn Lý-Hóa-Sinh',
        is_active: true, created_at: now, updated_at: now,
      },
      {
        name: 'CLB Tiếng Anh — Speaking Marathon',
        description: 'Hoạt động luyện nói tiếng Anh chủ đề "Future Career".',
        start_date: new Date('2025-04-10T14:00:00'),
        end_date: new Date('2025-04-10T16:30:00'),
        location: 'Phòng 201',
        organizer: 'CLB English',
        is_active: true, created_at: now, updated_at: now,
      },
      {
        name: 'Giải bóng đá học sinh khối 10',
        description: 'Giải bóng đá nội bộ giữa các lớp khối 10.',
        start_date: new Date('2025-05-05T15:30:00'),
        end_date: new Date('2025-05-20T17:30:00'),
        location: 'Sân thể chất',
        organizer: 'Đoàn trường',
        is_active: true, created_at: now, updated_at: now,
      },
    ];
    await queryInterface.bulkInsert('extracurriculars', activities);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('schedules', null, {});
    await queryInterface.bulkDelete('extracurriculars', null, {});
  },
};
