import api from './axios';

export const listSubjects = () => api.get('/subjects');

export const createSubject = (data) => api.post('/subjects', data);

export const updateSubject = (id, data) => api.put(`/subjects/${id}`, data);

export const removeSubject = (id) => api.delete(`/subjects/${id}`);
