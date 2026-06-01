import api from './axios';

export const listSchedules = (params = {}) => api.get('/schedules', { params });

export const listSchedulesMine = (params = {}) => api.get('/schedules/mine', { params });

export const createSchedule = (data) => api.post('/schedules', data);

export const updateSchedule = (id, data) => api.put(`/schedules/${id}`, data);

export const moveSchedule = (id, data) => api.patch(`/schedules/${id}/move`, data);

export const removeSchedule = (id) => api.delete(`/schedules/${id}`);

export const autoArrangeSchedules = (data) => api.post('/schedules/auto-arrange', data);
