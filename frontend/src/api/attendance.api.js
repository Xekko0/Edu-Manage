import api from './axios';

export const markAttendance = (data) => api.post('/attendance/mark', data);

// v2.0: Chuyển trạng thái đi muộn
export const markLate = (id) => api.patch(`/attendance/${id}/late`);

export const listAttendanceByClass = (classId, params = {}) =>
  api.get(`/attendance/class/${classId}`, { params });

export const listByStudent = (studentId, params = {}) =>
  api.get(`/attendance/student/${studentId}`, { params });
