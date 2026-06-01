import { useState } from 'react';
import useChatStore from '../store/chatStore';
import { sendChat } from '../api/chat.api';

const useChat = () => {
  const { messages, addMessage, sessionToken, setSession } = useChatStore();
  const [loading, setLoading] = useState(false);

  const send = async (text) => {
    if (!text?.trim()) return;
    addMessage({ role: 'user', content: text, timestamp: Date.now() });
    setLoading(true);
    try {
      const res = await sendChat(text, sessionToken);
      if (res?.success) {
        if (res.data.session_token) setSession(res.data.session_token);
        addMessage({
          role: 'assistant',
          content: res.data.message,
          type: res.data.type,
          payload: res.data.payload,
          chips: res.data.chips,
          intent: res.data.intent,
          timestamp: Date.now(),
        });
      }
    } catch (e) {
      addMessage({
        role: 'assistant',
        content: 'Xin lỗi, hệ thống AI tạm thời gặp sự cố.',
        chips: ['Thử lại', 'Xem điểm', 'Lịch học tuần này'],
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, send };
};

export default useChat;
