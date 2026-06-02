/**
 * Intent GV/Admin — nhận diện từ khóa.
 */
const normalize = (text) =>
  (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/ð/g, 'd');

const detectStaffIntentByRules = (message, userRole, persona) => {
  const n = normalize(message);

  if (/quyền|quyen|chức năng|chuc nang|làm được gì|lam duoc gi|menu|hướng dẫn sử dụng|toi co the/.test(n)) {
    return { intent: 'help_features', source: 'rules' };
  }

  if (/liên kết ph|lien ket ph|phụ huynh|phu huynh/.test(n) && /liên kết|lien ket|gắn|gan/.test(n)) {
    return { intent: 'link_parent_guide', source: 'rules' };
  }

  if (/cách nhập điểm|cach nhap diem|nhập điểm thế nào/.test(n)) {
    return { intent: 'how_to', topic: 'score_entry', source: 'rules' };
  }
  if (/cách điểm danh|cach diem danh|điểm danh thế nào/.test(n)) {
    return { intent: 'how_to', topic: 'attendance', source: 'rules' };
  }
  if (/phân công|phan cong|gán giáo viên/.test(n)) {
    return { intent: 'how_to', topic: 'assignment', source: 'rules' };
  }
  if (/thêm học sinh|them hoc sinh|tạo học sinh|tao hoc sinh/.test(n)) {
    return { intent: 'create_student_guide', source: 'rules' };
  }

  if (userRole === 'admin' && /thống kê|thong ke|toàn trường|toan truong|bao nhiêu học sinh/.test(n)) {
    return { intent: 'admin_stats', source: 'rules' };
  }

  if (/báo cáo lớp|bao cao lop|tóm tắt lớp|tom tat lop|tổng kết lớp/.test(n)) {
    return { intent: 'class_report_summary', semester: /hk\s*2|học kỳ\s*2/.test(n) ? 2 : 1, source: 'rules' };
  }

  if (/học sinh yếu|hoc sinh yeu|em nào yếu|em nao yeu|điểm thấp|diem thap/.test(n)) {
    return { intent: 'weak_students_in_class', semester: /hk\s*2/.test(n) ? 2 : 1, source: 'rules' };
  }

  if (/điểm môn tôi|diem mon toi|môn tôi dạy|mon toi day/.test(n)) {
    return { intent: 'my_subject_scores', source: 'rules' };
  }

  if (/lớp nào|lop nao|lớp tôi dạy|danh sách lớp/.test(n)) {
    return { intent: 'list_classes', source: 'rules' };
  }

  if (/danh sách học sinh|danh sach hoc sinh|hs lớp|bao nhiêu em/.test(n)) {
    return { intent: 'list_students', source: 'rules' };
  }

  if (/tìm học sinh|tim hoc sinh|tìm hs/.test(n)) {
    return { intent: 'search_student', source: 'rules' };
  }

  if (/điểm lớp|diem lop|xếp hạng|xep hang|trung binh lop/.test(n)) {
    return { intent: 'view_class_scores', semester: /hk\s*2/.test(n) ? 2 : 1, source: 'rules' };
  }

  if (/vắng|vang|điểm danh|diem danh|chuyên cần/.test(n)) {
    return { intent: 'view_class_attendance', source: 'rules' };
  }

  if (/lịch học|lich hoc|thời khóa biểu|thoi khoa bieu|\btkb\b|xem tkb|tiết học|tiet hoc/.test(n)) {
    return { intent: 'view_class_schedule', source: 'rules' };
  }

  if (/phân công của tôi|phan cong cua toi|tôi dạy môn gì/.test(n)) {
    return { intent: 'my_assignments', source: 'rules' };
  }

  if (/tóm tắt|tom tat|so sánh|so sanh|giải thích|xin chào|chao/.test(n)) {
    return { intent: 'general_chat', source: 'rules' };
  }

  return { intent: 'general_chat', source: 'rules' };
};

module.exports = { detectStaffIntentByRules };
