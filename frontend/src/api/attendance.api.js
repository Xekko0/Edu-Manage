import api from './axios';

export const markAttendance = (data) => api.post('/attendance/mark', data);

export const listAttendanceByClass = (classId, params = {}) =>
  api.get(`/attendance/class/${classId}`, { params });

export const listByStudent = (studentId, params = {}) =>
  api.get(`/attendance/student/${studentId}`, { params });
