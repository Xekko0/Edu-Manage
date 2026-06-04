import api from './axios';

export const listCurriculumStandards = (params = {}) =>
  api.get('/curriculum-standards', { params });

export const lookupCurriculum = (params) =>
  api.get('/curriculum-standards/lookup', { params });

export const upsertCurriculumStandard = (data) =>
  api.put('/curriculum-standards', data);

export const removeCurriculumStandard = (id) =>
  api.delete(`/curriculum-standards/${id}`);
