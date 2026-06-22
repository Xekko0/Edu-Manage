import api from './axios';

export const generateInviteCode = (studentId) =>
  api.post('/invite/generate', { student_id: studentId }).then((r) => r.data);

export const redeemInviteCode = (code) =>
  api.post('/invite/redeem', { code }).then((r) => r.data);

export const getMyInviteCode = () =>
  api.get('/invite/my-code').then((r) => r.data);
