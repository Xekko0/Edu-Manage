import api from './axios';

export const globalSearch = (q, limit = 10) =>
  api.get('/search', { params: { q, limit } }).then((r) => r.data);
