import api from './axios';

export const listCompetencies = (params) =>
  api.get('/competencies', { params }).then((r) => r.data);

export const getStudentCompetencyProfile = (studentId, params) =>
  api.get(`/competencies/student/${studentId}`, { params }).then((r) => r.data);
