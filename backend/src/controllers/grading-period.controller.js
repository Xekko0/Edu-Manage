/**
 * Grading Period Controller — Quản lý kỳ chốt điểm.
 */
const { GradingPeriod } = require('../models');
const { success, error } = require('../utils/responseHelper');

/** GET /grading-periods */
const list = async (req, res) => {
  try {
    const { school_year, semester } = req.query;
    const where = {};
    if (school_year) where.school_year = school_year;
    if (semester) where.semester = semester;
    const items = await GradingPeriod.findAll({ where, order: [['lock_date', 'ASC']] });
    return success(res, items);
  } catch (err) {
    return error(res, 'Lỗi tải grading periods', 500, err.message);
  }
};

/** POST /grading-periods */
const create = async (req, res) => {
  try {
    const { school_year, semester, name, lock_date } = req.body;
    const item = await GradingPeriod.create({ school_year, semester, name, lock_date });
    return success(res, item, 'Tạo kỳ chốt điểm thành công', 201);
  } catch (err) {
    return error(res, 'Lỗi tạo kỳ chốt điểm', 400, err.message);
  }
};

/** PUT /grading-periods/:id */
const update = async (req, res) => {
  try {
    const item = await GradingPeriod.findByPk(req.params.id);
    if (!item) return error(res, 'Không tìm thấy', 404);
    await item.update(req.body);
    return success(res, item);
  } catch (err) {
    return error(res, 'Lỗi cập nhật', 400, err.message);
  }
};

/** DELETE /grading-periods/:id */
const remove = async (req, res) => {
  try {
    const item = await GradingPeriod.findByPk(req.params.id);
    if (!item) return error(res, 'Không tìm thấy', 404);
    await item.destroy();
    return success(res, {});
  } catch (err) {
    return error(res, 'Lỗi xóa', 400, err.message);
  }
};

/** POST /grading-periods/:id/lock — Khóa kỳ */
const lock = async (req, res) => {
  try {
    const item = await GradingPeriod.findByPk(req.params.id);
    if (!item) return error(res, 'Không tìm thấy', 404);
    await item.update({ is_locked: true });
    return success(res, item, 'Đã khóa kỳ chốt điểm');
  } catch (err) {
    return error(res, 'Lỗi khóa', 400, err.message);
  }
};

module.exports = { list, create, update, remove, lock };
