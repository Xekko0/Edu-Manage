import { useEffect } from 'react';
import { X } from 'lucide-react';
import NavMenu from './NavMenu';

export default function MobileNavDrawer({ open, onClose, user }) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu điều hướng">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-label="Đóng menu"
      />
      <div className="absolute left-0 top-0 bottom-0 w-[min(100%,280px)] bg-white shadow-popover flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <span className="font-bold text-slate-900">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 focus-ring min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavMenu user={user} onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}
