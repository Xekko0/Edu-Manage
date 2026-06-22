'use strict';

const bcrypt = require('bcrypt');

/**
 * Tài khoản hệ thống (admin + giáo viên):
 *  - 1 Admin
 *  - Tất cả giáo viên đều là GVBM (role='subject')
 *  - Một số giáo viên có thể được gán làm GVCN qua classes.homeroom_teacher_id
 *
 * Mật khẩu mẫu: 'edusmart123' (hash bcrypt salt rounds = 10).
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const hashed = await bcrypt.hash('Admin@123', 10);

    const users = [
      // Admin
      { email: 'admin@edusmart.vn', full_name: 'Nguyễn Văn Hiệu Trưởng', role: 'admin' },

      // Giáo viên (có thể được gán làm GVCN qua bảng classes)
      { email: 'gvcn.10a1@edusmart.local', full_name: 'Trần Thị Lan (GV 10A1)', role: 'subject' },
      { email: 'gvcn.10a2@edusmart.local', full_name: 'Lê Văn Minh (GV 10A2)', role: 'subject' },
      { email: 'gvcn.11a1@edusmart.local', full_name: 'Phạm Thu Hà (GV 11A1)', role: 'subject' },

      // 6 GVBM
      { email: 'gv.toan@edusmart.local',  full_name: 'Hoàng Văn Toán',  role: 'subject' },
      { email: 'gv.ly@edusmart.local',    full_name: 'Đặng Thị Lý',     role: 'subject' },
      { email: 'gv.hoa@edusmart.local',   full_name: 'Vũ Hoàng Hóa',    role: 'subject' },
      { email: 'gv.van@edusmart.local',   full_name: 'Bùi Thị Văn',     role: 'subject' },
      { email: 'gv.anh@edusmart.local',   full_name: 'Phan Văn Anh',    role: 'subject' },
      { email: 'gv.tin@edusmart.local',   full_name: 'Đỗ Quốc Tin',     role: 'subject' },
    ].map((u) => ({
      ...u,
      password: hashed,
      is_active: true,
      created_at: now,
      updated_at: now,
    }));

    await queryInterface.bulkInsert('users', users);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      role: { [Sequelize.Op.in]: ['admin', 'subject'] },
    });
  },
};
