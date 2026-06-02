/**
 * MA TRẬN PHÂN QUYỀN — EduSmart v1.1
 *
 * 4 nhóm vai trò:
 *   - admin    : toàn quyền hệ thống
 *   - teacher  : (homeroom | subject | both) — quyền phụ thuộc scope (class_id / subject_id)
 *   - student  : chỉ xem dữ liệu bản thân
 *   - parent   : chỉ xem dữ liệu CON đã được GVCN liên kết
 *
 * Scope-based check: ngoài kiểm tra role, một số chức năng phải kiểm thêm:
 *   - GVBM:  có dòng trong teacher_assignments(teacher_id, class_id, subject_id, school_year) đang active
 *   - GVCN:  classes.homeroom_teacher_id = teacher.id (lớp đang thao tác)
 *   - PH:    có dòng trong parent_student(parent_id, student_id)
 *   - HS:    student.user_id = req.user.id
 */

const ROLES = Object.freeze({
  ADMIN: 'admin',
  HOMEROOM: 'homeroom',
  SUBJECT: 'subject',
  PARENT: 'parent',
  STUDENT: 'student',
});

// Tập role giáo viên (có thể overlap nhờ teacher_assignments)
const TEACHER_ROLES = [ROLES.HOMEROOM, ROLES.SUBJECT];

// Tập role "read-only" — chỉ xem, không sửa
const READ_ONLY_ROLES = [ROLES.STUDENT, ROLES.PARENT];

/**
 * Bảng ánh xạ permission → role cho phép.
 * Một số permission còn cần scope check ở middleware (vd: homeroom của lớp đó).
 */
