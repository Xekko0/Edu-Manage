import api from './axios';

export const listAssignments = (params = {}) => api.get('/assignments', { params });

export const createAssignment = (data) => api.post('/assignments', data);

export const removeAssignment = (id) => api.delete(`/assignments/${id}`);

export const myAssignments = () => api.get('/assignments/me');

export const listTeacherUnavailability = (params = {}) =>
  api.get('/assignments/unavailability', { params });

export const createTeacherUnavailability = (data) =>
  api.post('/assignments/unavailability', data);

export const removeTeacherUnavailability = (id) =>
  api.delete(`/assignments/unavailability/${id}`);
