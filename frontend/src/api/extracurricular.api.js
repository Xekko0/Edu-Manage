import api from './axios';

export const listExtracurriculars = () => api.get('/extracurriculars');

export const listByStudent = (studentId) =>
  api.get(`/extracurriculars/student/${studentId}`);
