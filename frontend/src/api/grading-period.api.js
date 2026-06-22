import api from './axios';

export const listGradingPeriods = (params) =>
  api.get('/grading-periods', { params }).then((r) => r.data);

export const createGradingPeriod = (data) =>
  api.post('/grading-periods', data).then((r) => r.data);

export const updateGradingPeriod = (id, data) =>
  api.put(`/grading-periods/${id}`, data).then((r) => r.data);

export const removeGradingPeriod = (id) =>
  api.delete(`/grading-periods/${id}`).then((r) => r.data);

export const lockGradingPeriod = (id) =>
  api.post(`/grading-periods/${id}/lock`).then((r) => r.data);
