'use strict';

/**
 * Seed học phí mẫu: mỗi lớp 2 đợt (HK1, HK2) năm học 2024-2025.
 * Mức thu: 3,000,000 VND/HK cho khối 10, 3,500,000 VND/HK cho khối 11.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const classes = await queryInterface.sequelize.query(
      'SELECT id, name, grade_level FROM classes',
      { type: Sequelize.QueryTypes.SELECT },
    );

    const rows = [];
    for (const cls of classes) {
      const amount = cls.grade_level === 10 ? 3000000 : 3500000;
      rows.push({
        class_id: cls.id, school_year: '2024-2025', semester: 1,
        amount, due_date: '2024-10-15',
        description: `Học phí HK1 năm học 2024-2025 — lớp ${cls.name}`,
        is_active: true, created_at: now, updated_at: now,
      });
      rows.push({
        class_id: cls.id, school_year: '2024-2025', semester: 2,
        amount, due_date: '2025-02-15',
        description: `Học phí HK2 năm học 2024-2025 — lớp ${cls.name}`,
        is_active: true, created_at: now, updated_at: now,
      });
    }
    await queryInterface.bulkInsert('tuitions', rows);

    // Seed payments: ~70% HS đã đóng HK1, 30% chưa
    const tuitions = await queryInterface.sequelize.query(
      'SELECT id, class_id, semester, amount FROM tuitions WHERE semester = 1',
      { type: Sequelize.QueryTypes.SELECT },
    );
    const students = await queryInterface.sequelize.query(
      'SELECT id, class_id FROM students',
      { type: Sequelize.QueryTypes.SELECT },
    );

    const payments = [];
    for (const t of tuitions) {
      const studentsInClass = students.filter((s) => s.class_id === t.class_id);
      studentsInClass.forEach((stu, idx) => {
        const r = idx % 10;
        let status, paid_at = null, amount_paid = 0;
        if (r < 7) {
          status = 'paid';
          amount_paid = t.amount;
          paid_at = new Date('2024-09-25');
        } else if (r < 9) {
          status = 'partial';
          amount_paid = t.amount / 2;
          paid_at = new Date('2024-10-05');
        } else {
          status = 'unpaid';
        }
        payments.push({
          tuition_id: t.id, student_id: stu.id, amount_paid, status, paid_at,
          created_at: now, updated_at: now,
        });
      });
    }
    await queryInterface.bulkInsert('tuition_payments', payments);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('tuition_payments', null, {});
    await queryInterface.bulkDelete('tuitions', null, {});
  },
};
