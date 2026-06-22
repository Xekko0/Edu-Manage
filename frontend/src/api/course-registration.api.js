import api from './axios';

export const listElectiveCourses = (params) =>
  api.get('/courses/electives', { params }).then((r) => r.data);

export const registerCourse = (data) =>
  api.post('/courses/register', data).then((r) => r.data);

export const dropCourse = (data) =>
  api.post('/courses/drop', data).then((r) => r.data);
