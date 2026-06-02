/**
 * Gom dữ liệu phạm vi GV/Admin cho AI.
 */
const env = require('../../config/env');
const scoreService = require('../score.service');
const { getStaffCapabilities, formatFeaturesText } = require('./staff-capabilities');
const {
  Student, User, Class, Schedule, Subject, Attendance,
  TeacherAssignment, Tuition, Evaluation,
} = require('../../models');
const { Op } = require('sequelize');

const schoolYear = () => env.CURRENT_SCHOOL_YEAR;

/** Xếp hạng TB lớp — dùng chung, tránh lặp N+1 ở router. */
const getClassScoreRows = async (classId, semester = 1) => {
  const sy = schoolYear();
  const students = await Student.findAll({
    where: { class_id: classId, is_active: true },
    attributes: ['id', 'student_code'],
    include: [{ model: User, as: 'user', attributes: ['full_name'] }],
  });
  const rows = await Promise.all(
    students.map(async (s) => {
      const avgs = await scoreService.getStudentSubjectAverages(s.id, semester, sy);
      return {
        student_id: s.id,
        student_code: s.student_code,
        name: s.user?.full_name,
        overall: scoreService.getOverallAverage(avgs),
        subjects: avgs,
      };
    }),
  );
  return rows.sort((a, b) => b.overall - a.overall);
};

const buildStaffSnapshot = async (ctx) => {
  const caps = getStaffCapabilities(ctx.user_role, {
    persona: ctx.persona,
    isHomeroom: ctx.is_homeroom,
  });
  const base = {
    staff: {
      name: ctx.user_name,
      role: ctx.user_role,
      persona: ctx.persona || caps.persona,
      role_label: caps.role_label,
      school_year: ctx.school_year,
    },
    homeroom_classes: ctx.homeroom_classes?.map((c) => c.name) || [],
    teaching: ctx.assignments || [],
    accessible_classes: ctx.accessible_classes?.map((c) => ({ id: c.id, name: c.name })) || [],
    active_class: null,
    class_detail: null,
    school_stats: null,
  };

  if (ctx.user_role === 'admin') {
    const [classCount, studentCount, teacherCount, assignmentCount] = await Promise.all([
      Class.count({ where: { is_active: true } }),
      Student.count({ where: { is_active: true } }),
      User.count({ where: { role: 'subject', is_active: true } }),
      TeacherAssignment.count({ where: { school_year: schoolYear(), is_active: true } }),
    ]);
    base.school_stats = { classes: classCount, students: studentCount, teachers: teacherCount, assignments: assignmentCount };
  }

  if (ctx.active_class_id) {
    const cls = await Class.findByPk(ctx.active_class_id, {
      include: [{ model: User, as: 'homeroomTeacher', attributes: ['full_name'] }],
    });
    const students = await Student.findAll({
      where: { class_id: ctx.active_class_id, is_active: true },
      include: [{ model: User, as: 'user', attributes: ['full_name'] }],
      limit: 50,
    });

    const sem = 1;
    const scoreRows = await getClassScoreRows(ctx.active_class_id, sem);
    const scoreSummaries = scoreRows.slice(0, 15).map((r) => ({
      code: r.student_code,
      name: r.name,
      overall: r.overall,
      weak_subject: [...(r.subjects || [])].sort((a, b) => a.average - b.average)[0]?.subject_name,
    }));

    const recentAttendance = await Attendance.findAll({
      where: { student_id: { [Op.in]: students.map((s) => s.id) } },
      order: [['attendance_date', 'DESC']],
      limit: 15,
      attributes: ['student_id', 'attendance_date', 'status'],
    });

    const scheduleRows = await Schedule.findAll({
      where: { class_id: ctx.active_class_id, school_year: schoolYear() },
      include: [{ model: Subject, as: 'subject', attributes: ['name'] }],
      order: [['day_of_week', 'ASC'], ['session', 'ASC'], ['period', 'ASC']],
      limit: 40,
    });

    base.active_class = { id: cls?.id, name: cls?.name, homeroom: cls?.homeroomTeacher?.full_name };
    base.class_detail = {
      student_count: students.length,
      students: students.slice(0, 20).map((s) => ({
        id: s.id,
        code: s.student_code,
        name: s.user?.full_name,
      })),
      score_overview_hk1: scoreSummaries.sort((a, b) => b.overall - a.overall),
      recent_absences: recentAttendance.filter((a) => a.status === 'absent').length,
      schedule: scheduleRows.map((row) => ({
        teacher_id: row.teacher_id,
        day: row.day_of_week,
        period: row.period,
        session: row.session,
        subject: row.subject?.name,
        room: row.room,
      })),
    };
  }

  return base;
};

const snapshotToText = (snap) => JSON.stringify(snap);

module.exports = { buildStaffSnapshot, snapshotToText, formatFeaturesText, getClassScoreRows };
