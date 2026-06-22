'use strict';

/**
 * Seed competencies theo GDPT 2018 — 10 năng lực cốt lõi + năng lực đặc thù.
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rows = [
      // 10 năng lực chung (core)
      { code: 'SELF_DIRECTED', name: 'Năng lực tự chủ và tự học', category: 'core', description: 'Khả năng xác định mục tiêu, lập kế hoạch, tự điều chỉnh và đánh giá bản thân.', is_active: true, created_at: now, updated_at: now },
      { code: 'CREATIVE', name: 'Năng lực sáng tạo', category: 'core', description: 'Khả năng tư duy độc đáo, đưa ra ý tưởng mới và giải quyết vấn đề sáng tạo.', is_active: true, created_at: now, updated_at: now },
      { code: 'COMMUNICATION', name: 'Năng lực giao tiếp', category: 'core', description: 'Khả năng lắng nghe, diễn đạt, thuyết trình và thảo luận hiệu quả.', is_active: true, created_at: now, updated_at: now },
      { code: 'COLLABORATION', name: 'Năng lực hợp tác', category: 'core', description: 'Khả năng làm việc nhóm, chia sẻ và tôn trọng ý kiến khác.', is_active: true, created_at: now, updated_at: now },
      { code: 'PROBLEM_SOLVING', name: 'Năng lực giải quyết vấn đề', category: 'core', description: 'Khả năng phân tích, đánh giá và đưa ra giải pháp cho các tình huống thực tế.', is_active: true, created_at: now, updated_at: now },
      { code: 'MATH_PROFICIENCY', name: 'Năng lực toán học', category: 'subject', description: 'Khả năng tư duy logic, lập luận toán học và áp dụng toán vào thực tiễn.', is_active: true, created_at: now, updated_at: now },
      { code: 'SCIENCE_LITERACY', name: 'Năng lực khoa học', category: 'subject', description: 'Khả năng tìm hiểu, khám phá và giải thích hiện tượng tự nhiên.', is_active: true, created_at: now, updated_at: now },
      { code: 'LANGUAGE_PROFICIENCY', name: 'Năng lực ngôn ngữ', category: 'subject', description: 'Khả năng đọc hiểu, viết, nghe nói tiếng Việt và ngoại ngữ.', is_active: true, created_at: now, updated_at: now },
      { code: 'TECH_COMPETENCY', name: 'Năng lực công nghệ', category: 'subject', description: 'Khả năng sử dụng công nghệ thông tin và tư duy tin học.', is_active: true, created_at: now, updated_at: now },
      { code: 'SOCIAL_COMPETENCY', name: 'Năng lực xã hội', category: 'cross_curricular', description: 'Khả năng thích ứng, ứng xử và tham gia hoạt động cộng đồng.', is_active: true, created_at: now, updated_at: now },
      { code: 'AESTHETIC_COMPETENCY', name: 'Năng lực thẩm mỹ', category: 'cross_curricular', description: 'Khả năng cảm nhận, đánh giá và sáng tạo cái đẹp.', is_active: true, created_at: now, updated_at: now },
      { code: 'PHYSICAL_COMPETENCY', name: 'Năng lực thể chất', category: 'cross_curricular', description: 'Khả năng vận động, rèn luyện sức khỏe và giữ gìn vệ sinh.', is_active: true, created_at: now, updated_at: now },
    ];
    await queryInterface.bulkInsert('competencies', rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('competencies', null, {});
  },
};
