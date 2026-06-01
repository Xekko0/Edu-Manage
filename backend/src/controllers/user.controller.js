/**
 * User controller — quản lý tài khoản hệ thống.
 * Phân quyền:
 *   - Admin       : list/create/update/delete/reset mọi tài khoản (mọi vai trò)
 *   - GVCN        : create tài khoản PH cho HS lớp mình, link/unlink PH↔HS,
 *                   reset mật khẩu PH/HS lớp mình
 *   - Khác        : —
 */
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { User, Student, Class } = require('../models');
const { success, error } = require('../utils/responseHelper');

const list = async (req, res) => {
  try {
    const { role, q, class_id } = req.query;
    const where = {};
    if (role) where.role = role;
    if (q) where[Op.or] = [
      { email: { [Op.like]: `%${q}%` } },
      { full_name: { [Op.like]: `%${q}%` } },
    ];

    let include = [];
    if (class_id) {
      include = [{
        model: Student,
        as: 'children',
        where: { class_id },
        required: role === 'parent',
        include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'email'] }],
      }];
    }

    // Giáo viên chỉ được xem PH/HS của lớp mình chủ nhiệm
    if (req.user.role === 'subject') {
      if (!class_id) return error(res, 'Thiếu class_id', 400);

      const cls = await Class.findByPk(class_id, { attributes: ['id', 'homeroom_teacher_id'] });
      if (!cls) return error(res, 'Không tìm thấy lớp', 404);
      const isHomeroom = Number(cls.homeroom_teacher_id) === Number(req.user.id);
      // #region agent log
      fetch('http://127.0.0.1:7598/ingest/50d32c58-c803-483c-84ed-d5e16a0a5512',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c24510'},body:JSON.stringify({sessionId:'c24510',location:'user.controller.js:list',message:'teacher list users',data:{class_id,userId:req.user.id,homeroomTeacherId:cls.homeroom_teacher_id,isHomeroom,role},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      if (!isHomeroom) {
        return error(res, 'Bạn chỉ được xem tài khoản PH/HS của lớp mình chủ nhiệm', 403);
      }

      // Giới hạn role được list
      if (role && !['parent', 'student'].includes(role)) {
        return error(res, 'Giáo viên chỉ được xem role=parent hoặc role=student', 403);
      }
      if (!role) where.role = 'parent'; // mặc định: xem phụ huynh

      // Bắt buộc join children theo class_id để đảm bảo đúng lớp
      if (!include.length) {
        include = [{
          model: Student,
          as: 'children',
          where: { class_id },
          required: true,
          include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'email'] }],
        }];
      } else {
        include[0].required = true;
      }
    }

    const users = await User.findAll({
      where,
      include,
      attributes: { exclude: ['password'] },
      order: [['id', 'DESC']],
    });
    return success(res, users);
  } catch (err) {
    return error(res, 'Lỗi tải danh sách tài khoản', 500, err.message);
  }
};

const create = async (req, res) => {
  try {
    const { email, password, full_name, role, phone } = req.body;
    if (!email || !password || !full_name || !role) {
      return error(res, 'Thiếu trường bắt buộc', 400);
    }
    // Admin tạo bất kỳ role; controller riêng `createParent` dành cho GVCN.
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, full_name, role, phone });
    return success(res, { id: user.id }, 'Tạo tài khoản thành công', 201);
  } catch (err) {
    return error(res, 'Tạo tài khoản thất bại', 400, err.message);
  }
};

/**
 * GVCN tạo tài khoản PHỤ HUYNH cho 1 HS trong lớp mình chủ nhiệm + liên kết luôn.
 * Body: { email, password, full_name, phone, student_id }
 */
const createParentForStudent = async (req, res) => {
  try {
    const { email, password, full_name, phone, student_id } = req.body;
    if (!email || !password || !full_name || !student_id) {
      return error(res, 'Thiếu trường bắt buộc: email, password, full_name, student_id', 400);
    }

    const student = await Student.findByPk(student_id);
    if (!student) return error(res, 'Không tìm thấy học sinh', 404);

    // Giáo viên: kiểm tra lớp mình chủ nhiệm
    if (req.user.role === 'subject') {
      const cls = await Class.findByPk(student.class_id);
      if (!cls || cls.homeroom_teacher_id !== req.user.id) {
        return error(res, 'Bạn chỉ được tạo PH cho HS lớp mình chủ nhiệm', 403);
      }
    }

    const hashed = await bcrypt.hash(password, 10);
    const parent = await User.create({ email, password: hashed, full_name, phone, role: 'parent' });
    await parent.addChild(student);

    return success(res, { parent_id: parent.id }, 'Tạo và liên kết phụ huynh thành công', 201);
  } catch (err) {
    return error(res, 'Tạo phụ huynh thất bại', 400, err.message);
  }
};

