/** S15 — Thông báo. */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { myNotifications, markRead } from '../../api/notification.api';
import { formatDateTime } from '../../utils/format';
import { NOTIFICATION_TYPE } from '../../utils/labels';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await myNotifications();
      if (res?.success) {
        setItems(res.data.items || []);
        setUnread(res.data.unread || 0);
      }
    } catch (err) {
      toast.error(err?.message || 'Không tải thông báo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRead = async (id) => {
    try {
      await markRead(id);
      load();
    } catch (_) { /* ignore */ }
  };

  return (
    <div>
      <PageHeader title="Thông báo">
        {unread > 0 && (
          <span className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded-full">
            {unread} chưa đọc
          </span>
        )}
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !items.length ? (
        <EmptyState message="Chưa có thông báo nào." />
      ) : (
        <div className="bg-white rounded-lg border divide-y">
          {items.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex gap-4 ${n.is_read ? 'bg-white' : 'bg-blue-50/50'}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-brand shrink-0" />}
                  <span className="font-semibold text-sm">{n.title}</span>
                  <span className="text-xs text-slate-400">
                    {NOTIFICATION_TYPE[n.type] || n.type}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{n.body}</p>
                <p className="text-xs text-slate-400 mt-2">{formatDateTime(n.createdAt)}</p>
              </div>
              {!n.is_read && (
                <button
                  type="button"
                  className="text-xs text-brand hover:underline shrink-0 self-start"
                  onClick={() => handleRead(n.id)}
                >
                  Đánh dấu đã đọc
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