const PERMISSIONS = Object.freeze({
  // ===== TÀI KHOẢN =====
  'user.create.any'           : [ROLES.ADMIN],
  'user.create.parent'        : [ROLES.ADMIN, ROLES.HOMEROOM],   // GVCN tạo PH cho HS lớp mình
  'user.create.student'       : [ROLES.ADMIN, ROLES.HOMEROOM],   // GVCN tạo HS vào lớp mình
  'user.update.any'           : [ROLES.ADMIN],
  'user.update.student.in_class' : [ROLES.ADMIN, ROLES.HOMEROOM],
  'user.update.parent.in_class'  : [ROLES.ADMIN, ROLES.HOMEROOM],
  'user.delete.any'           : [ROLES.ADMIN],
  'user.list.any'             : [ROLES.ADMIN],
  'user.toggle_active'        : [ROLES.ADMIN],
  'user.reset_password.any'   : [ROLES.ADMIN],
  'user.reset_password.in_class': [ROLES.ADMIN, ROLES.HOMEROOM],

  // ===== LIÊN KẾT PH ↔ HS =====
  'parent_student.link'       : [ROLES.ADMIN, ROLES.HOMEROOM],
  'parent_student.unlink'     : [ROLES.ADMIN, ROLES.HOMEROOM],
  'parent_student.list'       : [ROLES.ADMIN, ROLES.HOMEROOM],

  // ===== HỒ SƠ HỌC SINH =====
  'student.list.all'          : [ROLES.ADMIN],
  'student.list.class'        : [ROLES.ADMIN, ROLES.HOMEROOM, ROLES.SUBJECT],
  'student.detail.any'        : [ROLES.ADMIN],
  'student.detail.self'       : [ROLES.STUDENT, ROLES.PARENT, ROLES.ADMIN, ROLES.HOMEROOM, ROLES.SUBJECT],
  'student.create'            : [ROLES.ADMIN, ROLES.HOMEROOM],
  'student.update.any'        : [ROLES.ADMIN],
  'student.update.in_class'   : [ROLES.ADMIN, ROLES.HOMEROOM],
  'student.delete'            : [ROLES.ADMIN],

  // ===== DANH MỤC (môn / lớp / khối / năm học / học phí) =====
  'catalog.subject.crud'      : [ROLES.ADMIN],
  'catalog.class.crud'        : [ROLES.ADMIN],
  'catalog.grade_level.crud'  : [ROLES.ADMIN],
  'catalog.school_year.crud'  : [ROLES.ADMIN],
  'catalog.tuition.crud'      : [ROLES.ADMIN],
  'catalog.view'              : [ROLES.ADMIN, ROLES.HOMEROOM, ROLES.SUBJECT, ROLES.PARENT, ROLES.STUDENT],

  // ===== PHÂN CÔNG GIÁO VIÊN =====
  'assignment.crud'           : [ROLES.ADMIN],
  'assignment.list.mine'      : [ROLES.HOMEROOM, ROLES.SUBJECT],

  // ===== ĐIỂM SỐ =====
  'score.enter.subject'       : [ROLES.ADMIN, ROLES.SUBJECT, ROLES.HOMEROOM], // GVBM (qua assignment) hoặc GVCN dạy môn đó
  'score.update.subject'      : [ROLES.ADMIN, ROLES.SUBJECT, ROLES.HOMEROOM],
  'score.view.all_in_class'   : [ROLES.ADMIN, ROLES.HOMEROOM],                // GVCN xem toàn bộ điểm lớp CN
  'score.view.own_subject'    : [ROLES.ADMIN, ROLES.SUBJECT, ROLES.HOMEROOM],  // GVBM xem điểm môn mình
  'score.view.self'           : [ROLES.STUDENT, ROLES.PARENT],                 // PH/HS xem điểm bản thân/con

  // ===== LỊCH HỌC =====
  'schedule.crud'             : [ROLES.ADMIN],
  'schedule.view'             : [ROLES.ADMIN, ROLES.HOMEROOM, ROLES.SUBJECT, ROLES.PARENT, ROLES.STUDENT],

  // ===== ĐIỂM DANH =====
  'attendance.mark'           : [ROLES.ADMIN, ROLES.HOMEROOM],
  'attendance.view'           : [ROLES.ADMIN, ROLES.HOMEROOM, ROLES.PARENT, ROLES.STUDENT],

  // ===== SỔ ĐẦU BÀI (class_journal) =====
  'journal.create'            : [ROLES.ADMIN, ROLES.HOMEROOM, ROLES.SUBJECT], // GVBM ghi tiết môn mình, GVCN ghi tổng
  'journal.update'            : [ROLES.ADMIN, ROLES.HOMEROOM, ROLES.SUBJECT],
  'journal.view.class'        : [ROLES.ADMIN, ROLES.HOMEROOM, ROLES.SUBJECT], // GVBM xem được sổ lớp mình dạy
  'journal.view.self'         : [ROLES.PARENT, ROLES.STUDENT],

  // ===== ĐÁNH GIÁ / NHẬN XÉT =====
  'evaluation.create'         : [ROLES.ADMIN, ROLES.HOMEROOM, ROLES.SUBJECT],
  'evaluation.update'         : [ROLES.ADMIN, ROLES.HOMEROOM, ROLES.SUBJECT],
  'evaluation.delete'         : [ROLES.ADMIN, ROLES.HOMEROOM],
  'evaluation.view.self'      : [ROLES.PARENT, ROLES.STUDENT, ROLES.ADMIN, ROLES.HOMEROOM, ROLES.SUBJECT],

  // ===== HỌC PHÍ =====
  'tuition.set'               : [ROLES.ADMIN],
  'tuition.view.self'         : [ROLES.PARENT, ROLES.STUDENT, ROLES.ADMIN, ROLES.HOMEROOM],

  // ===== THÔNG BÁO =====
  'notification.create'       : [ROLES.ADMIN, ROLES.HOMEROOM],
  'notification.view'         : [ROLES.ADMIN, ROLES.HOMEROOM, ROLES.SUBJECT, ROLES.PARENT, ROLES.STUDENT],

  // ===== BÁO CÁO =====
  'report.school'             : [ROLES.ADMIN],
  'report.class'              : [ROLES.ADMIN, ROLES.HOMEROOM],

  // ===== AI CHATBOT WIDGET =====
  'chat.use'                  : [ROLES.PARENT, ROLES.STUDENT, ROLES.ADMIN, ROLES.SUBJECT, ROLES.HOMEROOM],
  // 5 persona SRS: admin, gvcn/gvbm (subject+scope), parent, student
});

/** Kiểm tra role có permission không (chưa tính scope). */
const can = (role, permission) => {
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(role);
};

module.exports = {
  ROLES,
  TEACHER_ROLES,
  READ_ONLY_ROLES,
  PERMISSIONS,
  can,
};
