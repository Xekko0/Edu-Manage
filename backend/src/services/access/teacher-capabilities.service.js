/**
 * Ngữ cảnh giáo viên / admin — single source cho /auth/me và AI staff context.
 */
const env = require('../../config/env');
const {
  Class, TeacherAssignment, Subject,
} = require('../../models');

const schoolYear = () => env.CURRENT_SCHOOL_YEAR;

const loadTeacherScope = async (userId) => {
  const homeroomClasses = await Class.findAll({
    where: { homeroom_teacher_id: userId, is_active: true },
    attributes: ['id', 'name', 'grade_level', 'school_year', 'homeroom_teacher_id'],
  });

  const assignments = await TeacherAssignment.findAll({
    where: { teacher_id: userId, school_year: schoolYear(), is_active: true },
    include: [
      { model: Class, as: 'class', attributes: ['id', 'name', 'grade_level'] },
      { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
    ],
  });

  const classMap = new Map();
  homeroomClasses.forEach((c) => classMap.set(c.id, c));
  assignments.forEach((a) => {
    if (a.class) classMap.set(a.class.id, a.class);
  });

  const homeroomClass = homeroomClasses[0] || null;

  return {
    school_year: schoolYear(),
    is_homeroom: homeroomClasses.length > 0,
    homeroom_class_id: homeroomClass?.id || null,
    homeroom_class: homeroomClass,
    homeroom_classes: homeroomClasses,
    assignments: assignments.map((a) => ({
      id: a.id,
      class_id: a.class_id,
      class_name: a.class?.name,
      subject_id: a.subject_id,
      subject_name: a.subject?.name,
      subject_code: a.subject?.code,
    })),
    accessible_classes: [...classMap.values()],
    allowed_class_ids: [...classMap.keys()],
    persona: homeroomClasses.length > 0 ? 'gvcn' : 'gvbm',
  };
};

const loadAdminCapabilities = async () => {
  const classes = await Class.findAll({
    where: { is_active: true },
    attributes: ['id', 'name', 'grade_level', 'school_year'],
    order: [['grade_level', 'ASC'], ['name', 'ASC']],
  });
  return {
    school_year: schoolYear(),
    is_homeroom: false,
    homeroom_class_id: null,
    homeroom_class: null,
    homeroom_classes: [],
    assignments: [],
    accessible_classes: classes,
    allowed_class_ids: classes.map((c) => c.id),
    persona: 'admin',
  };
};

const resolveCapabilities = async (user) => {
  if (user.role === 'admin') return loadAdminCapabilities();
  if (user.role === 'subject' || user.role === 'homeroom') {
    return loadTeacherScope(user.id);
  }
  return null;
};

const isHomeroomOfClass = async (userId, classId, userRole) => {
  if (userRole === 'admin') return true;
  const cls = await Class.findByPk(classId, { attributes: ['homeroom_teacher_id'] });
  return cls && Number(cls.homeroom_teacher_id) === Number(userId);
};

const hasAssignment = async (userId, classId, subjectId, userRole) => {
  if (userRole === 'admin') return true;
  if (!classId || !subjectId) return false;
  const row = await TeacherAssignment.findOne({
    where: {
      teacher_id: userId,
      class_id: classId,
      subject_id: subjectId,
      school_year: schoolYear(),
      is_active: true,
    },
  });
  return !!row;
};

const canAccessClass = async (userId, classId, userRole) => {
  if (userRole === 'admin') return { ok: true, isHomeroom: true, subjectIds: null };
  const isHr = await isHomeroomOfClass(userId, classId, userRole);
  if (isHr) return { ok: true, isHomeroom: true, subjectIds: null };

  const assignments = await TeacherAssignment.findAll({
    where: { teacher_id: userId, class_id: classId, is_active: true },
    attributes: ['subject_id'],
  });
  if (!assignments.length) return { ok: false, isHomeroom: false, subjectIds: [] };
  return {
    ok: true,
    isHomeroom: false,
    subjectIds: assignments.map((a) => a.subject_id),
  };
};

module.exports = {
  resolveCapabilities,
  loadTeacherScope,
  loadAdminCapabilities,
  isHomeroomOfClass,
  hasAssignment,
  canAccessClass,
  schoolYear,
};
