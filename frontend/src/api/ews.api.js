import api from './axios';

export const getStudentRisk = (studentId, params) =>
  api.get(`/ews/student/${studentId}`, { params }).then((r) => r.data);

export const getClassRisks = (classId, params) =>
  api.get(`/ews/class/${classId}`, { params }).then((r) => r.data);

export const getEWSDashboard = (params) =>
  api.get('/ews/dashboard', { params }).then((r) => r.data);

export const recomputeEWS = (data) =>
  api.post('/ews/recompute', data).then((r) => r.data);
