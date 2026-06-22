/**
 * Schedule service — TKB: cấu hình khung giờ, sinh từ phân công, xếp lại, kiểm tra.
 */
const { Op } = require('sequelize');
const {
  Schedule, TeacherAssignment, Class, TimetableConfig, Subject, User, Room,
} = require('../models');
const scheduling = require('./scheduling');
const {
  DEFAULT_TIMETABLE,
  parseDaysOfWeek,
  normalizeTimetableConfig,
  buildSlotOrder,
  countGridSlots,
  capSessionPeriods,
  createBusyState,
  loadBusyFromSchedules,
  isSlotFree,
  occupySlot,
  releaseSlot,
  slotEquals,
  slotKey,
  sortSlotsByClassDayLoad,
  collectCurriculumMismatches,
  syncAssignmentsFromCurriculum,
  computeGdptWeeklyWarning,
  buildCurriculumStandardMap,
  resolveRequiredPeriods,
  pickRoomForSlot,
  resolvePreferredRoomType,
  detectHardViolationsFromSchedules,
  summarizeViolations,
  MAX_PERIODS_PER_WEEK,
  MAX_PERIODS_PER_SESSION,
  MAX_PERIODS_PER_DAY_CLASS,
  PROGRAM_COMPONENT_ORDER,
  parseArrangeSemester,
  SEMESTER_HK1,
  whereAssignmentForSemester,
  whereScheduleForArrangeClear,
  scheduleSemesterForRow,
  solveSchoolSchedule,
} = scheduling;

const SCHEDULE_DAYS = [1, 2, 3, 4, 5, 6, 7];

/** Dọn TKB soft-delete cũ (trước khi Schedule tắt paranoid) — tránh unique index chặn ô trống. */
const purgeGhostSchedules = async () => {
  const [result] = await Schedule.sequelize.query(
    'DELETE FROM schedules WHERE deleted_at IS NOT NULL',
  );
  const dialect = Schedule.sequelize.getDialect();
  const removed = dialect === 'sqlite' ? (result?.changes ?? 0) : (result?.rowCount ?? 0);
  if (removed > 0) {
    console.log(`[Schedule] Đã xóa ${removed} tiết TKB “ma” (soft-delete cũ)`);
  }
  return removed;
};

const ensureTimetableConfigTable = async () => {
  try {
    await TimetableConfig.sync();
  } catch (err) {
    const msg = err?.message || '';
    if (!msg.includes('already exists')) throw err;
  }
};

const getTimetableConfig = async (school_year) => {
  try {
    let row = await TimetableConfig.findOne({ where: { school_year } });
    if (!row) {
      row = await TimetableConfig.create({
        school_year,
        ...DEFAULT_TIMETABLE,
      });
    }
    return normalizeTimetableConfig(row.toJSON ? row.toJSON() : row);
  } catch (err) {
    if (err?.message?.includes('no such table')) {
      await ensureTimetableConfigTable();
      return getTimetableConfig(school_year);
    }
    throw err;
  }
};

