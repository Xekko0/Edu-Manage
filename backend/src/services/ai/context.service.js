/**
 * Lớp 2 — Context Injection (0 token).
 *  - role=parent  → query parent_student → lấy child_id
 *  - role=student → user.id chính là student_id (qua bảng students)
 */
const { Student, User } = require('../../models');

const injectContext = async (intentObj, user) => {
  const ctx = { ...intentObj, child_id: null, class_id: null };

  if (user.role === 'parent') {
    const parent = await User.findByPk(user.id, {
      include: [{ model: Student, as: 'children', limit: 1 }],
    });
    const child = parent?.children?.[0];
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
