/**
 * Class controller — Admin CRUD lớp học.
 * Endpoint phụ:
 *   GET /classes/grade-levels   → danh sách khối khả dụng
 *   GET /classes/school-years   → danh sách năm học khả dụng
 * Mọi người xem (catalog.view).
 */
const { fn, col, literal } = require('sequelize');
const { Class, User, Student } = require('../models');
const { success, error } = require('../utils/responseHelper');

const list = async (req, res) => {
  try {
    const { school_year, grade_level } = req.query;
    const where = {};
    if (school_year) where.school_year = school_year;
    if (grade_level) where.grade_level = grade_level;

    const items = await Class.findAll({
      where,
      include: [{ model: User, as: 'homeroomTeacher', attributes: ['id', 'full_name', 'email'] }],
      order: [['school_year', 'DESC'], ['grade_level', 'ASC'], ['name', 'ASC']],
    });
    return success(res, items);
  } catch (err) {
    return error(res, 'Lỗi tải danh sách lớp', 500, err.message);
  }
};

const detail = async (req, res) => {
  try {
    const cls = await Class.findByPk(req.params.id, {
      include: [
        { model: User, as: 'homeroomTeacher', attributes: ['id', 'full_name', 'email'] },
        { model: Student, as: 'students', include: [{ association: 'user', attributes: ['full_name'] }] },
      ],
    });
    if (!cls) return error(res, 'Không tìm thấy lớp', 404);
    return success(res, cls);
  } catch (err) {
    return error(res, 'Lỗi tải lớp', 500, err.message);
  }
};

const create = async (req, res) => {
  try {
    const item = await Class.create(req.body);
    return success(res, item, 'Tạo lớp thành công', 201);
  } catch (err) {
    return error(res, 'Tạo lớp thất bại', 400, err.message);
  }
};

const update = async (req, res) => {
  try {
    const [affected] = await Class.update(req.body, { where: { id: req.params.id } });
    return success(res, { affected });
  } catch (err) {
    return error(res, 'Cập nhật thất bại', 400, err.message);
  }
};

const remove = async (req, res) => {
  try {
    await Class.destroy({ where: { id: req.params.id } });
    return success(res, {}, 'Đã xóa lớp');
  } catch (err) {
    return error(res, 'Xóa thất bại', 400, err.message);
  }
};

const gradeLevels = async (_req, res) => {
  try {
    const items = await Class.findAll({
      attributes: [[fn('DISTINCT', col('grade_level')), 'grade_level']],
      order: [[literal('grade_level'), 'ASC']],
    });
    return success(res, items.map((i) => i.get('grade_level')));
  } catch (err) {
    return error(res, 'Lỗi tải danh sách khối', 500, err.message);
  }
};

const schoolYears = async (_req, res) => {
  try {
    const items = await Class.findAll({
      attributes: [[fn('DISTINCT', col('school_year')), 'school_year']],
      order: [[literal('school_year'), 'DESC']],
    });
    return success(res, items.map((i) => i.get('school_year')));
  } catch (err) {
    return error(res, 'Lỗi tải năm học', 500, err.message);
  }
};

module.exports = { list, detail, create, update, remove, gradeLevels, schoolYears };