const upsertTimetableConfig = async (school_year, patch) => {
  const days = patch.days_of_week !== undefined ? parseDaysOfWeek(patch.days_of_week) : undefined;
  if (days && !days.length) {
    const err = new Error('Chọn ít nhất một ngày trong tuần');
    err.status = 400;
    throw err;
  }
  const clampPeriods = (v) => {
    const n = parseInt(v, 10);
    if (Number.isNaN(n)) return undefined;
    return capSessionPeriods(n);
  };
  const morning = patch.morning_periods !== undefined
    ? clampPeriods(patch.morning_periods)
    : undefined;
  const afternoon = patch.afternoon_periods !== undefined
    ? clampPeriods(patch.afternoon_periods)
    : undefined;

  let row = await TimetableConfig.findOne({ where: { school_year } });
  const payload = {
    ...(days ? { days_of_week: days } : {}),
    ...(morning !== undefined ? { morning_periods: morning } : {}),
    ...(afternoon !== undefined ? { afternoon_periods: afternoon } : {}),
    ...(patch.afternoon_enabled !== undefined
      ? { afternoon_enabled: !!patch.afternoon_enabled }
      : {}),
    ...(patch.period_duration_minutes !== undefined
      ? { period_duration_minutes: Math.max(30, parseInt(patch.period_duration_minutes, 10) || 45) }
      : {}),
    ...(patch.semester1_start !== undefined ? { semester1_start: patch.semester1_start || null } : {}),
    ...(patch.semester1_end !== undefined ? { semester1_end: patch.semester1_end || null } : {}),
    ...(patch.semester2_start !== undefined ? { semester2_start: patch.semester2_start || null } : {}),
    ...(patch.semester2_end !== undefined ? { semester2_end: patch.semester2_end || null } : {}),
    ...(patch.holidays !== undefined ? { holidays: patch.holidays } : {}),
    ...(patch.morning_break_after_period !== undefined
      ? { morning_break_after_period: Math.min(4, Math.max(1, parseInt(patch.morning_break_after_period, 10) || 2)) }
      : {}),
    ...(patch.morning_break_minutes !== undefined
      ? { morning_break_minutes: Math.max(5, parseInt(patch.morning_break_minutes, 10) || 20) }
      : {}),
    ...(patch.afternoon_break_after_period !== undefined
      ? {
        afternoon_break_after_period: patch.afternoon_break_after_period === ''
          || patch.afternoon_break_after_period == null
          ? null
          : Math.min(4, Math.max(1, parseInt(patch.afternoon_break_after_period, 10) || 2)),
      }
      : {}),
    ...(patch.afternoon_break_minutes !== undefined
      ? { afternoon_break_minutes: Math.max(5, parseInt(patch.afternoon_break_minutes, 10) || 20) }
      : {}),
  };

  try {
    if (!row) {
      row = await TimetableConfig.create({ school_year, ...DEFAULT_TIMETABLE, ...payload });
    } else {
      await row.update(payload);
      await row.reload();
    }
    return normalizeTimetableConfig(row.toJSON ? row.toJSON() : row);
  } catch (err) {
    if (err?.message?.includes('no such table')) {
      await ensureTimetableConfigTable();
      return upsertTimetableConfig(school_year, patch);
    }
    throw err;
  }
};

const assertHardSlotFree = async ({
  class_id, teacher_id, day_of_week, session, period, school_year, semester, excludeId, room,
}) => {
  const base = {
    school_year,
    day_of_week,
    session,
    period,
    ...(semester != null ? { semester } : {}),
    ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
  };

  const classConflict = await Schedule.findOne({ where: { ...base, class_id } });
  if (classConflict) {
    const err = new Error('Ô lớp này đã có tiết học');
    err.status = 400;
    err.code = 'CLASS_SLOT_TAKEN';
    throw err;
  }

  const teacherConflict = await Schedule.findOne({ where: { ...base, teacher_id } });
  if (teacherConflict) {
    const err = new Error('Giáo viên đã có tiết dạy trùng khung giờ (có thể ở lớp khác)');
    err.status = 400;
    err.code = 'TEACHER_SLOT_TAKEN';
    throw err;
  }

  if (room && String(room).trim()) {
    const roomTrim = String(room).trim();
    const roomConflict = await Schedule.findOne({
      where: {
        ...base,
        room: roomTrim,
      },
    });
    if (roomConflict) {
      const err = new Error('Phòng đã được sử dụng tại khung giờ này');
      err.status = 400;
      err.code = 'ROOM_SLOT_TAKEN';
      throw err;
    }
  }

  const dayWhere = {
    school_year,
    class_id,
    day_of_week,
    ...(semester != null ? { semester } : {}),
    ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
  };
  const dayCount = await Schedule.count({ where: dayWhere });
  if (dayCount >= MAX_PERIODS_PER_DAY_CLASS) {
    const err = new Error(
      `Lớp đã đạt tối đa ${MAX_PERIODS_PER_DAY_CLASS} tiết/ngày (GDPT 2018)`,
    );
    err.status = 400;
    err.code = 'DAILY_LIMIT';
    throw err;
  }
};

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
  const classDayCount = new Map();

  for (const s of allInYear) {
    const key = slotKey(s.day_of_week, s.session, s.period);
    const ck = `${s.class_id}|${key}`;
    const tk = `${s.teacher_id}|${key}`;
    if (!byClassSlot.has(ck)) byClassSlot.set(ck, []);
    byClassSlot.get(ck).push(s.id);
    if (!byTeacherSlot.has(tk)) byTeacherSlot.set(tk, []);
    byTeacherSlot.get(tk).push(s.id);
    teacherWeekCount.set(s.teacher_id, (teacherWeekCount.get(s.teacher_id) || 0) + 1);
    const dk = `${s.class_id}|${s.day_of_week}`;
    classDayCount.set(dk, (classDayCount.get(dk) || 0) + 1);
    if (s.room) {
      const rk = `${s.room}|${key}`;
      if (!byRoomSlot.has(rk)) byRoomSlot.set(rk, []);
      byRoomSlot.get(rk).push(s.id);
    }
  }

  return items.map((item) => {
    const raw = item.toJSON ? item.toJSON() : item;
    const key = slotKey(raw.day_of_week, raw.session, raw.period);
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
    const dk = `${raw.class_id}|${raw.day_of_week}`;
    if ((classDayCount.get(dk) || 0) > MAX_PERIODS_PER_DAY_CLASS) {
      types.push('daily_limit');
    }
    return { ...raw, conflictTypes: types };
  });
};

