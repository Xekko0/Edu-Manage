import api from './axios';

export const getFinanceSummary = (params) =>
  api.get('/finance/summary', { params }).then((r) => r.data);

export const createInvoice = (data) =>
  api.post('/finance/invoices', data).then((r) => r.data);

export const recordPayment = (data) =>
  api.post('/finance/payments', data).then((r) => r.data);

export const getStudentInvoices = (studentId, params) =>
  api.get(`/finance/student/${studentId}`, { params }).then((r) => r.data);
