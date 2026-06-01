'use strict';

const SUBJECTS = [
  { code: 'TOAN', name: 'Toán' },
  { code: 'VLY', name: 'Vật lý' },
  { code: 'HOA', name: 'Hóa học' },
  { code: 'SINH', name: 'Sinh học' },
  { code: 'VAN', name: 'Ngữ văn' },
  { code: 'SU', name: 'Lịch sử' },
  { code: 'DIA', name: 'Địa lý' },
  { code: 'GDCD', name: 'Giáo dục công dân' },
  { code: 'ANH', name: 'Tiếng Anh' },
  { code: 'TIN', name: 'Tin học' },
  { code: 'TD', name: 'Thể dục' },
  { code: 'CN', name: 'Công nghệ' },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rows = SUBJECTS.map((s) => ({
      ...s,
      description: `Môn ${s.name} chương trình PTTH`,
      is_active: true,
      created_at: now,
      updated_at: now,
    }));
    await queryInterface.bulkInsert('subjects', rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('subjects', null, {});
  },
};
