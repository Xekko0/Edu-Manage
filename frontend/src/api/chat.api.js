import api from './axios';

export const sendChat = (message, sessionToken, { studentId, classId } = {}) =>
  api.post('/chat/message', {
    message,
    session_token: sessionToken,
    ...(studentId ? { student_id: studentId } : {}),
    ...(classId ? { class_id: classId } : {}),
  });

export const getChatAiStatus = () => api.get('/chat/status');

export const getChatSessions = () => api.get('/chat/sessions');

export const getChatSessionHistory = (token) => api.get(`/chat/sessions/${token}`);

export const deleteChatSession = (token) => api.delete(`/chat/sessions/${token}`);

export const endChatSession = (sessionToken) =>
  api.post('/chat/end-session', { session_token: sessionToken });
