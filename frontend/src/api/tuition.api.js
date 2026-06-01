import api from './axios';

export const listTuitions = (params = {}) => api.get('/tuitions', { params });

export const createTuition = (data) => api.post('/tuitions', data);

export const updateTuition = (id, data) => api.put(`/tuitions/${id}`, data);

export const removeTuition = (id) => api.delete(`/tuitions/${id}`);

export const getStudentTuitions = (studentId) =>
  api.get(`/tuitions/student/${studentId}`);

export const recordPayment = (data) => api.post('/tuitions/payments', data);
