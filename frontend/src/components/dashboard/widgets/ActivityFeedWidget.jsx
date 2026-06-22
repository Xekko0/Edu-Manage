/**
 * ActivityFeedWidget — Hoạt động gần đây (notifications).
 */
import { useEffect, useState } from 'react';
import { Bell, UserPlus, FileText, Calendar, AlertTriangle } from 'lucide-react';
import { myNotifications } from '../../../api/notification.api';

const TYPE_ICONS = {
  system: Bell,
  score: FileText,
  attendance: AlertTriangle,
  event: Calendar,
  message: UserPlus,
  schedule: Calendar,
};

export default function ActivityFeedWidget() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    myNotifications()
      .then((res) => {
        if (res?.success) setItems((res.data?.items || []).slice(0, 5));
      })
      .catch(() => {});
  }, []);

  if (!items.length) {
    return (
      <div className="text-center py-6 text-slate-400 text-sm">
        <Bell size={24} className="mx-auto mb-2 opacity-50" />
        Không có hoạt động mới
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const Icon = TYPE_ICONS[item.type] || Bell;
        return (
          <div key={item.id} className="flex items-start gap-2.5 py-1.5">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
              <Icon size={12} className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 truncate">{item.title}</p>
              <p className="text-[10px] text-slate-400 truncate">{item.body}</p>
            </div>
            <span className="text-[10px] text-slate-300 shrink-0 whitespace-nowrap">
              {item.created_at ? new Date(item.created_at).toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}
