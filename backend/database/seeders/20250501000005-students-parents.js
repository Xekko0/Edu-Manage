'use strict';

const bcrypt = require('bcrypt');

/**
 * Seed 90 học sinh (30/lớp × 3 lớp) + 90 phụ huynh + liên kết parent_student.
 * Mật khẩu mặc định: 'edusmart123'.
 *
 * Quy ước email:
 *   hs.10a1.01@edusmart.local … hs.11a1.30@edusmart.local
 *   ph.10a1.01@edusmart.local … ph.11a1.30@edusmart.local
 */

const FIRST_NAMES = ['An', 'Bình', 'Châu', 'Dũng', 'Hà', 'Hải', 'Huy', 'Khanh', 'Lan', 'Linh',
  'Long', 'Mai', 'Minh', 'Nam', 'Ngọc', 'Phong', 'Phương', 'Quân', 'Quỳnh', 'Sơn',
  'Thảo', 'Thu', 'Trang', 'Trung', 'Tú', 'Tuấn', 'Vy', 'Yến', 'Đạt', 'Hiếu'];
const LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Phan'];

const pick = (arr, i) => arr[i % arr.length];

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const hashed = await bcrypt.hash('edusmart123', 10);

    const classes = await queryInterface.sequelize.query(
      'SELECT id, name FROM classes',
      { type: Sequelize.QueryTypes.SELECT },
    );

    const studentUsers = [];
    const parentUsers = [];

    for (const cls of classes) {
      for (let i = 1; i <= 30; i++) {
        const idx = i - 1;
        const firstName = pick(FIRST_NAMES, idx);
        const lastName = pick(LAST_NAMES, idx + 3);
        const suffix = `${cls.name.toLowerCase()}.${String(i).padStart(2, '0')}`;

        studentUsers.push({
          email: `hs.${suffix}@edusmart.local`,
          password: hashed,
          full_name: `${lastName} ${firstName} HS-${cls.name}-${String(i).padStart(2, '0')}`,
          role: 'student',
          is_active: true, created_at: now, updated_at: now,
        });
        parentUsers.push({
          email: `ph.${suffix}@edusmart.local`,
          password: hashed,
          full_name: `${lastName} ${firstName} (PH HS-${cls.name}-${String(i).padStart(2, '0')})`,
          role: 'parent',
          is_active: true, created_at: now, updated_at: now,
        });
      }
    }

    await queryInterface.bulkInsert('users', [...studentUsers, ...parentUsers]);

    // Lấy lại id sau khi insert
    const allUsers = await queryInterface.sequelize.query(
      "SELECT id, email, role FROM users WHERE role IN ('student','parent') ORDER BY id",
      { type: Sequelize.QueryTypes.SELECT },
    );

    const studentRows = [];
    const linkRows = [];

    for (const cls of classes) {
      for (let i = 1; i <= 30; i++) {
        const suffix = `${cls.name.toLowerCase()}.${String(i).padStart(2, '0')}`;
        const studentUser = allUsers.find((u) => u.email === `hs.${suffix}@edusmart.local`);
        const parentUser = allUsers.find((u) => u.email === `ph.${suffix}@edusmart.local`);

        studentRows.push({
          user_id: studentUser.id,
          student_code: `HS${cls.name}${String(i).padStart(2, '0')}`,
          date_of_birth: new Date(2009 - (cls.name.startsWith('11') ? 1 : 0), (i % 12), (i % 28) + 1),
          gender: i % 2 === 0 ? 'female' : 'male',
          address: `Số ${i}, Đường Học, Quận EduSmart`,
          class_id: cls.id,
          enrollment_year: 2024,
          is_active: true, created_at: now, updated_at: now,
        });
      }
    }
    await queryInterface.bulkInsert('students', studentRows);

    // Liên kết PH - HS
    const allStudents = await queryInterface.sequelize.query(
      'SELECT id, student_code FROM students',
      { type: Sequelize.QueryTypes.SELECT },
    );
    for (const cls of classes) {
      for (let i = 1; i <= 30; i++) {
        const code = `HS${cls.name}${String(i).padStart(2, '0')}`;
        const suffix = `${cls.name.toLowerCase()}.${String(i).padStart(2, '0')}`;
        const student = allStudents.find((s) => s.student_code === code);
        const parent = allUsers.find((u) => u.email === `ph.${suffix}@edusmart.local`);
        if (student && parent) {
          linkRows.push({
            parent_id: parent.id,
            student_id: student.id,
            created_at: now,
            updated_at: now,
          });
        }
      }
    }
    await queryInterface.bulkInsert('parent_student', linkRows);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('parent_student', null, {});
    await queryInterface.bulkDelete('students', null, {});
    await queryInterface.bulkDelete('users', {
      role: { [Sequelize.Op.in]: ['student', 'parent'] },
    });
  },
};
