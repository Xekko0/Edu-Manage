/**
 * Course Registration Controller — API Đăng ký môn tự chọn.
 */
const courseRegService = require('../services/course-registration.service');
const { success, error } = require('../utils/responseHelper');

/** GET /courses/electives — Danh sách môn tự chọn + sĩ số */
const listElectives = async (req, res) => {
  try {
    const { semester = 1, school_year, grade_level } = req.query;
    const courses = await courseRegService.listElectiveCourses(semester, school_year, grade_level);
    return success(res, courses);
  } catch (err) {
    return error(res, 'Lỗi tải danh sách', 500, err.message);
  }
};

/** POST /courses/register — Đăng ký môn (Transaction Lock) */
const register = async (req, res) => {
  try {
    const { subject_id, semester, school_year } = req.body;
    // Lấy student_id từ user hiện tại
    const { Student } = require('../models');
    const student = await Student.findOne({ where: { user_id: req.user.id } });
    if (!student) return error(res, 'Không tìm thấy hồ sơ HS', 404);

    const result = await courseRegService.registerCourse(student.id, subject_id, semester, school_year);
    if (!result.success) return error(res, result.message, result.code || 400);
    return success(res, result.data, result.message);
  } catch (err) {
    return error(res, 'Lỗi đăng ký', 500, err.message);
  }
};

/** POST /courses/drop — Hủy đăng ký */
const drop = async (req, res) => {
  try {
    const { subject_id, semester, school_year } = req.body;
    const { Student } = require('../models');
    const student = await Student.findOne({ where: { user_id: req.user.id } });
    if (!student) return error(res, 'Không tìm thấy hồ sơ HS', 404);

    const enrollment = await courseRegService.dropCourse(student.id, subject_id, semester, school_year);
    return success(res, enrollment, 'Hủy đăng ký thành công');
  } catch (err) {
    return error(res, 'Lỗi hủy đăng ký', 400, err.message);
  }
};

module.exports = { listElectives, register, drop };
