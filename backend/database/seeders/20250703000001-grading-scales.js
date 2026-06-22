'use strict';

/**
 * Seed grading_scales — Quy đổi điểm thang 10 → chữ → GPA (thang 4.0).
 * Chuẩn quốc tế K-12 + Việt Nam.
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rows = [
      { min_score: 9.0, max_score: 10.0, letter_grade: 'A+', gpa_points: 4.00, description: 'Xuất sắc', is_active: true, created_at: now, updated_at: now },
      { min_score: 8.5, max_score: 8.99, letter_grade: 'A', gpa_points: 4.00, description: 'Giỏi', is_active: true, created_at: now, updated_at: now },
      { min_score: 8.0, max_score: 8.49, letter_grade: 'A-', gpa_points: 3.70, description: 'Giỏi', is_active: true, created_at: now, updated_at: now },
      { min_score: 7.5, max_score: 7.99, letter_grade: 'B+', gpa_points: 3.30, description: 'Khá', is_active: true, created_at: now, updated_at: now },
      { min_score: 7.0, max_score: 7.49, letter_grade: 'B', gpa_points: 3.00, description: 'Khá', is_active: true, created_at: now, updated_at: now },
      { min_score: 6.5, max_score: 6.99, letter_grade: 'B-', gpa_points: 2.70, description: 'Khá', is_active: true, created_at: now, updated_at: now },
      { min_score: 6.0, max_score: 6.49, letter_grade: 'C+', gpa_points: 2.30, description: 'Trung bình', is_active: true, created_at: now, updated_at: now },
      { min_score: 5.5, max_score: 5.99, letter_grade: 'C', gpa_points: 2.00, description: 'Trung bình', is_active: true, created_at: now, updated_at: now },
      { min_score: 5.0, max_score: 5.49, letter_grade: 'C-', gpa_points: 1.70, description: 'Trung bình', is_active: true, created_at: now, updated_at: now },
      { min_score: 4.0, max_score: 4.99, letter_grade: 'D', gpa_points: 1.00, description: 'Yếu', is_active: true, created_at: now, updated_at: now },
      { min_score: 0, max_score: 3.99, letter_grade: 'F', gpa_points: 0.00, description: 'Kém', is_active: true, created_at: now, updated_at: now },
    ];
    await queryInterface.bulkInsert('grading_scales', rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('grading_scales', null, {});
  },
};
