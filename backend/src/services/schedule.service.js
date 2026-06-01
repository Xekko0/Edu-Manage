/**
 * Schedule service — trùng lịch (cảnh báo đỏ), phân công, auto xếp lịch.
 */
const { Op } = require('sequelize');
const { Schedule, TeacherAssignment, Class } = require('../models');

const MAX_PERIODS_PER_WEEK = parseInt(process.env.TEACHER_MAX_PERIODS_WEEK, 10) || 20;
const SCHEDULE_DAYS = [1, 2, 3, 4, 5, 6, 7];
const SCHEDULE_SESSIONS = ['morning', 'afternoon'];
const PERIODS_PER_SESSION = 5;

const slotWhere = ({
  class_id, teacher_id, day_of_week, session, period, school_year, excludeId,
}) => {
  const base = { day_of_week, session, period, school_year };
  if (excludeId) base.id = { [Op.ne]: excludeId };
  return base;
};

/** Phát hiện trùng (không chặn lưu — chỉ để annotate). */
const findConflicts = async ({
  class_id, teacher_id, day_of_week, session, period, school_year, room, excludeId,
}) => {
  const conflicts = [];
  const others = await Schedule.findAll({
    where: {
      school_year,
      ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
    },
    attributes: ['id', 'class_id', 'teacher_id', 'day_of_week', 'session', 'period', 'room'],
  });

  const sameClassSlot = others.filter(
    (s) => Number(s.class_id) === Number(class_id)
      && s.day_of_week === day_of_week
      && s.session === session
      && s.period === period,
  );
  if (sameClassSlot.length > 0) {
    conflicts.push({ type: 'class', message: 'Lớp đã có tiết khác tại ô này' });
  }

  const sameTeacherSlot = others.filter(
    (s) => Number(s.teacher_id) === Number(teacher_id)
      && s.day_of_week === day_of_week
      && s.session === session
      && s.period === period,
  );
  if (sameTeacherSlot.length > 0) {
    conflicts.push({ type: 'teacher', message: 'Giáo viên đã dạy tiết khác cùng khung giờ' });
  }

  if (room && String(room).trim()) {
    const roomTrim = String(room).trim();
    const sameRoom = others.filter(
      (s) => s.room === roomTrim
        && s.day_of_week === day_of_week
        && s.session === session
        && s.period === period,
    );
    if (sameRoom.length > 0) {
      conflicts.push({ type: 'room', message: 'Phòng đã được sử dụng' });
    }
  }

  const teacherTotal = others.filter((s) => Number(s.teacher_id) === Number(teacher_id)).length
    + (excludeId ? 0 : 1);
  if (teacherTotal > MAX_PERIODS_PER_WEEK) {
    conflicts.push({
      type: 'weekly_limit',
      message: `Vượt giới hạn ${MAX_PERIODS_PER_WEEK} tiết/tuần`,
    });
  }

  return conflicts;
};

const assertTeacherAssignment = async (teacher_id, class_id, subject_id) => {
  const row = await TeacherAssignment.findOne({
    where: { teacher_id, class_id, subject_id, is_active: true },
  });
  if (!row) {
    const err = new Error('Giáo viên chưa được phân công dạy môn này tại lớp');
    err.status = 400;
    throw err;
  }
  return row;
};

const assertTeacherClassAccess = async (teacherId, classId) => {
  const cls = await Class.findByPk(classId, { attributes: ['id', 'homeroom_teacher_id'] });
  if (!cls) {
    const err = new Error('Không tìm thấy lớp');
    err.status = 404;
    throw err;
  }
  if (Number(cls.homeroom_teacher_id) === Number(teacherId)) return cls;

  const assigned = await TeacherAssignment.findOne({
    where: { teacher_id: teacherId, class_id: classId, is_active: true },
  });
  if (!assigned) {
    const err = new Error('Bạn không có quyền với thời khóa biểu lớp này');
    err.status = 403;
    throw err;
  }
  return cls;
};

