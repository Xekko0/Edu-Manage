/**
 * Attendance controller — điểm danh (SRS 2.5).
 * Cảnh báo PH qua email khi vắng không phép.
 */
const { Op } = require('sequelize');
const { Attendance, Student, User, Class } = require('../models');
const { sendAbsenceAlert } = require('../services/email.service');
const { success, error } = require('../utils/responseHelper');

const mark = async (req, res) => {
  try {
    const { items } = req.body; // [{ student_id, status, attendance_date, schedule_id, note }]
    let upserted = 0;
    for (const item of items) {
      const existing = await Attendance.findOne({
        where: {
          student_id: item.student_id,
          attendance_date: item.attendance_date,
          schedule_id: item.schedule_id ?? null,
        },
      });
      if (existing) {
        await existing.update({
          status: item.status,
          note: item.note ?? null,
          marked_by: req.user.id,
        });
      } else {
        await Attendance.create({ ...item, marked_by: req.user.id });
      }
      upserted += 1;
    }

    // Gửi email cho các trường hợp vắng không phép
    for (const item of items) {
      if (item.status === 'absent') {
        const student = await Student.findByPk(item.student_id, {
          include: [{ model: User, as: 'parents' }, { model: User, as: 'user' }],
        });
        for (const parent of student?.parents || []) {
          sendAbsenceAlert(parent.email, student.user.full_name, item.attendance_date)
            .catch((e) => console.error('[EMAIL] Absence alert failed:', e.message));
        }
      }
    }

    return success(res, { count: upserted }, 'Điểm danh thành công', 201);
  } catch (err) {
    return error(res, 'Điểm danh thất bại', 400, err.message);
  }
};

/** GVCN: lấy điểm danh theo lớp + ngày. */
const listByClass = async (req, res) => {
  try {
    const class_id = parseInt(req.params.class_id, 10);
    const { date } = req.query;
    if (!date) return error(res, 'Thiếu tham số date (YYYY-MM-DD)', 400);

    if (req.user.role === 'subject') {
      const cls = await Class.findByPk(class_id);
      if (!cls || cls.homeroom_teacher_id !== req.user.id) {
        return error(res, 'Bạn chỉ được xem điểm danh lớp mình chủ nhiệm', 403);
      }
    }

    const students = await Student.findAll({
      where: { class_id },
      attributes: ['id'],
    });
    const studentIds = students.map((s) => s.id);
    if (!studentIds.length) return success(res, []);

    const items = await Attendance.findAll({
      where: {
        student_id: { [Op.in]: studentIds },
        attendance_date: date,
      },
    });
    return success(res, items);
  } catch (err) {
    return error(res, 'Lỗi tải điểm danh', 500, err.message);
  }
};

const listByStudent = async (req, res) => {
  try {
    const { student_id } = req.params;
    const items = await Attendance.findAll({
      where: { student_id },
      order: [['attendance_date', 'DESC']],
      limit: 100,
    });
    return success(res, items);
  } catch (err) {
    return error(res, 'Lỗi tải lịch sử điểm danh', 500, err.message);
  }
};

module.exports = { mark, listByClass, listByStudent };
