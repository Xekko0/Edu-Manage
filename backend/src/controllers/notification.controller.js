/**
 * Notification controller — thông báo nội bộ + email (SRS 2.9).
 */
const { Notification } = require('../models');
const { success, error } = require('../utils/responseHelper');

const myList = async (req, res) => {
  try {
    const items = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    const unread = await Notification.count({ where: { user_id: req.user.id, is_read: false } });
    return success(res, { items, unread });
  } catch (err) {
    return error(res, 'Lỗi tải thông báo', 500, err.message);
  }
};

const markRead = async (req, res) => {
  try {
    await Notification.update({ is_read: true }, { where: { id: req.params.id, user_id: req.user.id } });
    return success(res, {});
  } catch (err) {
    return error(res, 'Lỗi cập nhật', 500, err.message);
  }
};

const create = async (req, res) => {
  try {
    const { user_id, title, body, type } = req.body;
    const item = await Notification.create({ user_id, title, body, type });
    return success(res, item, 'Tạo thông báo thành công', 201);
  } catch (err) {
    return error(res, 'Tạo thông báo thất bại', 400, err.message);
  }
};

module.exports = { myList, markRead, create };
