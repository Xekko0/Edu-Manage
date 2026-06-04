import api from './axios';

export const getTimetableConfig = (params = {}) =>
  api.get('/timetable-config', { params });

export const updateTimetableConfig = (data) =>
  api.put('/timetable-config', data);