const sortAssignmentsByProgram = (assignments) => {
  const list = [...assignments];
  list.sort((a, b) => {
    const compA = a.subject?.program_component || 'elective';
    const compB = b.subject?.program_component || 'elective';
    const oa = PROGRAM_COMPONENT_ORDER[compA] ?? 99;
    const ob = PROGRAM_COMPONENT_ORDER[compB] ?? 99;
    if (oa !== ob) return oa - ob;
    return (b.periods_per_week || 0) - (a.periods_per_week || 0);
  });
  return list;
};

const placeAssignmentSlots = async ({
  assignment,
  classId,
  className,
  schoolYear,
  arrangeSemester,
  busy,
  slotOrder,
  alreadyPlaced = 0,
  periodsPerWeek,
}) => {
  const periods = Math.max(1, periodsPerWeek ?? (assignment.periods_per_week || 2));
  const need = Math.max(0, periods - alreadyPlaced);
  const created = [];
  const failures = [];
  let placed = 0;

  const preferredRoomType = await resolvePreferredRoomType(assignment.subject_id);
  const orderedSlots = sortSlotsByClassDayLoad(slotOrder, busy, classId);
  const programComponent = assignment.subject?.program_component || null;

  for (let i = 0; i < need; i++) {
    let found = null;
    let roomPick = null;
    for (const slot of orderedSlots) {
      const candidateRoom = await pickRoomForSlot({
        busy,
        slot,
        classId,
        teacherId: assignment.teacher_id,
        className,
        subjectId: assignment.subject_id,
        preferredRoomType,
      });
      if (isSlotFree(busy, classId, assignment.teacher_id, slot, candidateRoom.roomName)) {
        found = slot;
        roomPick = candidateRoom;
        break;
      }
    }
    if (!found) {
      failures.push({
        assignment_id: assignment.id,
        subject_id: assignment.subject_id,
        teacher_id: assignment.teacher_id,
        reason: 'Không còn ô trống (lớp/GV/phòng/tuần)',
      });
      break;
    }

    const row = await Schedule.create({
      class_id: classId,
      subject_id: assignment.subject_id,
      teacher_id: assignment.teacher_id,
      day_of_week: found.day_of_week,
      session: found.session,
      period: found.period,
      room: roomPick.roomName,
      room_id: roomPick.roomId,
      school_year: schoolYear,
      semester: scheduleSemesterForRow(assignment.semester, arrangeSemester),
      program_component: programComponent,
    });
    occupySlot(busy, classId, assignment.teacher_id, found, roomPick.roomName, {
      subjectId: assignment.subject_id,
      roomId: roomPick.roomId,
      roomType: roomPick.roomType,
    });
    created.push(row);
    placed += 1;
  }

  return { created, placed, failures, periodsRequested: need };
};

