import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getVapidPublicKey, subscribePush, unsubscribePush } from '../api/push.api';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
};

const REMINDER_PREF_KEY = 'edusmart_reminder_minutes';

export function getReminderMinutesPref() {
  const v = parseInt(localStorage.getItem(REMINDER_PREF_KEY), 10);
  return v === 30 ? 30 : 15;
}

export function setReminderMinutesPref(minutes) {
  localStorage.setItem(REMINDER_PREF_KEY, String(minutes === 30 ? 30 : 15));
}

export default function useWebPush({ enabled = true } = {}) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSupported(
      enabled
      && 'serviceWorker' in navigator
      && 'PushManager' in window
      && 'Notification' in window,
    );
  }, [enabled]);

  const subscribe = useCallback(async () => {
    if (!supported) {
      toast.error('Trình duyệt không hỗ trợ thông báo đẩy');
      return false;
    }
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        toast.error('Bạn cần cho phép thông báo');
        return false;
      }

      const keyRes = await getVapidPublicKey();
      const publicKey = keyRes?.data?.publicKey;
      if (!publicKey) {
        toast.error('Máy chủ chưa cấu hình Web Push');
        return false;
      }

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const json = sub.toJSON();
      await subscribePush({
        endpoint: json.endpoint,
        keys: json.keys,
      });

      setSubscribed(true);
      toast.success('Đã bật nhắc lịch học');
      return true;
    } catch (err) {
      toast.error(err?.message || 'Không đăng ký được thông báo');
      return false;
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager?.getSubscription();
      if (sub) {
        await unsubscribePush(sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast.success('Đã tắt nhắc lịch');
    } catch (err) {
      toast.error(err?.message || 'Lỗi hủy đăng ký');
    } finally {
      setLoading(false);
    }
  }, []);

  return { supported, subscribed, loading, subscribe, unsubscribe };
}
