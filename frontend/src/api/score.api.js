import api from './axios';

export const getStudentScores = (studentId, params = {}) =>
  api.get(`/scores/student/${studentId}`, { params });

export const enterScore = (data) => api.post('/scores', data);
export const enterScoresBulk = (items) => api.post('/scores/bulk', { items });
export const updateScore = (id, data) => api.put(`/scores/${id}`, data);

// v2.0: Công bố điểm draft → published
export const publishScores = (data) => api.post('/scores/publish', data);

export const getClassScores = (classId, params = {}) =>
  api.get(`/scores/class/${classId}`, { params });

export const downloadGradebookPDF = (studentId, params = {}) =>
  api.get(`/scores/student/${studentId}/pdf`, { params, responseType: 'blob' });