const relocateConflictingSchedules = async ({
  school_year,
  class_id = null,
  repackAll = false,
  busy: externalBusy = null,
  timetableConfig = null,
}) => {
  const config = timetableConfig || await getTimetableConfig(school_year);
  const slotOrder = buildSlotOrder(config);
  const allRows = await Schedule.findAll({ where: { school_year }, order: [['id', 'ASC']] });
  const countBefore = allRows.length;

  let rowsToMove;
  const busy = externalBusy || createBusyState();

  if (repackAll) {
    rowsToMove = class_id
      ? allRows.filter((r) => Number(r.class_id) === Number(class_id))
      : [...allRows];
    const anchor = class_id
      ? allRows.filter((r) => Number(r.class_id) !== Number(class_id))
      : [];
    if (!externalBusy) loadBusyFromSchedules(anchor, busy);
    rowsToMove.sort((a, b) => a.id - b.id);
  } else {
    const scopeForAnnotate = class_id
      ? allRows.filter((r) => Number(r.class_id) === Number(class_id))
      : allRows;
    const annotated = await annotateConflicts(scopeForAnnotate, school_year);
    const conflictedIds = new Set(
      annotated.filter((i) => i.conflictTypes?.length > 0).map((i) => i.id),
    );
    rowsToMove = allRows
      .filter((r) => conflictedIds.has(r.id))
      .sort((a, b) => a.id - b.id);
    if (!externalBusy) {
      loadBusyFromSchedules(allRows.filter((r) => !conflictedIds.has(r.id)), busy);
    }
  }

  let moved = 0;
  const failures = [];

  for (const s of rowsToMove) {
    const current = {
      day_of_week: s.day_of_week,
      session: s.session,
      period: s.period,
    };

    const slotRoom = s.room || null;
    if (!repackAll && isSlotFree(busy, s.class_id, s.teacher_id, current, slotRoom)) {
      occupySlot(busy, s.class_id, s.teacher_id, current, slotRoom);
      continue;
    }

    let target = null;
    for (const candidate of slotOrder) {
      if (isSlotFree(busy, s.class_id, s.teacher_id, candidate, slotRoom)) {
        target = candidate;
        break;
      }
    }

    if (!target) {
      failures.push({ schedule_id: s.id, reason: 'Không còn ô trống (lớp/GV/phòng/tuần)' });
      occupySlot(busy, s.class_id, s.teacher_id, current, slotRoom);
      continue;
    }

    releaseSlot(busy, s.class_id, s.teacher_id, current, slotRoom);
    await Schedule.update(
      {
        day_of_week: target.day_of_week,
        session: target.session,
        period: target.period,
      },
      { where: { id: s.id } },
    );
    occupySlot(busy, s.class_id, s.teacher_id, target, slotRoom);
    if (!slotEquals(current, target)) moved += 1;
  }

  const countAfter = await Schedule.count({ where: { school_year } });

  return {
    mode: repackAll ? 'repack' : 'resolve',
    moved,
    skipped: failures.length,
    failures,
    schedules_before: countBefore,
    schedules_after: countAfter,
  };
};

const sumRequiredPeriodsForClass = (assignments, classRow, standardMap, arrangeSemester) =>
  assignments.reduce((s, a) => {
    const { required } = resolveRequiredPeriods(
      { ...(a.toJSON ? a.toJSON() : a), class: classRow },
      standardMap,
      arrangeSemester,
    );
    return s + required;
  }, 0);

const runSolver = async ({
  school_year,
  semester,
  class_ids = null,
  clearExisting = true,
  runHillClimb = true,
}) => {
  const config = await getTimetableConfig(school_year);
  return solveSchoolSchedule({
    school_year,
    semester,
    class_ids,
    timetableConfig: config,
    clearExisting,
    runHillClimb,
  });
};

const generateClassSchedule = async ({
  class_id,
  school_year,
  semester: semesterInput,
  clearExisting = true,
  busy: externalBusy = null,
}) => {
  if (externalBusy) {
    const arrangeSemester = semesterInput != null && semesterInput !== ''
      ? parseArrangeSemester(semesterInput)
      : SEMESTER_HK1;
    const cls = await Class.findByPk(class_id);
    if (!cls) {
      const err = new Error('Không tìm thấy lớp');
      err.status = 404;
      throw err;
    }
    const config = await getTimetableConfig(school_year);
    const slotOrder = buildSlotOrder(config);
    const assignmentsRaw = await TeacherAssignment.findAll({
      where: { class_id, school_year, is_active: true, ...whereAssignmentForSemester(arrangeSemester) },
      include: [{ model: Subject, as: 'subject', attributes: ['id', 'code', 'name', 'program_component'] }],
    });
    const assignments = sortAssignmentsByProgram(assignmentsRaw);
    const standardMap = await buildCurriculumStandardMap(school_year, arrangeSemester);
    const allCreated = [];
    const allFailures = [];
    let totalPlaced = 0;
    let totalRequested = 0;
    for (const asn of assignments) {
      const { required: periodsPerWeek } = resolveRequiredPeriods(
        { ...(asn.toJSON ? asn.toJSON() : asn), class: cls },
        standardMap,
        arrangeSemester,
      );
      const result = await placeAssignmentSlots({
        assignment: asn,
        classId: class_id,
        className: cls.name,
        schoolYear: school_year,
        arrangeSemester,
        busy: externalBusy,
        slotOrder,
        periodsPerWeek,
        alreadyPlaced: 0,
      });
      allCreated.push(...result.created);
      allFailures.push(...result.failures);
      totalPlaced += result.placed;
      totalRequested += result.periodsRequested;
    }
    return {
      mode: 'generate',
      semester: arrangeSemester,
      class_id,
      class_name: cls.name,
      created: allCreated.length,
      moved: 0,
      periods_placed: totalPlaced,
      periods_requested: totalRequested,
      missing_periods: totalRequested - totalPlaced,
      skipped: totalRequested - totalPlaced,
      failures: allFailures,
      grid_slots: countGridSlots(config),
      maxPerWeek: MAX_PERIODS_PER_WEEK,
    };
  }

  const result = await runSolver({
    school_year,
    semester: semesterInput,
    class_ids: [class_id],
    clearExisting,
  });
  const cls = await Class.findByPk(class_id);
  return {
    ...result,
    mode: 'generate',
    class_id,
    class_name: cls?.name,
    moved: 0,
    skipped: result.missing_periods,
    maxPerWeek: MAX_PERIODS_PER_WEEK,
  };
};

