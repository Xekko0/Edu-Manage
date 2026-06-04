'use strict';

const { PushSubscription } = require('../models');
const { success, error } = require('../utils/responseHelper');
const pushNotificationService = require('../services/push-notification.service');

const vapidPublicKey = async (_req, res) => {
  const key = pushNotificationService.getPublicKey();
  if (!key) {
    return error(res, 'Web Push chưa được cấu hình trên máy chủ', 503);
  }
  return success(res, { publicKey: key });
};

const subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return error(res, 'Thiếu thông tin subscription', 400);
    }

    const [row] = await PushSubscription.findOrCreate({
      where: { user_id: req.user.id, endpoint },
      defaults: {
        user_id: req.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: req.headers['user-agent'] || null,
      },
    });

    if (row.p256dh !== keys.p256dh || row.auth !== keys.auth) {
      await row.update({
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: req.headers['user-agent'] || null,
      });
    }

    return success(res, { subscribed: true }, 'Đã đăng ký nhận thông báo đẩy');
  } catch (err) {
    return error(res, err.message || 'Đăng ký thất bại', 400);
  }
};

const unsubscribe = async (req, res) => {
  try {
    const endpoint = req.body?.endpoint;
    const where = { user_id: req.user.id };
    if (endpoint) where.endpoint = endpoint;
    await PushSubscription.destroy({ where });
    return success(res, {}, 'Đã hủy đăng ký');
  } catch (err) {
    return error(res, err.message || 'Hủy thất bại', 400);
  }
};

module.exports = { vapidPublicKey, subscribe, unsubscribe };
