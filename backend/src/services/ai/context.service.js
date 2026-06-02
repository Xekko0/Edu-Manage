/**
 * Lớp 2 — Context Injection (0 token).
 *  - role=parent  → child_id (body student_id hoặc con đầu tiên)
 *  - role=student → student của user
 */
const { Student, User } = require('../../models');

const resolveChildForParent = async (parentUserId, requestedStudentId) => {
  const parent = await User.findByPk(parentUserId, {
    include: [{ model: Student, as: 'children' }],
  });
  const children = parent?.children || [];
  if (!children.length) return null;

  if (requestedStudentId) {
    const match = children.find((c) => c.id === Number(requestedStudentId));
    return match || children[0];
  }
  return children[0];
};

const injectContext = async (intentObj, user, options = {}) => {
  const ctx = { ...intentObj, child_id: null, class_id: null };
  const requestedStudentId = options.student_id
    ? Number(options.student_id)
    : null;

  if (user.role === 'parent') {
    const child = await resolveChildForParent(user.id, requestedStudentId);
    if (child) {
      ctx.child_id = child.id;
      ctx.class_id = child.class_id;
    }
  } else if (user.role === 'student') {
    const student = await Student.findOne({ where: { user_id: user.id } });
    if (student) {
      ctx.child_id = student.id;
      ctx.class_id = student.class_id;
    }
  }

  return ctx;
};

module.exports = { injectContext };