/**
 * Tự động xếp lịch lớp: đồng bộ phân công theo khung CT, xóa hết tiết lớp, sinh lại, kiểm tra ràng buộc cứng.
 */
const autoArrangeClassSchedule = async ({ class_id, school_year, semester }) => {
  const arrangeSemester = parseArrangeSemester(semester);
  const curriculum_sync = await syncAssignmentsFromCurriculum(school_year, arrangeSemester);

  const result = await runSolver({
    school_year,
    semester: arrangeSemester,
    class_ids: [class_id],
    clearExisting: true,
  });

  const postVal = await getScheduleValidation({ school_year, class_id, semester: arrangeSemester });
  if (!result.hard_ok || !postVal.hard_ok) {
    const err = new Error(
      postVal.total_missing > 0 || result.missing_periods > 0
        ? `Không xếp đủ tiết (còn thiếu ${postVal.total_missing || result.missing_periods}) — thử mở rộng khung giờ hoặc giảm tải GV`
        : 'Sau xếp lịch vẫn còn vi phạm ràng buộc cứng (trùng lịch / khung CT)',
    );
    err.status = 400;
    err.code = 'POST_ARRANGE_HARD_FAIL';
    err.validation = postVal;
    err.curriculum_sync = curriculum_sync;
    err.solver_result = result;
    throw err;
  }

  return {
    mode: 'auto_arrange',
    curriculum_sync,
    ...result,
    class_id,
    validation: postVal,
    hard_ok: true,
  };
};

const autoArrangeSchoolSchedule = async ({
  school_year,
  semester,
  class_ids = null,
}) => {
  const arrangeSemester = parseArrangeSemester(semester);
  const curriculum_sync = await syncAssignmentsFromCurriculum(school_year, arrangeSemester);

  const result = await runSolver({
    school_year,
    semester: arrangeSemester,
    class_ids,
    clearExisting: true,
  });

  const postVal = await getSchoolScheduleValidation({ school_year });
  if (!result.hard_ok || !postVal.hard_ok) {
    const err = new Error(
      result.missing_periods > 0
        ? `Không xếp đủ tiết toàn trường (còn thiếu ${result.missing_periods})`
        : 'Sau xếp toàn trường vẫn còn vi phạm ràng buộc cứng',
    );
    err.status = 400;
    err.code = 'POST_ARRANGE_SCHOOL_FAIL';
    err.validation = postVal;
    err.curriculum_sync = curriculum_sync;
    err.solver_result = result;
    throw err;
  }

  return {
    mode: 'auto_arrange_school',
    curriculum_sync,
    ...result,
    validation: postVal,
    hard_ok: true,
  };
};

const generateSchoolSchedule = async ({
  school_year,
  semester: semesterInput,
  class_ids = null,
  clearExisting = true,
}) => {
  const config = await getTimetableConfig(school_year);
  const result = await runSolver({
    school_year,
    semester: semesterInput ?? SEMESTER_HK1,
    class_ids,
    clearExisting,
  });
  return {
    ...result,
    mode: 'generate',
    school_year,
    total_created: result.created,
    moved: 0,
    timetable: config,
    maxPerWeek: MAX_PERIODS_PER_WEEK,
  };
};

const repackClassSchedule = async ({ class_id, school_year, busy: externalBusy = null }) => {
  const cls = await Class.findByPk(class_id);
  if (!cls) {
    const err = new Error('Không tìm thấy lớp');
    err.status = 404;
    throw err;
  }

  const count = await Schedule.count({ where: { class_id, school_year } });
  if (!count) {
    const err = new Error('Lớp chưa có tiết — hãy sinh TKB từ phân công trước');
    err.status = 400;
    throw err;
  }

  const config = await getTimetableConfig(school_year);
  const result = await relocateConflictingSchedules({
    school_year,
    class_id,
    repackAll: true,
    busy: externalBusy,
    timetableConfig: config,
  });

  return {
    mode: 'repack',
    class_id,
    class_name: cls.name,
    moved: result.moved,
    created: 0,
    skipped: result.skipped,
    failures: result.failures,
    schedules_before: result.schedules_before,
    schedules_after: result.schedules_after,
    maxPerWeek: MAX_PERIODS_PER_WEEK,
  };
};

