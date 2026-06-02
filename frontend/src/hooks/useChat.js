import { useState, useEffect } from 'react';
import useChatStore from '../store/chatStore';
import { sendChat, getChatAiStatus } from '../api/chat.api';
import { getPersonaConfig } from '../config/chatPersonas';

const useChat = ({ studentId, classId } = {}) => {
  const { messages, addMessage, sessionToken, setSession } = useChatStore();
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);

  useEffect(() => {
    getChatAiStatus()
      .then((res) => {
        if (res?.success) setAiStatus(res.data);
      })
      .catch(() => {});
  }, []);

  const persona = aiStatus?.persona;
  const personaConfig = getPersonaConfig(persona);

  const send = async (text) => {
    if (!text?.trim()) return;
    addMessage({ role: 'user', content: text, timestamp: Date.now() });
    setLoading(true);
    try {
      const res = await sendChat(text, sessionToken, { studentId, classId });
      if (res?.success) {
        if (res.data.session_token) setSession(res.data.session_token);
        addMessage({
          role: 'assistant',
          content: res.data.message,
          type: res.data.type,
          payload: res.data.payload,
          chips: res.data.chips,
          chip_actions: res.data.chip_actions,
          intent: res.data.intent,
          persona: res.data.persona,
          timestamp: Date.now(),
        });
      } else {
        addMessage({
          role: 'assistant',
          content: res?.message || 'Không nhận được phản hồi từ máy chủ.',
          chips: personaConfig.errorChips,
          timestamp: Date.now(),
        });
      }
    } catch (e) {
      addMessage({
        role: 'assistant',
        content: e?.response?.data?.message || 'Xin lỗi, hệ thống AI tạm thời gặp sự cố.',
        chips: personaConfig.errorChips,
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, send, aiStatus, personaConfig };
};

export default useChat;
