/**
 * Context cho AI — Admin / Giáo viên (subject + GVCN nếu có).
 */
const env = require('../../config/env');
const {
  Class, Student, User, TeacherAssignment, Subject,
} = require('../../models');
const { getStaffCapabilities } = require('./staff-capabilities');

const schoolYear = () => env.CURRENT_SCHOOL_YEAR;

const parseClassHint = (text, allClasses) => {
  if (!text || !allClasses?.length) return null;
  const n = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const hit = allClasses.find((c) => {
    const name = (c.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return name && n.includes(name);
  });
  return hit?.id || null;
};

const loadTeacherScope = async (userId) => {
  const homeroomClasses = await Class.findAll({
    where: { homeroom_teacher_id: userId, is_active: true },
    attributes: ['id', 'name', 'grade_level', 'school_year'],
  });

  const assignments = await TeacherAssignment.findAll({
    where: { teacher_id: userId, school_year: schoolYear(), is_active: true },
    include: [
      { model: Class, as: 'class', attributes: ['id', 'name', 'grade_level'] },
      { model: Subject, as: 'subject', attributes: ['id', 'name'] },
    ],
  });

  const classMap = new Map();
  homeroomClasses.forEach((c) => classMap.set(c.id, c));
  assignments.forEach((a) => {
    if (a.class) classMap.set(a.class.id, a.class);
  });

  return {
    is_homeroom: homeroomClasses.length > 0,
    homeroom_classes: homeroomClasses,
    assignments: assignments.map((a) => ({
      class_id: a.class_id,
      class_name: a.class?.name,
      subject_id: a.subject_id,
      subject_name: a.subject?.name,
    })),
    accessible_classes: [...classMap.values()],
    allowed_class_ids: [...classMap.keys()],
  };
};

const loadAdminScope = async () => {
  const classes = await Class.findAll({
    where: { is_active: true },
    attributes: ['id', 'name', 'grade_level', 'school_year'],
    order: [['grade_level', 'ASC'], ['name', 'ASC']],
  });
  return {
    is_homeroom: false,
    homeroom_classes: [],
    assignments: [],
    accessible_classes: classes,
    allowed_class_ids: classes.map((c) => c.id),
  };
};

const injectStaffContext = async (intentObj, user, options = {}) => {
  const scope = user.role === 'admin'
    ? await loadAdminScope()
    : await loadTeacherScope(user.id);

  let active_class_id = options.class_id ? Number(options.class_id) : null;
  if (active_class_id && !scope.allowed_class_ids.includes(active_class_id)) {
    active_class_id = null;
  }
  if (!active_class_id && intentObj?.class_hint) {
    active_class_id = parseClassHint(intentObj.class_hint, scope.accessible_classes);
  }
  if (!active_class_id && options.userMessage) {
    active_class_id = parseClassHint(options.userMessage, scope.accessible_classes);
  }
  if (!active_class_id && scope.homeroom_classes[0]) {
    active_class_id = scope.homeroom_classes[0].id;
  }
  if (!active_class_id && scope.accessible_classes[0]) {
    active_class_id = scope.accessible_classes[0].id;
  }

  const persona = options.persona
    || (user.role === 'admin' ? 'admin' : scope.is_homeroom ? 'gvcn' : 'gvbm');
  const caps = getStaffCapabilities(user.role, { persona, isHomeroom: scope.is_homeroom });

  return {
    ...intentObj,
    persona,
    user_id: user.id,
    user_role: user.role,
    user_name: user.full_name,
    school_year: schoolYear(),
    active_class_id,
    target_student_id: options.student_id ? Number(options.student_id) : null,
    ...scope,
    capabilities: caps,
  };
};

const assertClassAccess = (ctx, classId) => {
  if (ctx.user_role === 'admin') return true;
  return ctx.allowed_class_ids.includes(Number(classId));
};

module.exports = { injectStaffContext, assertClassAccess, loadTeacherScope, loadAdminScope };
