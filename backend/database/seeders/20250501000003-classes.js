'use strict';

/**
 * 3 lớp với GVCN tương ứng (gắn homeroom_teacher_id sau khi users đã seed).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const teachers = await queryInterface.sequelize.query(
      "SELECT id, email FROM users WHERE role = 'subject'",
      { type: Sequelize.QueryTypes.SELECT },
    );
    const byEmail = Object.fromEntries(teachers.map((t) => [t.email, t.id]));

    const classes = [
      {
        name: '10A1', grade_level: 10, school_year: '2024-2025',
        homeroom_teacher_id: byEmail['gvcn.10a1@edusmart.local'],
        is_active: true, created_at: now, updated_at: now,
      },
      {
        name: '10A2', grade_level: 10, school_year: '2024-2025',
        homeroom_teacher_id: byEmail['gvcn.10a2@edusmart.local'],
        is_active: true, created_at: now, updated_at: now,
      },
      {
        name: '11A1', grade_level: 11, school_year: '2024-2025',
        homeroom_teacher_id: byEmail['gvcn.11a1@edusmart.local'],
        is_active: true, created_at: now, updated_at: now,
      },
    ];

    await queryInterface.bulkInsert('classes', classes);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('classes', null, {});
  },
};