/** Gắn conflictTypes — không chặn thao tác. */
const annotateConflicts = async (items, school_year) => {
  if (!items?.length) return [];

  const sy = school_year || items[0].school_year;
  const allInYear = await Schedule.findAll({
    where: { school_year: sy },
    attributes: ['id', 'class_id', 'teacher_id', 'day_of_week', 'session', 'period', 'room'],
  });

  const byClassSlot = new Map();
  const byTeacherSlot = new Map();
  const byRoomSlot = new Map();
  const teacherWeekCount = new Map();

  for (const s of allInYear) {
    const key = `${s.day_of_week}|${s.session}|${s.period}`;
    const ck = `${s.class_id}|${key}`;
    const tk = `${s.teacher_id}|${key}`;
    if (!byClassSlot.has(ck)) byClassSlot.set(ck, []);
    byClassSlot.get(ck).push(s.id);
    if (!byTeacherSlot.has(tk)) byTeacherSlot.set(tk, []);
    byTeacherSlot.get(tk).push(s.id);
    teacherWeekCount.set(s.teacher_id, (teacherWeekCount.get(s.teacher_id) || 0) + 1);
    if (s.room) {
      const rk = `${s.room}|${key}`;
      if (!byRoomSlot.has(rk)) byRoomSlot.set(rk, []);
      byRoomSlot.get(rk).push(s.id);
    }
  }

  return items.map((item) => {
    const raw = item.toJSON ? item.toJSON() : item;
    const key = `${raw.day_of_week}|${raw.session}|${raw.period}`;
    const types = [];
    const ck = `${raw.class_id}|${key}`;
    const tk = `${raw.teacher_id}|${key}`;
    if ((byClassSlot.get(ck) || []).length > 1) types.push('class');
    if ((byTeacherSlot.get(tk) || []).length > 1) types.push('teacher');
    if (raw.room) {
      const rk = `${raw.room}|${key}`;
      if ((byRoomSlot.get(rk) || []).length > 1) types.push('room');
    }
    if ((teacherWeekCount.get(raw.teacher_id) || 0) > MAX_PERIODS_PER_WEEK) {
      types.push('weekly_limit');
    }
    return { ...raw, conflictTypes: types };
  });
};

/** Tự động xếp lịch lớp: phân bổ phân công vào ô trống, tránh trùng GV nếu có thể. */
const autoArrangeClass = async ({ class_id, school_year, clearExisting = false }) => {
  const cls = await Class.findByPk(class_id);
  if (!cls) {
    const err = new Error('Không tìm thấy lớp');
    err.status = 404;
    throw err;
  }

  if (clearExisting) {
    await Schedule.destroy({ where: { class_id, school_year } });
  }

  const assignments = await TeacherAssignment.findAll({
    where: { class_id, school_year, is_active: true },
  });
  if (!assignments.length) {
    const err = new Error('Lớp chưa có phân công giáo viên');
    err.status = 400;
    throw err;
  }

  const existing = await Schedule.findAll({ where: { school_year } });
  const teacherBusy = new Set(
    existing.map((s) => `${s.teacher_id}|${s.day_of_week}|${s.session}|${s.period}`),
  );
  const teacherWeekCount = new Map();
  existing.forEach((s) => {
    teacherWeekCount.set(s.teacher_id, (teacherWeekCount.get(s.teacher_id) || 0) + 1);
  });

  const grid = [];
  for (const sess of SCHEDULE_SESSIONS) {
    for (const d of SCHEDULE_DAYS) {
      for (let p = 1; p <= PERIODS_PER_SESSION; p++) {
        grid.push({ session: sess, day_of_week: d, period: p });
      }
    }
  }

  const created = [];
  let gridIdx = 0;

  for (const asn of assignments) {
    let placed = false;
    for (let attempt = 0; attempt < grid.length; attempt++) {
      const slot = grid[(gridIdx + attempt) % grid.length];
      const tk = `${asn.teacher_id}|${slot.day_of_week}|${slot.session}|${slot.period}`;
      if (teacherBusy.has(tk)) continue;

      const weekCount = teacherWeekCount.get(asn.teacher_id) || 0;
      if (weekCount >= MAX_PERIODS_PER_WEEK) break;

      const row = await Schedule.create({
        class_id,
        subject_id: asn.subject_id,
        teacher_id: asn.teacher_id,
        day_of_week: slot.day_of_week,
        session: slot.session,
        period: slot.period,
        room: `P${cls.name}-${slot.session === 'morning' ? 'S' : 'C'}${slot.period}`,
        school_year,
      });
      teacherBusy.add(tk);
      teacherWeekCount.set(asn.teacher_id, weekCount + 1);
      created.push(row);
      gridIdx = (gridIdx + attempt + 1) % grid.length;
      placed = true;
      break;
    }
    if (!placed) {
      /* bỏ qua môn không tìm được ô (GV bận hoặc vượt giới hạn tuần) */
    }
  }

  return { created: created.length, skipped: assignments.length - created.length, maxPerWeek: MAX_PERIODS_PER_WEEK };
};

module.exports = {
  findConflicts,
  assertTeacherAssignment,
  assertTeacherClassAccess,
  annotateConflicts,
  autoArrangeClass,
  MAX_PERIODS_PER_WEEK,
  SCHEDULE_DAYS,
};