const repackSchoolSchedule = async ({ school_year, class_ids = null }) => {
  const countBefore = await Schedule.count({ where: { school_year } });
  if (!countBefore) {
    const err = new Error('Chưa có TKB — hãy sinh TKB từ phân công trước');
    err.status = 400;
    throw err;
  }

  const config = await getTimetableConfig(school_year);
  const busy = createBusyState();
  let totalMoved = 0;
  const byClass = [];

  const classWhere = { school_year, is_active: true };
  if (class_ids?.length) {
    classWhere.id = { [Op.in]: class_ids.map((id) => parseInt(id, 10)) };
  }

  const classes = await Class.findAll({
    where: classWhere,
    order: [['grade_level', 'ASC'], ['name', 'ASC']],
  });

  for (const cls of classes) {
    const result = await relocateConflictingSchedules({
      school_year,
      class_id: cls.id,
      repackAll: true,
      busy,
      timetableConfig: config,
    });
    byClass.push({
      class_id: cls.id,
      class_name: cls.name,
      ...result,
      created: 0,
    });
    totalMoved += result.moved;
  }

  return {
    mode: 'repack',
    school_year,
    total_moved: totalMoved,
    moved: totalMoved,
    created: 0,
    by_class: byClass,
    maxPerWeek: MAX_PERIODS_PER_WEEK,
  };
};

const resolveConflictsSchedule = async ({ school_year, class_id = null }) => {
  const config = await getTimetableConfig(school_year);
  const result = await relocateConflictingSchedules({
    school_year,
    class_id,
    repackAll: false,
    timetableConfig: config,
  });
  return { mode: 'resolve', ...result, created: 0 };
};

