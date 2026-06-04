/**
 * Lớp truy cập tập trung — dùng chung middleware, controller, AI tools.
 */
const {
  isHomeroomOfClass,
  hasAssignment,
  canAccessClass,
  schoolYear,
} = require('./teacher-capabilities.service');
const { User, Student } = require('../../models');

class AccessDeniedError extends Error {
  constructor(message = 'Không có quyền truy cập') {
    super(message);
    this.name = 'AccessDeniedError';
    this.statusCode = 403;
  }
}

const assertHomeroom = async (userId, classId, userRole) => {
  const ok = await isHomeroomOfClass(userId, classId, userRole);
  if (!ok) throw new AccessDeniedError('Chỉ giáo viên chủ nhiệm lớp này mới được thao tác');
  return true;
};

const assertAssignment = async (userId, classId, subjectId, userRole) => {
  const ok = await hasAssignment(userId, classId, subjectId, userRole);
  if (!ok) throw new AccessDeniedError('Bạn chưa được phân công dạy môn/lớp này');
  return true;
};

const assertClassView = async (userId, classId, userRole) => {
  const access = await canAccessClass(userId, classId, userRole);
  if (!access.ok) throw new AccessDeniedError('Bạn không có quyền xem dữ liệu lớp này');
  return access;
};

/** PH ↔ HS — trả về true nếu được phép (không throw cho GV/admin). */
const assertParentLink = async (user, studentId) => {
  const role = user.role;
  if (['admin', 'homeroom', 'subject'].includes(role)) return true;

  const sid = parseInt(studentId, 10);
  if (!sid) throw new AccessDeniedError('Thiếu student_id');

  if (role === 'student') {
    const own = await Student.findOne({ where: { user_id: user.id } });
    if (!own || own.id !== sid) {
      throw new AccessDeniedError('Bạn chỉ được xem dữ liệu của bản thân');
    }
    return true;
  }

  if (role === 'parent') {
    const parent = await User.findByPk(user.id, {
      include: [{ model: Student, as: 'children', where: { id: sid }, required: false }],
    });
    const linked = (parent?.children || []).some((c) => c.id === sid);
    if (!linked) {
      throw new AccessDeniedError('Bạn chỉ được xem dữ liệu của con đã được liên kết');
    }
    return true;
  }

  throw new AccessDeniedError('Không xác định được quyền truy cập');
};

module.exports = {
  AccessDeniedError,
  assertHomeroom,
  assertAssignment,
  assertClassView,
  assertParentLink,
  schoolYear,
};
