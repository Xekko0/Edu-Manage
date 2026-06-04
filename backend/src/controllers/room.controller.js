'use strict';

const { Room } = require('../models');
const { success, error } = require('../utils/responseHelper');
const { clearRoomsCache } = require('../services/scheduling/room-assign');

const list = async (req, res) => {
  try {
    const where = {};
    if (req.query.active_only === '1') where.is_active = true;
    const items = await Room.findAll({
      where,
      order: [['code', 'ASC']],
    });
    return success(res, items);
  } catch (err) {
    return error(res, 'Lỗi tải danh sách phòng', 500, err.message);
  }
};

const create = async (req, res) => {
  try {
    const {
      code, name, room_type, capacity, is_active,
    } = req.body;
    if (!code || !name) return error(res, 'Thiếu mã hoặc tên phòng', 400);
    const item = await Room.create({
      code,
      name,
      room_type: room_type || 'classroom',
      capacity: capacity !== undefined ? parseInt(capacity, 10) : 40,
      is_active: is_active !== false,
    });
    clearRoomsCache();
    return success(res, item, 'Đã thêm phòng', 201);
  } catch (err) {
    return error(res, err.message || 'Thêm phòng thất bại', 400);
  }
};

const update = async (req, res) => {
  try {
    const row = await Room.findByPk(req.params.id);
    if (!row) return error(res, 'Không tìm thấy phòng', 404);
    await row.update(req.body);
    clearRoomsCache();
    return success(res, row, 'Đã cập nhật phòng');
  } catch (err) {
    return error(res, err.message || 'Cập nhật thất bại', 400);
  }
};

const remove = async (req, res) => {
  try {
    const row = await Room.findByPk(req.params.id);
    if (!row) return error(res, 'Không tìm thấy phòng', 404);
    await row.update({ is_active: false });
    clearRoomsCache();
    return success(res, {}, 'Đã ẩn phòng');
  } catch (err) {
    return error(res, 'Xóa thất bại', 400, err.message);
  }
};

module.exports = { list, create, update, remove };