const getScheduleValidation = async ({ school_year, class_id = null, semester = null }) => {
  const config = await getTimetableConfig(school_year);
  const gridSlots = countGridSlots(config);
  const viewSemester = semester != null && semester !== ''
    ? parseArrangeSemester(semester)
    : null;

  const assignWhere = { school_year, is_active: true };
  if (class_id) assignWhere.class_id = class_id;
  if (viewSemester != null) {
    Object.assign(assignWhere, whereAssignmentForSemester(viewSemester));
  }

  const assignments = await TeacherAssignment.findAll({
    where: assignWhere,
    include: [
      { model: Subject, as: 'subject', attributes: ['id', 'name', 'code', 'program_component'] },
      { model: User, as: 'teacher', attributes: ['id', 'full_name'] },
      { model: Class, as: 'class', attributes: ['id', 'name', 'grade_level'] },
    ],
    order: [['class_id', 'ASC'], ['id', 'ASC']],
  });

  const scheduleWhere = { school_year };
  if (class_id) scheduleWhere.class_id = class_id;
  if (viewSemester != null) {
    scheduleWhere.semester = viewSemester;
  }
  const schedules = await Schedule.findAll({ where: scheduleWhere });

  const placedByKey = new Map();
  for (const s of schedules) {
    const k = `${s.class_id}|${s.subject_id}|${s.teacher_id}|${s.semester}`;
    placedByKey.set(k, (placedByKey.get(k) || 0) + 1);
  }

  const standardMap = await buildCurriculumStandardMap(school_year, viewSemester);

  const rows = assignments.map((a) => {
    const resolved = resolveRequiredPeriods(a, standardMap, viewSemester);
    const {
      required,
      curriculum_required: curriculumRequired,
      assignment_periods: assignmentPeriods,
      curriculum_aligned: curriculumAligned,
      weekly_approximation: weeklyApproximation,
      exact_weekly_periods: exactWeekly,
      total_periods_per_year: totalYear,
    } = resolved;
    const rowSem = scheduleSemesterForRow(a.semester, viewSemester || 1);
    const k = `${a.class_id}|${a.subject_id}|${a.teacher_id}|${rowSem}`;
    const placed = placedByKey.get(k) || 0;
    return {
      assignment_id: a.id,
      semester: rowSem,
      class_id: a.class_id,
      class_name: a.class?.name,
      grade_level: a.class?.grade_level,
      subject_id: a.subject_id,
      subject_name: a.subject?.name,
      program_component: a.subject?.program_component,
      teacher_id: a.teacher_id,
      teacher_name: a.teacher?.full_name,
      required,
      curriculum_required: curriculumRequired,
      assignment_periods: assignmentPeriods,
      curriculum_aligned: curriculumAligned,
      exact_weekly_periods: exactWeekly,
      weekly_approximation: weeklyApproximation,
      total_periods_per_year: totalYear,
      placed,
      missing: Math.max(0, required - placed),
      extra: Math.max(0, placed - required),
    };
  });

  const annotated = await annotateConflicts(schedules, school_year);
  const conflictCount = annotated.filter((i) => i.conflictTypes?.length > 0).length;
  const totalRequired = rows.reduce((s, r) => s + r.required, 0);
  const totalPlaced = schedules.length;
  const totalMissing = rows.reduce((s, r) => s + r.missing, 0);

  const curriculumMismatches = await collectCurriculumMismatches(
    school_year,
    class_id ? [class_id] : null,
    viewSemester,
  );
  const scheduleViolations = detectHardViolationsFromSchedules(schedules, {});
  const hardFromSchedules = [...scheduleViolations, ...curriculumMismatches];
  const summary = summarizeViolations(hardFromSchedules);
  const scheduleSummary = summarizeViolations(scheduleViolations);

  let gdpt_weekly_warning = null;
  const classIds = [...new Set(assignments.map((a) => a.class_id))];
  const warnings = [];
  for (const cid of classIds) {
    const classRows = rows.filter((r) => r.class_id === cid);
    const gradeLevel = classRows[0]?.grade_level;
    const sumWeekly = classRows.reduce((s, r) => s + r.required, 0);
    const w = computeGdptWeeklyWarning(gradeLevel, sumWeekly);
    if (w) {
      warnings.push({
        ...w,
        class_id: cid,
        class_name: classRows[0]?.class_name,
      });
    }
  }
  if (warnings.length === 1 && class_id) gdpt_weekly_warning = warnings[0];
  else if (warnings.length) gdpt_weekly_warning = warnings;

  const weeklyApproxSubjects = rows.filter((r) => r.weekly_approximation);

  return {
    school_year,
    class_id: class_id || null,
    grid_slots: gridSlots,
    total_required: totalRequired,
    total_placed: totalPlaced,
    total_missing: totalMissing,
    conflict_count: conflictCount,
    assignments: rows,
    can_generate: totalRequired <= gridSlots && curriculumMismatches.length === 0,
    hard_ok: scheduleSummary.hard_ok && curriculumMismatches.length === 0,
    schedule_hard_ok: scheduleSummary.hard_ok,
    curriculum_ok: curriculumMismatches.length === 0,
    curriculum_issue_count: curriculumMismatches.length,
    schedule_violations: scheduleViolations,
    hard_violations: hardFromSchedules,
    violation_summary: summary,
    timetable: config,
    max_periods_per_session: MAX_PERIODS_PER_SESSION,
    max_periods_per_day_class: MAX_PERIODS_PER_DAY_CLASS,
    period_duration_minutes: config.period_duration_minutes ?? 45,
    gdpt_weekly_warning,
    weekly_approximation_subjects: weeklyApproxSubjects,
  };
};

const getSchoolScheduleValidation = async ({ school_year }) => {
  const config = await getTimetableConfig(school_year);
  const gridSlots = countGridSlots(config);

  const classValidation = await getScheduleValidation({ school_year, class_id: null });
  const schedules = await Schedule.findAll({ where: { school_year } });
  const curriculumMismatches = await collectCurriculumMismatches(school_year);
  const schedule_violations = detectHardViolationsFromSchedules(schedules, {});
  const hard_violations = [...schedule_violations, ...curriculumMismatches];
  const violation_summary = summarizeViolations(hard_violations);
  const scheduleSummary = summarizeViolations(schedule_violations);

  return {
    ...classValidation,
    grid_slots: gridSlots,
    hard_ok: scheduleSummary.hard_ok && curriculumMismatches.length === 0,
    schedule_hard_ok: scheduleSummary.hard_ok,
    curriculum_ok: curriculumMismatches.length === 0,
    schedule_violations,
    hard_violations,
    violation_summary,
    curriculum_issues: curriculumMismatches,
    max_periods_per_session: MAX_PERIODS_PER_SESSION,
  };
};

