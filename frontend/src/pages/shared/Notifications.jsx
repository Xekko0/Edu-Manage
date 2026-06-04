/** S15 — Thông báo. */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Card, { CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { myNotifications, markRead } from '../../api/notification.api';
import { formatDateTime } from '../../utils/format';
import { NOTIFICATION_TYPE } from '../../utils/labels';
import { cn } from '../../utils/cn';

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
      <PageHeader title="Thông báo" description="Tin từ nhà trường và hệ thống">
        {unread > 0 && (
          <Badge className="bg-rose-100 text-rose-800">{unread} chưa đọc</Badge>
        )}
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !items.length ? (
        <Card><EmptyState message="Chưa có thông báo nào." /></Card>
      ) : (
        <Card>
          <CardBody className="!p-0 divide-y divide-slate-100">
            {items.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'p-4 flex gap-4 transition-colors',
                  n.is_read ? 'bg-white' : 'bg-teal-50/50',
                )}
              >
                <span className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full shrink-0',
                  n.is_read ? 'bg-slate-100 text-slate-500' : 'bg-teal-100 text-teal-700',
                )}
                >
                  <Bell className="w-5 h-5" aria-hidden />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">{n.title}</span>
                    <span className="text-caption">{NOTIFICATION_TYPE[n.type] || n.type}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{n.content}</p>
                  <p className="text-caption mt-2">{formatDateTime(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <button
                    type="button"
                    onClick={() => handleRead(n.id)}
                    className="text-xs text-primary font-medium hover:underline shrink-0 min-h-[44px] px-2"
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
