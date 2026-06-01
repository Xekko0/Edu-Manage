import api from './axios';

export const myNotifications = (params = {}) => api.get('/notifications/me', { params });

export const markRead = (id) => api.patch(`/notifications/${id}/read`);

export const createNotification = (data) => api.post('/notifications', data);
