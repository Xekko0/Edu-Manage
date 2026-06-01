import api from './axios';

export const sendChat = (message, sessionToken) =>
  api.post('/chat/message', { message, session_token: sessionToken });

export const endChatSession = (sessionToken) =>
  api.post('/chat/end-session', { session_token: sessionToken });
