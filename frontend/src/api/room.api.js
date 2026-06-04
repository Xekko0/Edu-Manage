import api from './axios';

export const listRooms = (params = {}) => api.get('/rooms', { params });

export const createRoom = (data) => api.post('/rooms', data);

export const updateRoom = (id, data) => api.put(`/rooms/${id}`, data);

export const removeRoom = (id) => api.delete(`/rooms/${id}`);
