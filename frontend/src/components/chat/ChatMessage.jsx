import { Link } from 'react-router-dom';
import ScoreResultCard from './ScoreResultCard';

const renderMarkdownLite = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const baseCls = 'max-w-[85%] px-3 py-2 rounded-lg text-sm';
  const userCls = 'bg-brand text-white ml-auto rounded-br-none';
  const aiCls = 'bg-white border border-slate-200 text-slate-800 rounded-bl-none';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`${baseCls} ${isUser ? userCls : aiCls}`}>
        <div className="whitespace-pre-line">{renderMarkdownLite(message.content)}</div>

        {!isUser && message.type === 'scores' && Array.isArray(message.payload) && (
          <ScoreResultCard items={message.payload} />
        )}

        {!isUser && message.type === 'class_scores' && Array.isArray(message.payload) && (
          <div className="mt-2 text-xs space-y-1 max-h-36 overflow-y-auto">
            {message.payload.slice(0, 8).map((r) => (
              <div key={r.student_id} className="flex justify-between bg-slate-50 px-2 py-1 rounded">
                <span>{r.student_code}</span>
                <span className="font-medium">TB {Number(r.overall).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {!isUser && message.type === 'students' && Array.isArray(message.payload) && (
          <div className="mt-2 text-xs space-y-0.5 max-h-32 overflow-y-auto">
            {message.payload.slice(0, 8).map((s) => (
              <div key={s.id} className="text-slate-600">
                {s.user?.full_name || s.student_code}
              </div>
            ))}
          </div>
        )}

        {!isUser && message.type === 'help' && Array.isArray(message.payload) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.payload.slice(0, 5).map((f) => (
              <Link
                key={f.path}
                to={f.path}
                className="text-xs px-2 py-1 rounded bg-brand/10 text-brand hover:bg-brand/20"
              >
                → {f.label}
              </Link>
            ))}
          </div>
        )}

        {!isUser && message.type === 'schedule' && Array.isArray(message.payload) && (
          <div className="mt-2 text-xs space-y-1 max-h-44 overflow-y-auto">
            {message.payload.length === 0 && (
              <p className="text-slate-500">Chưa có tiết học trong TKB.</p>
            )}
            {message.payload.slice(0, 12).map((s, idx) => (
              <div key={s.id ?? `${s.day_of_week}-${s.session}-${s.period}-${idx}`} className="flex justify-between gap-2 bg-slate-50 px-2 py-1 rounded">
                <span>
                  Thứ {s.day_of_week}
                  {s.session === 'afternoon' ? ' (Chiều)' : s.session === 'morning' ? ' (Sáng)' : ''}
                  {' '}• Tiết {s.period}
                </span>
                <span className="font-medium text-right">{s.subject?.name || s.subject || '—'}</span>
              </div>
            ))}
            {message.payload.length > 12 && (
              <p className="text-slate-500 pt-1">+{message.payload.length - 12} tiết nữa — bấm «Xem TKB đầy đủ» bên dưới.</p>
            )}
          </div>
        )}

        {!isUser && message.type === 'attendance' && Array.isArray(message.payload) && (
          <div className="mt-2 text-xs space-y-1 max-h-32 overflow-y-auto">
            {message.payload.slice(0, 5).map((a) => (
              <div key={a.id} className="flex justify-between bg-slate-50 px-2 py-1 rounded">
                <span>{a.attendance_date}</span>
                <span className={a.status === 'absent' ? 'text-red-600 font-medium' : ''}>
                  {a.status === 'absent' ? 'Vắng' : a.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {!isUser && message.type === 'extracurricular' && Array.isArray(message.payload) && (
          <ul className="mt-2 text-xs list-disc pl-4 space-y-0.5">
            {message.payload.length === 0 && <li>Chưa đăng ký hoạt động nào</li>}
            {message.payload.map((a) => (
              <li key={a.id}>{a.name || a.title}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
