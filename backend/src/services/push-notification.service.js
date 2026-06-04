'use strict';

const webpush = require('web-push');
const env = require('../config/env');
const { PushSubscription } = require('../models');

let vapidReady = false;

const ensureVapid = () => {
  if (vapidReady) return !!env.VAPID_PUBLIC_KEY;
  if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      env.VAPID_SUBJECT || 'mailto:admin@edusmart.local',
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY,
    );
    vapidReady = true;
    return true;
  }
  return false;
};

const getPublicKey = () => env.VAPID_PUBLIC_KEY || null;

const sendToSubscription = async (sub, payload) => {
  if (!ensureVapid()) return false;
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload),
    );
    return true;
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      await PushSubscription.destroy({ where: { id: sub.id } });
    }
    return false;
  }
};

const sendToUser = async (userId, payload) => {
  const subs = await PushSubscription.findAll({ where: { user_id: userId } });
  if (!subs.length || !ensureVapid()) return { sent: 0, skipped: true };
  let sent = 0;
  for (const sub of subs) {
    const ok = await sendToSubscription(sub, payload);
    if (ok) sent += 1;
  }
  return { sent };
};

module.exports = {
  getPublicKey,
  sendToUser,
  sendToSubscription,
  ensureVapid,
};