const getScheduleReadiness = async ({ school_year, semester }) => {
  const arrangeSemester = parseArrangeSemester(semester);
  const [schoolVal, val, config, rooms, assignCount] = await Promise.all([
    getSchoolScheduleValidation({ school_year }),
    getScheduleValidation({ school_year, class_id: null, semester: arrangeSemester }),
    getTimetableConfig(school_year),
    Room.findAll({ where: { is_active: true }, attributes: ['id', 'room_type'] }),
    TeacherAssignment.count({
      where: { school_year, is_active: true, ...whereAssignmentForSemester(arrangeSemester) },
    }),
  ]);

  const roomsByType = rooms.reduce((acc, r) => {
    const t = r.room_type || 'classroom';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const timetable_configured = Boolean(
    config.days_of_week?.length
    && (config.semester1_start || config.semester2_start),
  );

  const totalRequired = val.total_required || 0;
  const totalPlaced = val.total_placed || 0;

  const steps = [
    {
      id: 'curriculum',
      label: 'Khung chương trình khối',
      ok: schoolVal.curriculum_ok,
      href: '/admin/curriculum',
      detail: schoolVal.curriculum_ok
        ? 'Phân công khớp khung CT'
        : `${schoolVal.curriculum_issues?.length || 0} môn lệch khung CT`,
    },
    {
      id: 'rooms',
      label: 'Phòng học',
      ok: rooms.length > 0,
      href: '/admin/rooms',
      detail: `${rooms.length} phòng active`,
    },
    {
      id: 'assignments',
      label: 'Phân công giáo viên',
      ok: assignCount > 0,
      href: '/admin/assignments',
      detail: `${assignCount} phân công HK${arrangeSemester}`,
    },
    {
      id: 'timetable',
      label: 'Khung giờ & lịch HK',
      ok: timetable_configured,
      href: '/admin/schedules?tab=prepare',
      detail: timetable_configured ? 'Đã cấu hình' : 'Chưa đặt mốc học kỳ / ngày dạy',
    },
    {
      id: 'schedules',
      label: 'Tiết đã xếp',
      ok: totalRequired > 0 && totalPlaced >= totalRequired && schoolVal.hard_ok,
      href: '/admin/schedules?tab=arrange',
      detail: totalRequired > 0
        ? `${totalPlaced}/${totalRequired} tiết (${Math.round((totalPlaced / totalRequired) * 100)}%)`
        : 'Chưa có dữ liệu tiết cần xếp',
    },
  ];

  return {
    school_year,
    semester: arrangeSemester,
    curriculum_ok: schoolVal.curriculum_ok,
    rooms_count: rooms.length,
    rooms_by_type: roomsByType,
    assignments_count: assignCount,
    timetable_configured,
    total_required: totalRequired,
    total_placed: totalPlaced,
    total_missing: val.total_missing || Math.max(0, totalRequired - totalPlaced),
    schedules_placed_ratio: totalRequired > 0 ? totalPlaced / totalRequired : 0,
    hard_ok: schoolVal.hard_ok,
    ready_to_arrange: schoolVal.curriculum_ok && assignCount > 0 && timetable_configured,
    steps,
  };
};

const seedArrangeFromAssignments = async ({ school_year, clearExisting = true }) =>
  generateSchoolSchedule({ school_year, clearExisting });

/** @deprecated Dùng generateClassSchedule */
const autoArrangeClass = (opts) => generateClassSchedule({ ...opts, clearExisting: opts.clearExisting !== false });

/** @deprecated — dùng autoArrangeSchoolSchedule */
const autoArrangeSchool = (opts) => autoArrangeSchoolSchedule(opts);

const SCHOOL_DAYS_AUTO = DEFAULT_TIMETABLE.days_of_week;

module.exports = {
  purgeGhostSchedules,
  findConflicts,
  assertHardSlotFree,
  assertTeacherAssignment,
  assertTeacherClassAccess,
  annotateConflicts,
  getTimetableConfig,
  upsertTimetableConfig,
  normalizeTimetableConfig,
  buildSlotOrder,
  countGridSlots,
  generateClassSchedule,
  autoArrangeClassSchedule,
  autoArrangeSchoolSchedule,
  generateSchoolSchedule,
  repackClassSchedule,
  repackSchoolSchedule,
  resolveConflictsSchedule,
  getScheduleValidation,
  getSchoolScheduleValidation,
  getScheduleReadiness,
  seedArrangeFromAssignments,
  relocateConflictingSchedules,
  placeAssignmentSlots,
  autoArrangeClass,
  autoArrangeSchool,
  createBusyState,
  loadBusyFromSchedules,
  isSlotFree,
  occupySlot,
  releaseSlot,
  MAX_PERIODS_PER_WEEK,
  MAX_PERIODS_PER_SESSION,
  MAX_PERIODS_PER_DAY_CLASS,
  collectCurriculumMismatches,
  validateAssignmentAgainstCurriculum: scheduling.validateAssignmentAgainstCurriculum,
  SCHEDULE_DAYS,
  SCHOOL_DAYS_AUTO,
  DEFAULT_TIMETABLE,
};
