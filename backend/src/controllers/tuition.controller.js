/**
 * Tuition controller — học phí.
 *   - Admin   : CRUD cấu hình học phí theo lớp/năm/kỳ; xem tất cả payments
 *   - GVCN    : xem học phí + tình hình đóng của HS lớp mình
 *   - PH / HS : xem học phí của (con) mình + lịch sử đóng
 */
const { Tuition, TuitionPayment, Student, Class } = require('../models');
const { success, error } = require('../utils/responseHelper');

const listTuitions = async (req, res) => {
  try {
    const { class_id, school_year, semester } = req.query;
    const where = {};
    if (class_id) where.class_id = class_id;
    if (school_year) where.school_year = school_year;
    if (semester !== undefined) where.semester = semester;
    const items = await Tuition.findAll({
      where,
      include: [{ model: Class, as: 'class' }],
      order: [['school_year', 'DESC'], ['semester', 'ASC']],
    });
    return success(res, items);
  } catch (err) {
    return error(res, 'Lỗi tải học phí', 500, err.message);
  }
};

const createTuition = async (req, res) => {
  try {
    const item = await Tuition.create(req.body);
    return success(res, item, 'Tạo học phí thành công', 201);
  } catch (err) {
    return error(res, 'Tạo học phí thất bại', 400, err.message);
  }
};

const updateTuition = async (req, res) => {
  try {
    const [affected] = await Tuition.update(req.body, { where: { id: req.params.id } });
    return success(res, { affected });
  } catch (err) {
    return error(res, 'Cập nhật thất bại', 400, err.message);
  }
};

const removeTuition = async (req, res) => {
  try {
    await Tuition.destroy({ where: { id: req.params.id } });
    return success(res, {}, 'Đã xóa học phí');
  } catch (err) {
    return error(res, 'Xóa thất bại', 400, err.message);
  }
};

/** Lấy học phí + tình hình đóng của 1 HS (PH/HS đã được parentLink check). */
const listByStudent = async (req, res) => {
  try {
    const { student_id } = req.params;
    const student = await Student.findByPk(student_id);
    if (!student) return error(res, 'Không tìm thấy học sinh', 404);

    const tuitions = await Tuition.findAll({
      where: { class_id: student.class_id, is_active: true },
      include: [{ model: TuitionPayment, as: 'payments', where: { student_id }, required: false }],
      order: [['school_year', 'DESC'], ['semester', 'ASC']],
    });

    const result = tuitions.map((t) => {
      const payment = t.payments?.[0];
      return {
        tuition_id: t.id,
        school_year: t.school_year,
        semester: t.semester,
        amount: Number(t.amount),
        due_date: t.due_date,
        description: t.description,
        amount_paid: Number(payment?.amount_paid || 0),
        status: payment?.status || 'unpaid',
        paid_at: payment?.paid_at,
      };
    });
    return success(res, result);
  } catch (err) {
    return error(res, 'Lỗi tải học phí HS', 500, err.message);
  }
};

/** Admin/GVCN ghi nhận đóng học phí cho 1 HS. */
const recordPayment = async (req, res) => {
  try {
    const { tuition_id, student_id, amount_paid, status, note } = req.body;
    const [payment, created] = await TuitionPayment.findOrCreate({
      where: { tuition_id, student_id },
      defaults: { amount_paid, status, note, paid_at: status === 'paid' ? new Date() : null },
    });
    if (!created) {
      await payment.update({
        amount_paid, status, note,
        paid_at: status === 'paid' ? new Date() : payment.paid_at,
      });
    }
    return success(res, payment, 'Ghi nhận học phí thành công');
  } catch (err) {
    return error(res, 'Ghi nhận thất bại', 400, err.message);
  }
};

module.exports = {
  listTuitions, createTuition, updateTuition, removeTuition,
  listByStudent, recordPayment,
};
