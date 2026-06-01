/**
 * Student controller — quản lý hồ sơ học sinh.
 * Phân quyền:
 *   - Admin       : list tất cả, CRUD bất kỳ
 *   - GVCN        : list/CRUD trong phạm vi lớp chủ nhiệm
 *   - GVBM        : list (read-only) các lớp được phân công dạy
 *   - HS / PH     : chỉ xem bản thân / con đã liên kết
 */
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { Student, User, Class, TeacherAssignment } = require('../models');
const { success, error } = require('../utils/responseHelper');

const CURRENT_YEAR = () => new Date().getFullYear();
// Quy ước tối thiểu: lớp 1 ≥ 6 tuổi ⇒ lớp g ≥ g + 5 tuổi.
const MIN_AGE_OFFSET = 5;

const toBirthYear = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const d = new Date(dateOfBirth);
  if (Number.isNaN(d.getTime())) return null;
  return d.getFullYear();
};

const validateEnrollmentRules = async ({ class_id, enrollment_year, date_of_birth }) => {
  const currentYear = CURRENT_YEAR();

  const ey = enrollment_year !== undefined && enrollment_year !== null
    ? parseInt(enrollment_year, 10)
    : null;
  if (!ey || Number.isNaN(ey)) {
    return { ok: false, status: 400, message: 'Năm nhập học không hợp lệ' };
  }
  if (ey !== currentYear) {
    return { ok: false, status: 400, message: `Năm nhập học phải bằng năm hiện tại (${currentYear})` };
  }

  const cls = await Class.findByPk(class_id, { attributes: ['id', 'grade_level'] });
  if (!cls) return { ok: false, status: 400, message: 'Lớp không tồn tại' };

  const birthYear = toBirthYear(date_of_birth);
  if (!birthYear) {
    return { ok: false, status: 400, message: 'Ngày sinh bắt buộc và phải hợp lệ' };
  }

  const age = currentYear - birthYear;
  const minAge = cls.grade_level + MIN_AGE_OFFSET;
  if (age < minAge) {
    return {
      ok: false,
      status: 400,
      message: `Tuổi vào lớp ${cls.grade_level} tối thiểu là ${minAge} (hiện tại: ${age})`,
    };
  }

  return { ok: true };
};

/** Trả về list class_id mà giáo viên đang user truy cập có quyền xem. */
const getAccessibleClassIds = async (user) => {
  if (user.role === 'admin') return null; // null = all
  const ids = new Set();
  // Giáo viên (role=subject) vẫn có thể là GVCN nếu được gán trong classes.homeroom_teacher_id
  if (user.role === 'subject') {
    const cls = await Class.findAll({ where: { homeroom_teacher_id: user.id }, attributes: ['id'] });
    cls.forEach((c) => ids.add(c.id));
  }
  // Cả GVCN và GVBM đều có thể có assignment
  const assignments = await TeacherAssignment.findAll({
    where: { teacher_id: user.id, is_active: true },
    attributes: ['class_id'],
  });
  assignments.forEach((a) => ids.add(a.class_id));
  return Array.from(ids);
};

const list = async (req, res) => {
  try {
    const { class_id, q } = req.query;
    const accessible = await getAccessibleClassIds(req.user);

    const where = {};
    if (class_id) where.class_id = class_id;

    if (accessible !== null) {
      // không phải admin → giới hạn theo accessible
      if (accessible.length === 0) return success(res, []);
      where.class_id = where.class_id
        ? (accessible.includes(parseInt(where.class_id, 10)) ? where.class_id : 0)
        : { [Op.in]: accessible };
    }

    const userWhere = {};
    if (q && req.user.role === 'admin') {
      userWhere[Op.or] = [
        { full_name: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
      ];
    }

    const students = await Student.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: { exclude: ['password'] },
          where: Object.keys(userWhere).length ? userWhere : undefined,
          required: !!Object.keys(userWhere).length,
        },
        { model: Class, as: 'class' },
      ],
      order: [['student_code', 'ASC']],
    });
    return success(res, students);
  } catch (err) {
    return error(res, 'Lỗi tải danh sách học sinh', 500, err.message);
  }
};

const detail = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] } },
        { model: Class, as: 'class' },
        { model: User, as: 'parents', attributes: { exclude: ['password'] } },
      ],
    });
    if (!student) return error(res, 'Không tìm thấy học sinh', 404);

    // HS chỉ xem bản thân
    if (req.user.role === 'student' && student.user_id !== req.user.id) {
      return error(res, 'Bạn chỉ được xem hồ sơ của bản thân', 403);
    }
    // PH chỉ xem con đã liên kết
    if (req.user.role === 'parent') {
      const linked = (student.parents || []).some((p) => p.id === req.user.id);
      if (!linked) return error(res, 'Bạn chỉ được xem hồ sơ con đã liên kết', 403);
    }
    // GV chỉ xem trong phạm vi lớp mình
    if (['homeroom', 'subject'].includes(req.user.role)) {
      const accessible = await getAccessibleClassIds(req.user);
      if (!accessible.includes(student.class_id)) {
        return error(res, 'Bạn không có quyền xem hồ sơ học sinh này', 403);
      }
    }

    return success(res, student);
  } catch (err) {
    return error(res, 'Lỗi tải hồ sơ', 500, err.message);
  }
};

/**
 * Tạo HS mới (Admin hoặc GVCN — GVCN chỉ tạo vào lớp mình chủ nhiệm).
 * Body: { email, password, full_name, student_code, class_id, date_of_birth, gender, address, enrollment_year }
 * Tạo đồng thời: 1 record users (role=student) + 1 record students.
 */
