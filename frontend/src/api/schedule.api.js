import api from './axios';

export const listSchedules = (params = {}) => api.get('/schedules', { params });

export const listSchedulesMyClass = (params = {}) =>
  api.get('/schedules/my-class', { params });

export const patchScheduleLesson = (id, data) => api.patch(`/schedules/${id}/lesson`, data);

export const listSchedulesMine = (params = {}) => api.get('/schedules/mine', { params });

export const getScheduleValidation = (params = {}) =>
  api.get('/schedules/validation', { params });

export const getSchoolScheduleValidation = (params = {}) =>
  api.get('/schedules/validation-school', { params });

export const createSchedule = (data) => api.post('/schedules', data);

export const updateSchedule = (id, data) => api.put(`/schedules/${id}`, data);

export const moveSchedule = (id, data) => api.patch(`/schedules/${id}/move`, data);

export const removeSchedule = (id) => api.delete(`/schedules/${id}`);

export const generateSchedule = (data) => api.post('/schedules/generate', data);

/** Xóa hết tiết lớp + sinh lại theo khung CT — bắt buộc đạt ràng buộc cứng */
export const autoArrangeClassSchedule = (data) => api.post('/schedules/auto-arrange', data);

export const generateSchoolSchedule = (data) => api.post('/schedules/generate-school', data);

export const repackSchedule = (data) => api.post('/schedules/repack', data);

export const repackSchoolSchedule = (data) => api.post('/schedules/repack-school', data);

export const resolveScheduleConflicts = (data) => api.post('/schedules/resolve-conflicts', data);

/** @deprecated */
export const autoArrangeSchedules = generateSchedule;

/** @deprecated */
export const autoArrangeSchool = generateSchoolSchedule;
