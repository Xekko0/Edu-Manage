import api from './axios';

export const listAssignments = (params = {}) => api.get('/assignments', { params });

export const createAssignment = (data) => api.post('/assignments', data);

export const removeAssignment = (id) => api.delete(`/assignments/${id}`);

export const myAssignments = () => api.get('/assignments/me');
