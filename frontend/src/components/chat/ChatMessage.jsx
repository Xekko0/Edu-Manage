import ScoreResultCard from './ScoreResultCard';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const baseCls = 'max-w-[85%] px-3 py-2 rounded-lg text-sm';
  const userCls = 'bg-brand text-white ml-auto rounded-br-none';
  const aiCls = 'bg-white border border-slate-200 text-slate-800 rounded-bl-none';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`${baseCls} ${isUser ? userCls : aiCls}`}>
        <div className="whitespace-pre-line">{message.content}</div>

        {/* Hiển thị bảng điểm rút gọn + nút Tải PDF inline (SRS 2.7.4) */}
        {!isUser && message.type === 'scores' && Array.isArray(message.payload) && (
          <ScoreResultCard items={message.payload} />
        )}

        {/* Hiển thị lịch học rút gọn */}
        {!isUser && message.type === 'schedule' && Array.isArray(message.payload) && (
          <div className="mt-2 text-xs space-y-1">
            {message.payload.slice(0, 6).map((s) => (
              <div key={s.id} className="flex justify-between bg-slate-50 px-2 py-1 rounded">
                <span>Thứ {s.day_of_week} • Tiết {s.period}</span>
                <span className="font-medium">{s.subject?.name || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