const assertHomeroomParent = async (teacherId, parentUser) => {
  const parent = await User.findByPk(parentUser.id, {
    include: [{ model: Student, as: 'children' }],
  });
  for (const child of parent?.children || []) {
    const cls = await Class.findByPk(child.class_id);
    if (cls && cls.homeroom_teacher_id === teacherId) return true;
  }
  return false;
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const target = await User.findByPk(id);
    if (!target) return error(res, 'Không tìm thấy tài khoản', 404);

    const patch = { ...req.body };

    if (req.user.role === 'subject') {
      if (target.role !== 'parent') {
        return error(res, 'Giáo viên chỉ được sửa tài khoản phụ huynh lớp mình', 403);
      }
      const ok = await assertHomeroomParent(req.user.id, target);
      if (!ok) return error(res, 'Bạn chỉ được sửa PH của lớp mình chủ nhiệm', 403);
      const allowed = ['full_name', 'phone', 'password'];
      Object.keys(patch).forEach((k) => {
        if (!allowed.includes(k)) delete patch[k];
      });
    }

    if (patch.password) patch.password = await bcrypt.hash(patch.password, 10);
    const [affected] = await User.update(patch, { where: { id } });
    return success(res, { affected });
  } catch (err) {
    return error(res, 'Cập nhật thất bại', 400, err.message);
  }
};

const toggleActive = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return error(res, 'Không tìm thấy tài khoản', 404);
    user.is_active = !user.is_active;
    await user.save();
    return success(res, { is_active: user.is_active });
  } catch (err) {
    return error(res, 'Lỗi thao tác', 500, err.message);
  }
};

const remove = async (req, res) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    return success(res, {}, 'Đã xóa tài khoản');
  } catch (err) {
    return error(res, 'Xóa thất bại', 400, err.message);
  }
};

/** Liên kết PH ↔ HS (Admin hoặc GVCN của lớp HS đó). */
const linkParentChild = async (req, res) => {
  try {
    const { parent_id, student_id } = req.body;
    const parent = await User.findByPk(parent_id);
    const student = await Student.findByPk(student_id);
    if (!parent || !student) return error(res, 'Không tìm thấy phụ huynh hoặc học sinh', 404);
    if (parent.role !== 'parent') return error(res, 'Tài khoản đích phải là role=parent', 400);

    // Giáo viên: kiểm tra lớp
    if (req.user.role === 'subject') {
      const cls = await Class.findByPk(student.class_id);
      if (!cls || cls.homeroom_teacher_id !== req.user.id) {
        return error(res, 'Bạn chỉ được liên kết PH cho HS lớp mình', 403);
      }
    }

    await parent.addChild(student);
    return success(res, {}, 'Liên kết phụ huynh — học sinh thành công');
  } catch (err) {
    return error(res, 'Liên kết thất bại', 400, err.message);
  }
};

const unlinkParentChild = async (req, res) => {
  try {
    const { parent_id, student_id } = req.body;
    const parent = await User.findByPk(parent_id);
    const student = await Student.findByPk(student_id);
    if (!parent || !student) return error(res, 'Không tìm thấy phụ huynh hoặc học sinh', 404);

    if (req.user.role === 'subject') {
      const cls = await Class.findByPk(student.class_id);
      if (!cls || cls.homeroom_teacher_id !== req.user.id) {
        return error(res, 'Bạn chỉ được gỡ liên kết PH cho HS lớp mình', 403);
      }
    }

    await parent.removeChild(student);
    return success(res, {}, 'Gỡ liên kết thành công');
  } catch (err) {
    return error(res, 'Gỡ liên kết thất bại', 400, err.message);
  }
};

/** Reset mật khẩu (Admin: bất kỳ; GVCN: PH/HS lớp mình). */
const resetPassword = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return error(res, 'Không tìm thấy tài khoản', 404);

    if (req.user.role === 'subject') {
      // chỉ cho phép reset HS/PH trong lớp mình
      let inMyClass = false;
      if (user.role === 'student') {
        const student = await Student.findOne({ where: { user_id: user.id } });
        const cls = student && await Class.findByPk(student.class_id);
        inMyClass = cls && cls.homeroom_teacher_id === req.user.id;
      } else if (user.role === 'parent') {
        const parent = await User.findByPk(user.id, { include: [{ model: Student, as: 'children' }] });
        for (const c of (parent.children || [])) {
          const cls = await Class.findByPk(c.class_id);
          if (cls && cls.homeroom_teacher_id === req.user.id) { inMyClass = true; break; }
        }
      }
      if (!inMyClass) return error(res, 'Bạn chỉ được reset PH/HS lớp mình', 403);
    }

    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return error(res, 'Mật khẩu mới tối thiểu 6 ký tự', 400);
    }
    const hashed = await bcrypt.hash(new_password, 10);
    await user.update({ password: hashed, failed_login_count: 0, locked_until: null });
    return success(res, {}, 'Reset mật khẩu thành công');
  } catch (err) {
    return error(res, 'Reset mật khẩu thất bại', 500, err.message);
  }
};

const importCSV = async (_req, res) =>
  success(res, {}, 'Đã nhận file. Chức năng import CSV sẽ xử lý ở Tuần 3-4');

module.exports = {
  list,
  create,
  createParentForStudent,
  update,
  toggleActive,
  remove,
  linkParentChild,
  unlinkParentChild,
  resetPassword,
  importCSV,
};
