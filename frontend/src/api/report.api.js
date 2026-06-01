import api from './axios';

export const classOverview = (classId, params = {}) =>
  api.get(`/reports/class/${classId}/overview`, { params });

export const promotionForecast = (params = {}) =>
  api.get('/reports/promotion-forecast', { params });
