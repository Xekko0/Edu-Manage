/**
 * Context cho AI — Admin / Giáo viên (dùng teacher-capabilities.service).
 */
const { getStaffCapabilities } = require('./staff-capabilities');
const {
  resolveCapabilities,
  schoolYear,
} = require('../access/teacher-capabilities.service');

const parseClassHint = (text, allClasses) => {
  if (!text || !allClasses?.length) return null;
  const n = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const hit = allClasses.find((c) => {
    const name = (c.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return name && n.includes(name);
  });
  return hit?.id || null;
};

const injectStaffContext = async (intentObj, user, options = {}) => {
  const scope = await resolveCapabilities(user);
  if (!scope) {
    throw Object.assign(new Error('Vai trò không hỗ trợ staff context'), { statusCode: 403 });
  }

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
  if (!active_class_id && scope.homeroom_class_id) {
    active_class_id = scope.homeroom_class_id;
  }
  if (!active_class_id && scope.accessible_classes[0]) {
    active_class_id = scope.accessible_classes[0].id;
  }

  const persona = options.persona || scope.persona;
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
    is_homeroom: scope.is_homeroom,
    homeroom_classes: scope.homeroom_classes,
    assignments: scope.assignments,
    accessible_classes: scope.accessible_classes,
    allowed_class_ids: scope.allowed_class_ids,
    capabilities: caps,
  };
};

const assertClassAccess = (ctx, classId) => {
  if (ctx.user_role === 'admin') return true;
  return ctx.allowed_class_ids.includes(Number(classId));
};

module.exports = {
  injectStaffContext,
  assertClassAccess,
};
