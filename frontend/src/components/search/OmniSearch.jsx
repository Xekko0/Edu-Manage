/**
 * OmniSearch Premium — Spotlight Overlay glassmorphism.
 * Blur backdrop + rounded-2xl + avatar initials + Quick Actions.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Zap, Calendar, PenLine, BarChart3, User } from 'lucide-react';
import { globalSearch } from '../../api/search.api';

const QUICK_ACTIONS = [
  { id: 'score-entry', label: 'Đến Nhập điểm', icon: PenLine, to: '/teacher/score-entry' },
  { id: 'schedule', label: 'Xem thời khóa biểu', icon: Calendar, to: '/schedule' },
  { id: 'reports', label: 'Xem báo cáo', icon: BarChart3, to: '/admin/reports' },
  { id: 'attendance', label: 'Điểm danh', icon: User, to: '/teacher/attendance' },
];

const TYPE_COLORS = {
  student: 'bg-indigo-50 text-indigo-600',
  class: 'bg-teal-50 text-teal-600',
  teacher: 'bg-amber-50 text-amber-600',
  subject: 'bg-emerald-50 text-emerald-600',
};

const TYPE_LABELS = {
  student: 'Học sinh',
  class: 'Lớp',
  teacher: 'Giáo viên',
  subject: 'Môn học',
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

export default function OmniSearch({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSearch = useCallback(async (q) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await globalSearch(q);
      if (res?.success) setResults(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const handleSelect = (item) => {
    const routes = {
      student: `/admin/students?q=${item.code || item.name}`,
      class: `/admin/classes?q=${item.name}`,
      teacher: `/admin/users?q=${item.email || item.name}`,
      subject: `/admin/subjects?q=${item.code || item.name}`,
    };
    if (routes[item.type]) navigate(routes[item.type]);
    onClose();
  };

  if (!open) return null;

  const allResults = results
    ? [...(results.students || []), ...(results.classes || []), ...(results.teachers || []), ...(results.subjects || [])]
    : [];

  const showQuickActions = query.length < 2;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-zinc-900/30 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 border-b border-zinc-100">
          <Search size={18} className="text-zinc-300 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm học sinh, lớp học, giáo viên hoặc lệnh nhanh..."
            className="flex-1 py-4 bg-transparent text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-50 border border-zinc-200 rounded-md shadow-sm">
            ESC
          </kbd>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-500 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="p-2 max-h-96 overflow-y-auto">
          {/* Quick Actions */}
          {showQuickActions && (
            <div className="mb-2">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={10} /> Lệnh nhanh
              </div>
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => { navigate(action.to); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                    <action.icon size={14} className="text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <span className="text-sm text-zinc-600 group-hover:text-zinc-800 transition-colors">{action.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="px-3 py-4">
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-zinc-100" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-zinc-100 rounded w-2/3" />
                      <div className="h-2 bg-zinc-100 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {!loading && query.length >= 2 && allResults.length === 0 && (
            <div className="px-3 py-8 text-center">
              <div className="text-zinc-300 mb-2">🔍</div>
              <p className="text-sm text-zinc-400">Không tìm thấy kết quả cho "{query}"</p>
            </div>
          )}

          {/* Search Results */}
          {!loading && allResults.length > 0 && (
            <div>
              {['student', 'class', 'teacher', 'subject'].map((type) => {
                const typeResults = allResults.filter((r) => r.type === type);
                if (!typeResults.length) return null;

                return (
                  <div key={type} className="mb-2">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      {TYPE_LABELS[type]}
                    </div>
                    {typeResults.map((item, i) => (
                      <button
                        key={`${item.type}-${item.id}-${i}`}
                        onClick={() => handleSelect(item)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${TYPE_COLORS[item.type] || 'bg-zinc-100 text-zinc-500'}`}>
                            {getInitials(item.name)}
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-medium text-zinc-700 group-hover:text-indigo-600 transition-colors">
                              {item.name || item.code}
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              {item.code && `Mã: ${item.code}`}
                              {item.class && ` • Lớp ${item.class}`}
                              {item.email && ` • ${item.email}`}
                            </div>
                          </div>
                        </div>
                        {item.type === 'student' && item.risk_level && item.risk_level !== 'low' && (
                          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                            item.risk_level === 'critical' ? 'bg-rose-50 text-rose-600' :
                            item.risk_level === 'high' ? 'bg-amber-50 text-amber-600' :
                            'bg-yellow-50 text-yellow-600'
                          }`}>
                            {item.risk_level === 'critical' ? '🔴 Critical' :
                             item.risk_level === 'high' ? '🟠 High' : '🟡 Medium'}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-zinc-100 bg-zinc-50/50 text-[10px] text-zinc-400 flex items-center gap-4">
          <span><kbd className="font-mono bg-white px-1 py-0.5 rounded border border-zinc-200 shadow-sm">↑↓</kbd> Di chuyển</span>
          <span><kbd className="font-mono bg-white px-1 py-0.5 rounded border border-zinc-200 shadow-sm">Enter</kbd> Chọn</span>
          <span><kbd className="font-mono bg-white px-1 py-0.5 rounded border border-zinc-200 shadow-sm">Esc</kbd> Đóng</span>
        </div>
      </div>
    </div>
  );
}
