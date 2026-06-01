import { useState, useRef, useEffect } from 'react';
import useChat from '../../hooks/useChat';
import useChatStore from '../../store/chatStore';
import ChatMessage from './ChatMessage';
import QuickChips from './QuickChips';

const STARTER_CHIPS = [
  'Điểm con tôi môn Toán?',
  'Lịch học tuần này',
  'Con có vắng buổi nào không?',
];

export default function ChatPopup() {
  const { messages, loading, send } = useChat();
  const { close } = useChatStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text) => {
    const value = (text ?? input).trim();
    if (!value) return;
    send(value);
    setInput('');
  };

  const lastChips = messages.findLast?.((m) => m.role === 'assistant')?.chips;
  const chips = lastChips || (messages.length === 0 ? STARTER_CHIPS : null);

  return (
    <div className="chat-popup">
      {/* Header */}
      <div className="bg-brand text-white px-4 py-3 flex items-center justify-between">
        <div>
          <div className="font-semibold text-sm">Trợ lý EduSmart</div>
          <div className="text-xs opacity-80">{loading ? 'Đang suy nghĩ…' : 'Sẵn sàng hỗ trợ'}</div>
        </div>
        <button onClick={close} className="text-white text-xl leading-none px-2" aria-label="Thu nhỏ">
          −
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 text-xs mt-6">
            Chào mừng bạn! Hãy thử các gợi ý phía dưới hoặc nhập câu hỏi.
          </div>
        )}
        {messages.map((m, i) => (
          <ChatMessage key={i} message={m} />
        ))}
      </div>

      {/* Quick chips */}
      {chips && <QuickChips chips={chips} onPick={handleSend} />}

      {/* Input */}
      <div className="border-t bg-white p-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Hỏi trợ lý…"
          className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading}
          className="px-3 py-2 text-sm bg-brand text-white rounded-md disabled:opacity-50"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
