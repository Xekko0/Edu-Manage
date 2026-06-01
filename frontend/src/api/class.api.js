import api from './axios';

export const listClasses = (params = {}) => api.get('/classes', { params });

export const getClass = (id) => api.get(`/classes/${id}`);

export const createClass = (data) => api.post('/classes', data);

export const updateClass = (id, data) => api.put(`/classes/${id}`, data);

export const removeClass = (id) => api.delete(`/classes/${id}`);

export const getGradeLevels = () => api.get('/classes/grade-levels');

export const getSchoolYears = () => api.get('/classes/school-years');
