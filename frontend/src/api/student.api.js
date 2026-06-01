import api from './axios';

export const getMyContext = () => api.get('/students/me');

export const listStudents = (params = {}) => api.get('/students', { params });

export const getStudent = (id) => api.get(`/students/${id}`);

export const createStudent = (data) => api.post('/students', data);

export const updateStudent = (id, data) => api.put(`/students/${id}`, data);

export const resetStudentPassword = (id, new_password) =>
  api.patch(`/students/${id}/reset-password`, { new_password });

export const removeStudent = (id) => api.delete(`/students/${id}`);