const create = async (req, res) => {
  try {
    const {
      email, password, full_name,
      student_code, class_id, date_of_birth, gender, address, enrollment_year,
    } = req.body;

    if (!email || !password || !full_name || !student_code || !class_id) {
      return error(res, 'Thiếu trường bắt buộc: email, password, full_name, student_code, class_id', 400);
    }

    // Nếu là giáo viên: chỉ được tạo HS vào lớp mình chủ nhiệm
    if (req.user.role === 'subject') {
      const cls = await Class.findByPk(class_id);
      if (!cls || cls.homeroom_teacher_id !== req.user.id) {
        return error(res, 'Bạn chỉ được tạo HS vào lớp mình chủ nhiệm', 403);
      }
    }

    // Rule năm nhập học + tuổi tối thiểu theo lớp
    const rules = await validateEnrollmentRules({ class_id, enrollment_year, date_of_birth });
    if (!rules.ok) return error(res, rules.message, rules.status);

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, full_name, role: 'student' });
    const student = await Student.create({
      user_id: user.id, student_code, class_id, date_of_birth, gender, address, enrollment_year,
    });

    return success(res, { user_id: user.id, student_id: student.id }, 'Tạo học sinh thành công', 201);
  } catch (err) {
    return error(res, 'Tạo học sinh thất bại', 400, err.message);
  }
};

/**
 * Cập nhật hồ sơ HS (Admin hoặc GVCN của lớp HS đó).
 * Có thể cập nhật cả user info (full_name, password) lẫn student info.
 */
const update = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return error(res, 'Không tìm thấy học sinh', 404);

    // Giáo viên chỉ được sửa HS lớp mình chủ nhiệm
    if (req.user.role === 'subject') {
      const cls = await Class.findByPk(student.class_id);
      if (!cls || cls.homeroom_teacher_id !== req.user.id) {
        return error(res, 'Bạn chỉ được sửa HS lớp mình chủ nhiệm', 403);
      }
    }

    const { full_name, password, ...studentData } = req.body;

    // Nếu có sửa các trường liên quan rule thì validate lại
    const patchedClassId = studentData.class_id ?? student.class_id;
    const patchedEnrollmentYear = studentData.enrollment_year ?? student.enrollment_year;
    const patchedDob = studentData.date_of_birth ?? student.date_of_birth;
    if (
      studentData.class_id !== undefined ||
      studentData.enrollment_year !== undefined ||
      studentData.date_of_birth !== undefined
    ) {
      const rules = await validateEnrollmentRules({
        class_id: patchedClassId,
        enrollment_year: patchedEnrollmentYear,
        date_of_birth: patchedDob,
      });
      if (!rules.ok) return error(res, rules.message, rules.status);
    }

    // Cập nhật user (nếu có)
    const userPatch = {};
    if (full_name) userPatch.full_name = full_name;
    if (password) userPatch.password = await bcrypt.hash(password, 10);
    if (Object.keys(userPatch).length) await User.update(userPatch, { where: { id: student.user_id } });

    // Cập nhật student
    await Student.update(studentData, { where: { id: student.id } });

    return success(res, {}, 'Cập nhật học sinh thành công');
  } catch (err) {
    return error(res, 'Cập nhật thất bại', 400, err.message);
  }
};

/** Reset mật khẩu HS (Admin hoặc GVCN lớp đó). */
const resetPassword = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return error(res, 'Không tìm thấy học sinh', 404);

    if (req.user.role === 'subject') {
      const cls = await Class.findByPk(student.class_id);
      if (!cls || cls.homeroom_teacher_id !== req.user.id) {
        return error(res, 'Bạn chỉ được reset mật khẩu HS lớp mình chủ nhiệm', 403);
      }
    }

    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return error(res, 'Mật khẩu mới tối thiểu 6 ký tự', 400);
    }
    const hashed = await bcrypt.hash(new_password, 10);
    await User.update({ password: hashed, failed_login_count: 0, locked_until: null }, { where: { id: student.user_id } });

    return success(res, {}, 'Reset mật khẩu học sinh thành công');
  } catch (err) {
    return error(res, 'Reset mật khẩu thất bại', 500, err.message);
  }
};

/** PH/HS — lấy hồ sơ bản thân hoặc danh sách con đã liên kết. */
const myContext = async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const student = await Student.findOne({
        where: { user_id: req.user.id },
        include: [
          { model: User, as: 'user', attributes: { exclude: ['password'] } },
          { model: Class, as: 'class' },
        ],
      });
      if (!student) return error(res, 'Không tìm thấy hồ sơ học sinh', 404);
      return success(res, { type: 'student', student });
    }

    if (req.user.role === 'parent') {
      const parent = await User.findByPk(req.user.id, {
        include: [{
          model: Student,
          as: 'children',
          include: [
            { model: User, as: 'user', attributes: { exclude: ['password'] } },
            { model: Class, as: 'class' },
          ],
        }],
      });
      return success(res, { type: 'parent', children: parent?.children || [] });
    }

    return error(res, 'Endpoint chỉ dành cho học sinh/phụ huynh', 403);
  } catch (err) {
    return error(res, 'Lỗi tải hồ sơ', 500, err.message);
  }
};

/** Xóa mềm HS (chỉ Admin). */
const remove = async (req, res) => {
  try {
    await Student.destroy({ where: { id: req.params.id } });
    return success(res, {}, 'Đã xóa hồ sơ học sinh');
  } catch (err) {
    return error(res, 'Xóa thất bại', 400, err.message);
  }
};

module.exports = {
  list, detail, create, update, resetPassword, remove, myContext, getAccessibleClassIds,
};
