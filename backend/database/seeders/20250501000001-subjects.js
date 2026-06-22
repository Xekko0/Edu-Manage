'use strict';

/** Danh mục môn THPT (GDPT) — seed ban đầu; seeder 20250611000001 bổ sung/đồng bộ đầy đủ. */
const SUBJECTS = [
  { code: 'TOAN', name: 'Toán' },
  { code: 'VAN', name: 'Ngữ văn' },
  { code: 'ANH', name: 'Tiếng Anh (Ngoại ngữ 1)' },
  { code: 'SU', name: 'Lịch sử' },
  { code: 'TD', name: 'Giáo dục thể chất' },
  { code: 'GDQP', name: 'Giáo dục quốc phòng và an ninh' },
  { code: 'HTTN', name: 'Hoạt động trải nghiệm, hướng nghiệp' },
  { code: 'TRUNG', name: 'Tiếng Trung (Ngoại ngữ 1)' },
  { code: 'PHAP', name: 'Tiếng Pháp (Ngoại ngữ 1)' },
  { code: 'NGA', name: 'Tiếng Nga (Ngoại ngữ 1)' },
  { code: 'NHAT', name: 'Tiếng Nhật (Ngoại ngữ 1)' },
  { code: 'HAN', name: 'Tiếng Hàn (Ngoại ngữ 1)' },
  { code: 'VLY', name: 'Vật lí' },
  { code: 'HOA', name: 'Hóa học' },
  { code: 'SINH', name: 'Sinh học' },
  { code: 'DIA', name: 'Địa lí' },
  { code: 'GDKTPL', name: 'Giáo dục kinh tế và pháp luật' },
  { code: 'TIN', name: 'Tin học' },
  { code: 'CN', name: 'Công nghệ' },
  { code: 'AMNHAC', name: 'Âm nhạc' },
  { code: 'MTHUAT', name: 'Mĩ thuật' },
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
