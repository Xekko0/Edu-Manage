/**
 * AI Chatbot Widget — Floating Chat Bubble (SRS 2.7).
 * Chỉ hiển thị với Phụ huynh (parent) và Học sinh (student).
 */
import useAuth from '../../hooks/useAuth';
import useChatStore from '../../store/chatStore';
import ChatPopup from './ChatPopup';

export default function FloatingChatWidget() {
  const { user } = useAuth();
  const { open, hasNewSuggestion, toggle } = useChatStore();

  if (!user || !['parent', 'student'].includes(user.role)) return null;

  return (
    <>
      {open && <ChatPopup />}
      <button className="chat-fab" onClick={toggle} aria-label="Trợ lý AI EduSmart">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v4" />
          <line x1="8" y1="16" x2="8" y2="16" />
          <line x1="16" y1="16" x2="16" y2="16" />
        </svg>
        {hasNewSuggestion && <span className="dot-red" />}
      </button>
    </>
  );
}
