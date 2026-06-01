/**
 * Subject controller — Admin CRUD danh mục môn học.
 * Mọi người được xem (catalog.view).
 */
const { Subject } = require('../models');
const { success, error } = require('../utils/responseHelper');

const list = async (_req, res) => {
  try {
    const items = await Subject.findAll({ order: [['code', 'ASC']] });
    return success(res, items);
  } catch (err) {
    return error(res, 'Lỗi tải môn học', 500, err.message);
  }
};

const create = async (req, res) => {
  try {
    const item = await Subject.create(req.body);
    return success(res, item, 'Tạo môn học thành công', 201);
  } catch (err) {
    return error(res, 'Tạo môn học thất bại', 400, err.message);
  }
};

const update = async (req, res) => {
  try {
    const [affected] = await Subject.update(req.body, { where: { id: req.params.id } });
    return success(res, { affected });
  } catch (err) {
    return error(res, 'Cập nhật thất bại', 400, err.message);
  }
};

const remove = async (req, res) => {
  try {
    await Subject.destroy({ where: { id: req.params.id } });
    return success(res, {}, 'Đã xóa môn học');
  } catch (err) {
    return error(res, 'Xóa thất bại', 400, err.message);
  }
};

module.exports = { list, create, update, remove };
