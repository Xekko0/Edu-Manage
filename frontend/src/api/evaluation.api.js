import api from './axios';

export const listByStudent = (studentId, params = {}) =>
  api.get(`/evaluations/student/${studentId}`, { params });

export const createEvaluation = (data) => api.post('/evaluations', data);

export const updateEvaluation = (id, data) => api.put(`/evaluations/${id}`, data);

export const removeEvaluation = (id) => api.delete(`/evaluations/${id}`);
