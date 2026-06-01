import api from './axios';

export const listByClass = (classId, params = {}) =>
  api.get(`/journals/class/${classId}`, { params });

export const createJournal = (data) => api.post('/journals', data);

export const updateJournal = (id, data) => api.put(`/journals/${id}`, data);

export const removeJournal = (id) => api.delete(`/journals/${id}`);
