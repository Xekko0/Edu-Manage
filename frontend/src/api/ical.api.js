import api from './axios';

export const getMyICalLink = () =>
  api.get('/ical/link').then((r) => r.data);

export const getICalTeacherUrl = (teacherId) =>
  `${api.defaults.baseURL?.replace('/api', '') || ''}/api/ical/teacher/${teacherId}`;

export const getICalStudentUrl = (studentId) =>
  `${api.defaults.baseURL?.replace('/api', '') || ''}/api/ical/student/${studentId}`;
