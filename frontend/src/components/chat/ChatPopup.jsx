import { useState, useRef, useEffect, useMemo } from 'react';
import useAuth from '../../hooks/useAuth';
import useChat from '../../hooks/useChat';
import useChatStore from '../../store/chatStore';
import useStudentContext from '../../hooks/useStudentContext';
import useTeacherClasses from '../../hooks/useTeacherClasses';
import { listClasses } from '../../api/class.api';
import { resolveClientPersona, getPersonaConfig } from '../../config/chatPersonas';
import StudentSelector from '../family/StudentSelector';
import ClassSelector from './ClassSelector';
import ChatMessage from './ChatMessage';
import QuickChips from './QuickChips';

export default function ChatPopup() {
  const { user } = useAuth();
  const isStaff = ['admin', 'subject', 'homeroom'].includes(user?.role);
  const isFamily = ['parent', 'student'].includes(user?.role);

  const {
    students, selectedId: selectedStudentId, setSelectedId: setSelectedStudentId,
    isParent, selectedStudent,
  } = useStudentContext();

  const { homeroomClass, teachingClasses, loading: teacherLoading } = useTeacherClasses();
  const [adminClasses, setAdminClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);

  const clientPersona = resolveClientPersona(user, homeroomClass);
  const fallbackConfig = getPersonaConfig(clientPersona);

  useEffect(() => {
    if (user?.role !== 'admin') return undefined;
    let cancelled = false;
    listClasses().then((res) => {
      if (!cancelled && res?.success) {
        const list = res.data || [];
        setAdminClasses(list);
        setSelectedClassId((prev) => prev || list[0]?.id || null);
      }
    });
    return () => { cancelled = true; };
  }, [user?.role]);

  const staffClasses = useMemo(() => {
    if (user?.role === 'admin') return adminClasses;
    return teachingClasses;
  }, [user?.role, adminClasses, teachingClasses]);

  useEffect(() => {
    if (!isStaff || staffClasses.length === 0) return;
    setSelectedClassId((prev) => {
      if (prev && staffClasses.some((c) => c.id === prev)) return prev;
      return homeroomClass?.id || staffClasses[0]?.id || null;
    });
  }, [isStaff, staffClasses, homeroomClass]);

  const classId = isStaff ? selectedClassId : undefined;
  const studentId = isFamily ? selectedStudentId : undefined;

  const { messages, loading, send, aiStatus, personaConfig } = useChat({ studentId, classId });
  const config = personaConfig?.title ? personaConfig : fallbackConfig;
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

  const lastAssistant = messages.findLast?.((m) => m.role === 'assistant');
  const chips = lastAssistant?.chips || (messages.length === 0 ? config.starterChips : null);
  const chipActions = lastAssistant?.chip_actions;

  const subtitle = loading
    ? 'Đang suy nghĩ…'
    : aiStatus?.llm_configured
      ? `AI ${aiStatus.provider || 'LLM'} · ${aiStatus.persona || clientPersona}`
      : 'Chế độ cơ bản';

  return (
    <div className="chat-popup">
      <div className="bg-brand text-white px-4 py-3 flex items-center justify-between">
        <div>
          <div className="font-semibold text-sm">{config.title}</div>
          <div className="text-xs opacity-80">{subtitle}</div>
        </div>
        <button type="button" onClick={close} className="text-white text-xl leading-none px-2" aria-label="Thu nhỏ">
          −
        </button>
      </div>

      {isStaff && !teacherLoading && staffClasses.length > 0 && (
        <div className="px-3 py-2 bg-white border-b">
          <ClassSelector
            classes={staffClasses}
            selectedId={selectedClassId}
            setSelectedId={setSelectedClassId}
          />
          <p className="text-xs text-slate-500 mt-1">
            Tra cứu theo lớp đang chọn. Ghi tên lớp (vd. 10A1) trong câu hỏi để đổi nhanh.
          </p>
        </div>
      )}

      {isFamily && isParent && students.length > 0 && (
        <div className="px-3 py-2 bg-white border-b">
          <StudentSelector
            students={students}
            selectedId={selectedStudentId}
            setSelectedId={setSelectedStudentId}
            isParent={isParent}
          />
          {selectedStudent && (
            <p className="text-xs text-slate-500 mt-1">
              Đang hỗ trợ: {selectedStudent.user?.full_name || selectedStudent.student_code}
            </p>
          )}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 text-xs mt-6 px-2">
            {config.welcome}
            {!aiStatus?.llm_configured && (
              <p className="mt-2 text-amber-700">Thêm API key LLM vào backend/.env để hỏi tự do chi tiết hơn.</p>
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <ChatMessage key={i} message={m} />
        ))}
      </div>

      {(chips || chipActions) && (
        <QuickChips chips={chips} chipActions={chipActions} onPick={handleSend} />
      )}

      <div className="border-t bg-white p-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={config.placeholder}
          className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <button
          type="button"
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
