'use strict';

/**
 * Seed TKB — dùng thuật toán autoArrangeSchool (không trùng GV giữa lớp).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const schoolYear = '2024-2025';

    await queryInterface.bulkDelete('schedules', { school_year: schoolYear }, {});

    const scheduleService = require('../../src/services/schedule.service');
    await scheduleService.seedArrangeFromAssignments({
      school_year: schoolYear,
      clearExisting: true,
    });

    const [countRows] = await queryInterface.sequelize.query(
      'SELECT COUNT(*) AS c FROM extracurriculars',
    );
    const extracCount = Number(countRows?.[0]?.c ?? countRows?.[0]?.C ?? 0);
    if (!extracCount) {
      await queryInterface.bulkInsert('extracurriculars', [
        {
          name: 'Câu lạc bộ Robotics',
          description: 'Lập trình robot, thi đấu STEM',
          start_date: new Date('2024-09-01'),
          end_date: new Date('2025-05-31'),
          location: 'Phòng Tin học',
          organizer: 'Ban STEM',
          is_active: true,
          created_at: now,
          updated_at: now,
        },
        {
          name: 'Đội bóng đá',
          description: 'Tập luyện thứ 4, 5 hàng tuần',
          start_date: new Date('2024-09-01'),
          end_date: new Date('2025-05-31'),
          location: 'Sân thể thao',
          organizer: 'Tổ TD',
          is_active: true,
          created_at: now,
          updated_at: now,
        },
      ]);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('schedules', null, {});
    await queryInterface.bulkDelete('extracurriculars', null, {});
  },
};
