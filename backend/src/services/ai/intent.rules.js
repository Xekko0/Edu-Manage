/**
 * Nhận diện ý định theo từ khóa (0 token).
 */
const SUBJECTS = [
  { name: 'Toán', keys: ['toan', 'toán'] },
  { name: 'Vật lý', keys: ['vat ly', 'vật lý', 'vat li'] },
  { name: 'Hóa học', keys: ['hoa hoc', 'hóa học', 'hoa'] },
  { name: 'Sinh học', keys: ['sinh hoc', 'sinh học'] },
  { name: 'Ngữ văn', keys: ['ngu van', 'ngữ văn', 'van hoc'] },
  { name: 'Lịch sử', keys: ['lich su', 'lịch sử'] },
  { name: 'Địa lý', keys: ['dia ly', 'địa lý'] },
  { name: 'Giáo dục công dân', keys: ['gdcd', 'cong dan', 'công dân'] },
  { name: 'Tiếng Anh', keys: ['tieng anh', 'tiếng anh', 'anh van'] },
  { name: 'Tin học', keys: ['tin hoc', 'tin học'] },
  { name: 'Thể dục', keys: ['the duc', 'thể dục'] },
  { name: 'Công nghệ', keys: ['cong nghe', 'công nghệ'] },
];

const normalize = (text) =>
  (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/ð/g, 'd');

const extractSubject = (normalized) => {
  for (const s of SUBJECTS) {
    if (s.keys.some((k) => normalized.includes(normalize(k)))) {
      return s.name;
    }
  }
  return null;
};

const extractSemester = (normalized) => {
  if (/hoc ky\s*2|hk\s*2|học kỳ\s*2/.test(normalized)) return 2;
  if (/hoc ky\s*1|hk\s*1|học kỳ\s*1/.test(normalized)) return 1;
  return null;
};

const detectIntentByRules = (message) => {
  const n = normalize(message);

  if (/học phí|hoc phi|đóng tiền|dong tien|nộp tiền|nop tien|tiền học|tien hoc/.test(n)) {
    return { intent: 'view_tuition', subject: null, semester: extractSemester(n), week: null, source: 'rules' };
  }

  if (/nhận xét|nhan xet|đánh giá|danh gia|hạnh kiểm|hanh kiem|nhận xét của gv/.test(n)) {
    return { intent: 'view_evaluations', subject: extractSubject(n), semester: extractSemester(n), week: null, source: 'rules' };
  }

  if (/thông báo|thong bao|tin nhắn trường|tin tức/.test(n)) {
    return { intent: 'view_notifications', subject: null, semester: null, week: null, source: 'rules' };
  }

  if (/gợi ý|goi y|tư vấn|tu van|ôn tập|on tap|cải thiện|cai thien|học thế nào|hoc the nao|làm sao để|lam sao de|nên học|nen hoc/.test(n)) {
    return { intent: 'ai_advice', subject: extractSubject(n), semester: extractSemester(n), week: null, source: 'rules' };
  }

  if (/điểm|diem|học bạ|hoc ba|bảng điểm|bang diem|điểm số|diem so|môn nào cao|mon nao cao|môn nào thấp/.test(n)) {
    const subject = extractSubject(n);
    return {
      intent: subject ? 'view_scores_subject' : 'view_scores',
      subject,
      semester: extractSemester(n),
      week: null,
      source: 'rules',
    };
  }

  if (/lịch học|lich hoc|thời khóa biểu|thoi khoa bieu|\btkb\b|xem tkb|tiết học|tiet hoc|tuần này|tuan nay|hôm nay học|hôm nay học gì|hom nay hoc|hom nay con hoc|hoc mon gi hom nay|cho xem.*lich|xem.*tkb|doc tkb/.test(n)) {
    return { intent: 'view_schedule', subject: null, semester: null, week: null, source: 'rules' };
  }

  if (/vắng|vang|điểm danh|diem danh|nghỉ học|nghi hoc|có đi học|nghỉ phép/.test(n)) {
    return { intent: 'view_attendance', subject: null, semester: null, week: null, source: 'rules' };
  }

  if (/ngoại khóa|ngoai khoa|hoạt động|hoat dong|câu lạc bộ|cau lac bo|đăng ký hoạt/.test(n)) {
    return { intent: 'view_extracurricular', subject: null, semester: null, week: null, source: 'rules' };
  }

  if (/so sánh|so sanh|môn nào cao|môn nào thấp|mon nao tot|mon nao kem/.test(n)) {
    return { intent: 'compare_subjects', subject: extractSubject(n), semester: extractSemester(n), week: null, source: 'rules' };
  }

  if (/học bạ|hoc ba|gradebook|xem học bạ/.test(n)) {
    return { intent: 'view_gradebook', subject: null, semester: extractSemester(n), week: null, source: 'rules' };
  }

  if (/liên hệ giáo viên|lien he giao vien|gặp gvcn|gap gvcn|gặp thầy|gap thay/.test(n)) {
    return { intent: 'contact_teacher', subject: null, semester: null, week: null, source: 'rules' };
  }

  if (/tóm tắt|tom tat|tổng quan|tong quan|xin chào|chao ban|giúp tôi|giup toi|tại sao|tai sao|bao nhiêu|bao nhieu/.test(n)) {
    return { intent: 'general_chat', subject: extractSubject(n), semester: extractSemester(n), week: null, source: 'rules' };
  }

  return { intent: 'general_chat', subject: null, semester: null, week: null, source: 'rules' };
};

module.exports = { detectIntentByRules, extractSubject };
