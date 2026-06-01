import api from './axios';

export const listUsers = (params = {}) => api.get('/users', { params });

export const createUser = (data) => api.post('/users', data);

export const updateUser = (id, data) => api.put(`/users/${id}`, data);

export const removeUser = (id) => api.delete(`/users/${id}`);

export const toggleUserActive = (id) => api.patch(`/users/${id}/toggle-active`);

export const resetUserPassword = (id, new_password) =>
  api.patch(`/users/${id}/reset-password`, { new_password });

export const createParentForStudent = (data) =>
  api.post('/users/parent-for-student', data);

export const linkParentChild = (data) => api.post('/users/link-parent-child', data);

export const unlinkParentChild = (data) => api.post('/users/unlink-parent-child', data);
