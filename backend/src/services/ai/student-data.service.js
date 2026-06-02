/**
 * Gom dữ liệu học sinh (0 token LLM) — dùng cho hội thoại tự do & general_chat.
 */
const env = require('../../config/env');
const scoreService = require('../score.service');
const {
  Student, User, Class, Schedule, Subject, Attendance,
  Extracurricular, Evaluation, TuitionPayment, Tuition, Notification,
} = require('../../models');

const schoolYear = () => env.CURRENT_SCHOOL_YEAR;

const buildStudentSnapshot = async (childId) => {
  const student = await Student.findByPk(childId, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'full_name', 'email'] },
      { model: Class, as: 'class', attributes: ['id', 'name', 'grade_level', 'school_year'] },
      { model: Extracurricular, as: 'activities', through: { attributes: [] } },
    ],
  });

  if (!student) return null;

  const sy = schoolYear();
  const [scoresHk1, scoresHk2, schedule, attendance, evaluations, tuitionPayments, notifications] =
    await Promise.all([
      scoreService.getStudentSubjectAverages(childId, 1, sy),
      scoreService.getStudentSubjectAverages(childId, 2, sy),
      Schedule.findAll({
        where: { class_id: student.class_id, school_year: sy },
        include: [{ model: Subject, as: 'subject', attributes: ['name'] }],
        order: [['day_of_week', 'ASC'], ['session', 'ASC'], ['period', 'ASC']],
        limit: 40,
      }),
      Attendance.findAll({
        where: { student_id: childId },
        order: [['attendance_date', 'DESC']],
        limit: 20,
        attributes: ['attendance_date', 'status', 'note'],
      }),
      Evaluation.findAll({
        where: { student_id: childId, school_year: sy },
        include: [{ model: Subject, as: 'subject', attributes: ['name'] }],
        order: [['id', 'DESC']],
        limit: 10,
      }),
      TuitionPayment.findAll({
        where: { student_id: childId },
        include: [{ model: Tuition, as: 'tuition', attributes: ['semester', 'school_year', 'amount', 'due_date', 'description'] }],
        limit: 6,
      }),
      Notification.findAll({
        where: { user_id: student.user_id },
        order: [['id', 'DESC']],
        limit: 8,
        attributes: ['title', 'body', 'type', 'is_read', 'created_at'],
      }),
    ]);

  const absentCount = attendance.filter((a) => a.status === 'absent').length;

  return {
    student: {
      id: student.id,
      code: student.student_code,
      name: student.user?.full_name,
      class: student.class?.name,
      grade_level: student.class?.grade_level,
      school_year: sy,
    },
    scores: {
      semester_1: scoresHk1.map((s) => ({ subject: s.subject_name, average: s.average, grade: s.grade })),
      semester_2: scoresHk2.map((s) => ({ subject: s.subject_name, average: s.average, grade: s.grade })),
    },
    schedule: schedule.map((s) => ({
      day: s.day_of_week,
      period: s.period,
      subject: s.subject?.name,
      session: s.session,
    })),
    attendance: {
      recent_absent_days: absentCount,
      recent: attendance.slice(0, 8).map((a) => ({
        date: a.attendance_date,
        status: a.status,
      })),
    },
    extracurricular: (student.activities || []).map((a) => a.name),
    evaluations: evaluations.map((e) => ({
      type: e.type,
      subject: e.subject?.name,
      semester: e.semester,
      content: (e.content || '').slice(0, 200),
      conduct_grade: e.conduct_grade,
    })),
    tuition: tuitionPayments.map((p) => ({
      semester: p.tuition?.semester,
      amount: Number(p.tuition?.amount || 0),
      paid: Number(p.amount_paid || 0),
      status: p.status,
      due_date: p.tuition?.due_date,
    })),
    notifications: notifications.map((n) => ({
      title: n.title,
      type: n.type,
      read: n.is_read,
    })),
  };
};

const snapshotToText = (snap) => JSON.stringify(snap, null, 0);

module.exports = { buildStudentSnapshot, snapshotToText };
