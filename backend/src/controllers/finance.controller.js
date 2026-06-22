/**
 * Finance Controller — API Sổ cái Tài chính.
 */
const financeService = require('../services/finance.service');
const { success, error } = require('../utils/responseHelper');

/** POST /finance/invoices — Tạo hóa đơn (Admin) */
const createInvoice = async (req, res) => {
  try {
    const invoice = await financeService.createInvoice({ ...req.body, created_by: req.user.id });
    return success(res, invoice, 'Tạo hóa đơn thành công', 201);
  } catch (err) {
    return error(res, 'Lỗi tạo hóa đơn', 400, err.message);
  }
};

/** POST /finance/payments — Ghi nhận thanh toán (Admin) */
const recordPayment = async (req, res) => {
  try {
    const result = await financeService.recordPayment({ ...req.body, approved_by: req.user.id });
    return success(res, result, 'Ghi nhận thanh toán thành công');
  } catch (err) {
    return error(res, 'Lỗi ghi nhận thanh toán', 400, err.message);
  }
};

/** GET /finance/student/:student_id — Hóa đơn của HS (PH/HS) */
const getStudentInvoices = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { school_year, semester } = req.query;
    const invoices = await financeService.getStudentInvoices(student_id, school_year, semester);
    return success(res, invoices);
  } catch (err) {
    return error(res, 'Lỗi tải hóa đơn', 500, err.message);
  }
};

/** GET /finance/summary — Dashboard tài chính (Admin) */
const getFinanceSummary = async (req, res) => {
  try {
    const { school_year, semester } = req.query;
    const summary = await financeService.getFinanceSummary(school_year, semester);
    return success(res, summary);
  } catch (err) {
    return error(res, 'Lỗi tải tổng hợp', 500, err.message);
  }
};

module.exports = { createInvoice, recordPayment, getStudentInvoices, getFinanceSummary };
