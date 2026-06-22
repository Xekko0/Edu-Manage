import api from './axios';

export const computeTranscript = (data) =>
  api.post('/exam/transcripts/compute', data).then((r) => r.data);

export const computeClassTranscripts = (data) =>
  api.post('/exam/transcripts/compute-class', data).then((r) => r.data);

export const getStudentTranscript = (studentId, params) =>
  api.get(`/exam/transcripts/student/${studentId}`, { params }).then((r) => r.data);

export const listExamPeriods = (params) =>
  api.get('/exam/periods', { params }).then((r) => r.data);

export const createExamPeriod = (data) =>
  api.post('/exam/periods', data).then((r) => r.data);

export const updateExamPeriod = (id, data) =>
  api.put(`/exam/periods/${id}`, data).then((r) => r.data);
