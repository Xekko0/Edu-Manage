/**
 * Finance Service — Quản lý Sổ cái Tài chính (Ledger-based).
 * invoices + invoice_items + payment_transactions
 */
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Invoice, InvoiceItem, PaymentTransaction, Student, User } = require('../models');

/** Tạo hóa đơn cho 1 HS theo kỳ */
const createInvoice = async ({ student_id, school_year, semester, items, due_date, description, created_by }) => {
  const t = await sequelize.transaction();
  try {
    const total = items.reduce((sum, i) => sum + Number(i.amount), 0);

    const invoice = await Invoice.create({
      student_id, school_year, semester,
      total_amount: total,
      paid_amount: 0,
      status: 'unpaid',
      due_date,
      description,
      created_by,
    }, { transaction: t });

    const invoiceItems = items.map((i) => ({
      invoice_id: invoice.id,
      description: i.description,
      amount: i.amount,
      category: i.category || 'tuition',
    }));
    await InvoiceItem.bulkCreate(invoiceItems, { transaction: t });

    await t.commit();
    return invoice;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/** Ghi nhận thanh toán */
const recordPayment = async ({ invoice_id, amount, method, reference_code, approved_by, note }) => {
  const t = await sequelize.transaction();
  try {
    const invoice = await Invoice.findByPk(invoice_id, { transaction: t, lock: true });
    if (!invoice) throw new Error('Không tìm thấy hóa đơn');

    const payment = await PaymentTransaction.create({
      invoice_id, amount, method, reference_code, approved_by, note,
    }, { transaction: t });

    // Cập nhật paid_amount + status
    const newPaid = Number(invoice.paid_amount) + Number(amount);
    const newStatus = newPaid >= Number(invoice.total_amount) ? 'paid'
      : newPaid > 0 ? 'partial' : 'unpaid';

    await invoice.update({
      paid_amount: newPaid,
      status: newStatus,
    }, { transaction: t });

    await t.commit();
    return { payment, invoice };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/** Lấy hóa đơn của 1 HS */
const getStudentInvoices = async (studentId, schoolYear, semester) => {
  const where = { student_id: studentId };
  if (schoolYear) where.school_year = schoolYear;
  if (semester) where.semester = semester;

  return Invoice.findAll({
    where,
    include: [
      { model: InvoiceItem, as: 'items' },
      { model: PaymentTransaction, as: 'payments', order: [['paid_at', 'DESC']] },
    ],
    order: [['created_at', 'DESC']],
  });
};

/** Dashboard tài chính (Admin) */
const getFinanceSummary = async (schoolYear, semester) => {
  const where = {};
  if (schoolYear) where.school_year = schoolYear;
  if (semester) where.semester = semester;

  const invoices = await Invoice.findAll({ where });

  const summary = {
    total_invoices: invoices.length,
    total_amount: 0,
    total_paid: 0,
    total_outstanding: 0,
    paid_count: 0,
    partial_count: 0,
    unpaid_count: 0,
  };

  invoices.forEach((inv) => {
    summary.total_amount += Number(inv.total_amount);
    summary.total_paid += Number(inv.paid_amount);
    summary.total_outstanding += Number(inv.total_amount) - Number(inv.paid_amount);
    if (inv.status === 'paid') summary.paid_count++;
    else if (inv.status === 'partial') summary.partial_count++;
    else summary.unpaid_count++;
  });

  return summary;
};

module.exports = { createInvoice, recordPayment, getStudentInvoices, getFinanceSummary };
