/**
 * Schedule controller — thời khóa biểu.
 */
const {
  Schedule, Subject, Class, User, Student, Room,
} = require('../models');
const { success, error } = require('../utils/responseHelper');
const scheduleService = require('../services/schedule.service');
const enrichment = require('../services/schedule-enrichment.service');
const scheduleNotify = require('../services/schedule-notify.service');

const includeDetail = [
  { model: Subject, as: 'subject' },
  { model: Class, as: 'class' },
  { model: User, as: 'teacher', attributes: ['id', 'full_name'] },
  { model: Room, as: 'roomRef', attributes: ['id', 'code', 'name', 'room_type', 'campus'] },
];

const loadFullSchedule = (id) => Schedule.findByPk(id, { include: includeDetail });

const parseSchoolYear = (req) =>
  req.query.school_year || req.body.school_year || process.env.CURRENT_SCHOOL_YEAR || '2024-2025';

const list = async (req, res) => {
  try {
    const { class_id } = req.query;
    const school_year = parseSchoolYear(req);

    if (!class_id) return error(res, 'Thiếu class_id', 400);

    if (req.user.role === 'subject') {
      await scheduleService.assertTeacherClassAccess(req.user.id, class_id);
    }

    if (req.user.role === 'student') {
      const stu = await Student.findOne({ where: { user_id: req.user.id } });
      if (!stu || Number(stu.class_id) !== Number(class_id)) {
        return error(res, 'Bạn chỉ xem được TKB lớp mình', 403);
      }
    }

    if (req.user.role === 'parent') {
      const parent = await User.findByPk(req.user.id, {
        include: [{ model: Student, as: 'children', attributes: ['class_id'] }],
      });
      const ok = (parent.children || []).some((c) => Number(c.class_id) === Number(class_id));
      if (!ok) return error(res, 'Bạn chỉ xem được TKB lớp của con', 403);
    }

    const items = await Schedule.findAll({
      where: { class_id, school_year },
      include: includeDetail,
      order: [['session', 'ASC'], ['day_of_week', 'ASC'], ['period', 'ASC']],
    });

    const annotated = await scheduleService.annotateConflicts(items, school_year);
    const conflicts = annotated.filter((i) => i.conflictTypes?.length > 0);

    const useStudentView = req.query.view === 'student'
      || ['student', 'parent'].includes(req.user.role);

    if (useStudentView) {
      const slots = await enrichment.enrichSchedulesForStudent(annotated);
      return success(res, {
        view: 'student',
        items: slots,
        slots,
        conflicts: conflicts.map((c) => enrichment.toStudentSlotView(c, c.roomRef)),
        maxPeriodsPerWeek: scheduleService.MAX_PERIODS_PER_WEEK,
      });
    }

    return success(res, {
      items: annotated,
      conflicts,
      maxPeriodsPerWeek: scheduleService.MAX_PERIODS_PER_WEEK,
    });
  } catch (err) {
    return error(res, err.message || 'Lỗi tải thời khóa biểu', err.status || 500, err.message);
  }
};

const myClass = async (req, res) => {
  try {
    const school_year = parseSchoolYear(req);
    let class_id = null;

    if (req.user.role === 'student') {
      const stu = await Student.findOne({ where: { user_id: req.user.id } });
      if (!stu?.class_id) return error(res, 'Chưa gán lớp', 400);
      class_id = stu.class_id;
    } else if (req.user.role === 'parent') {
      const childId = parseInt(req.query.student_id, 10);
      const parent = await User.findByPk(req.user.id, {
        include: [{ model: Student, as: 'children', attributes: ['id', 'class_id'] }],
      });
      const children = parent?.children || [];
      if (!children.length) return error(res, 'Chưa liên kết học sinh', 400);
      const child = childId
        ? children.find((c) => Number(c.id) === childId)
        : children[0];
      if (!child) return error(res, 'Không tìm thấy học sinh', 404);
      class_id = child.class_id;
    } else {
      return error(res, 'Chỉ dành cho học sinh / phụ huynh', 403);
    }

    const items = await Schedule.findAll({
      where: { class_id, school_year },
      include: includeDetail,
      order: [['session', 'ASC'], ['day_of_week', 'ASC'], ['period', 'ASC']],
    });
    const annotated = await scheduleService.annotateConflicts(items, school_year);
    const slots = await enrichment.enrichSchedulesForStudent(annotated);

    return success(res, {
      view: 'student',
      class_id,
      school_year,
      items: slots,
      slots,
    });
  } catch (err) {
    return error(res, err.message || 'Lỗi tải TKB lớp', err.status || 500);
  }
};

const listMine = async (req, res) => {
  try {
    const school_year = parseSchoolYear(req);
    const items = await Schedule.findAll({
      where: { teacher_id: req.user.id, school_year },
      include: includeDetail,
      order: [['session', 'ASC'], ['day_of_week', 'ASC'], ['period', 'ASC']],
    });
    const annotated = await scheduleService.annotateConflicts(items, school_year);
    return success(res, {
      items: annotated,
      maxPeriodsPerWeek: scheduleService.MAX_PERIODS_PER_WEEK,
      myPeriodCount: annotated.length,
    });
  } catch (err) {
    return error(res, 'Lỗi tải lịch dạy', 500, err.message);
  }
};

const assertTeacherOwnsSlot = async (user, scheduleRow) => {
  if (user.role === 'admin') return;
  if (Number(scheduleRow.teacher_id) !== Number(user.id)) {
    const err = new Error('Bạn chỉ được sửa tiết do chính mình dạy');
    err.status = 403;
    throw err;
  }
  await scheduleService.assertTeacherClassAccess(user.id, scheduleRow.class_id);
};

/** Chỉ kiểm tra bắt buộc + phân công — không chặn trùng lịch. */
const validatePayload = async (body, excludeId, reqUser) => {
  const {
    class_id, subject_id, teacher_id, day_of_week, session, period, school_year,
  } = body;
  if (!class_id || !subject_id || !teacher_id || !day_of_week || !session || !period || !school_year) {
    const err = new Error('Thiếu trường bắt buộc');
    err.status = 400;
    throw err;
  }
  if (reqUser?.role === 'subject') {
    if (Number(teacher_id) !== Number(reqUser.id)) {
      const err = new Error('Giáo viên chỉ được tạo/sửa tiết của chính mình');
      err.status = 403;
      throw err;
    }
    await scheduleService.assertTeacherClassAccess(reqUser.id, class_id);
  }
  await scheduleService.assertTeacherAssignment(teacher_id, class_id, subject_id);
  await scheduleService.assertHardSlotFree({
    class_id,
    teacher_id,
    day_of_week: parseInt(day_of_week, 10),
    session,
    period: parseInt(period, 10),
    school_year,
    excludeId,
    room: body.room,
  });
  return scheduleService.findConflicts({
    class_id,
    teacher_id,
    day_of_week: parseInt(day_of_week, 10),
    session,
    period: parseInt(period, 10),
    school_year,
    room: body.room,
    excludeId,
  });
};

const create = async (req, res) => {
  try {
    const warnings = await validatePayload(req.body, null, req.user);
    const item = await Schedule.create(req.body);
    const full = await Schedule.findByPk(item.id, { include: includeDetail });
    const [annotated] = await scheduleService.annotateConflicts([full], req.body.school_year);
    const msg = warnings.length
      ? 'Đã thêm tiết (có cảnh báo trùng lịch — ô đỏ)'
      : 'Tạo lịch học thành công';
    return success(res, { ...annotated, warnings }, msg, 201);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return error(
        res,
        'Khung giờ này đã bị chiếm (có thể do dữ liệu TKB cũ). Thử ô khác hoặc «Tự động xếp lịch».',
        400,
      );
    }
    return error(res, err.message || 'Tạo lịch học thất bại', err.status || 400, err.conflicts);
  }
};

const update = async (req, res) => {
  try {
    const existing = await Schedule.findByPk(req.params.id);
    if (!existing) return error(res, 'Không tìm thấy tiết', 404);
    await assertTeacherOwnsSlot(req.user, existing);
    const patch = { ...req.body };
    if (req.user.role === 'subject') {
      delete patch.teacher_id;
      delete patch.class_id;
      delete patch.subject_id;
    }
    const merged = { ...existing.toJSON(), ...patch };
    const warnings = await validatePayload(merged, existing.id, req.user);
    await existing.update(patch);
    const full = await loadFullSchedule(existing.id);
    const [annotated] = await scheduleService.annotateConflicts([full], full.school_year);
    scheduleNotify.notifyScheduleSlotChange(full, 'Một tiết học đã được cập nhật').catch(() => {});
    return success(res, { ...annotated, warnings }, 'Cập nhật thành công');
  } catch (err) {
    return error(res, err.message || 'Cập nhật thất bại', err.status || 400, err.conflicts);
  }
};

const patchLesson = async (req, res) => {
  try {
    const existing = await Schedule.findByPk(req.params.id);
    if (!existing) return error(res, 'Không tìm thấy tiết', 404);
    await assertTeacherOwnsSlot(req.user, existing);

    const {
      lesson_topic,
      homework_reminder,
      delivery_mode,
      online_meeting_url,
    } = req.body;

    const patch = {};
    if (lesson_topic !== undefined) patch.lesson_topic = lesson_topic || null;
    if (homework_reminder !== undefined) patch.homework_reminder = homework_reminder || null;
    if (delivery_mode !== undefined) patch.delivery_mode = delivery_mode;
    if (online_meeting_url !== undefined) patch.online_meeting_url = online_meeting_url || null;

    enrichment.validateLessonPatch({
      delivery_mode: patch.delivery_mode ?? existing.delivery_mode,
      online_meeting_url: patch.online_meeting_url ?? existing.online_meeting_url,
    });

    await existing.update(patch);
    const full = await loadFullSchedule(existing.id);
    const [annotated] = await scheduleService.annotateConflicts([full], full.school_year);
    const studentSlot = enrichment.toStudentSlotView(annotated, annotated.roomRef);
    scheduleNotify.notifyScheduleSlotChange(full, `Cập nhật tiết ${studentSlot.subject}`).catch(() => {});
    return success(res, { ...annotated, student_view: studentSlot }, 'Đã lưu nội dung tiết học');
  } catch (err) {
    return error(res, err.message || 'Lưu thất bại', err.status || 400);
  }
};

const move = async (req, res) => {
  try {
    const existing = await Schedule.findByPk(req.params.id);
    if (!existing) return error(res, 'Không tìm thấy tiết', 404);
    await assertTeacherOwnsSlot(req.user, existing);

    const { day_of_week, session, period, class_id, room } = req.body;
    const merged = {
      ...existing.toJSON(),
      day_of_week: day_of_week !== undefined ? parseInt(day_of_week, 10) : existing.day_of_week,
      session: session ?? existing.session,
      period: period !== undefined ? parseInt(period, 10) : existing.period,
      class_id: req.user.role === 'admin' ? (class_id ?? existing.class_id) : existing.class_id,
      room: room !== undefined ? room : existing.room,
    };
    const warnings = await validatePayload(merged, existing.id, req.user);
    await existing.update({
      day_of_week: merged.day_of_week,
      session: merged.session,
      period: merged.period,
      class_id: merged.class_id,
      room: merged.room,
    });
    const full = await loadFullSchedule(existing.id);
    const [annotated] = await scheduleService.annotateConflicts([full], full.school_year);
    scheduleNotify.notifyClassScheduleChange(
      full.class_id,
      `Đổi lịch: ${annotated.subject?.name} sang Thứ ${full.day_of_week} tiết ${full.period}`,
    ).catch(() => {});
    const msg = warnings.length ? 'Đã lưu (có cảnh báo trùng lịch)' : 'Di chuyển tiết thành công';
    return success(res, { ...annotated, warnings }, msg);
  } catch (err) {
    return error(res, err.message || 'Di chuyển thất bại', err.status || 400, err.conflicts);
  }
};

const remove = async (req, res) => {
  try {
    const existing = await Schedule.findByPk(req.params.id);
    if (!existing) return error(res, 'Không tìm thấy tiết', 404);
    await assertTeacherOwnsSlot(req.user, existing);
    // Xóa cứng: unique index ô lớp/GV không có điều kiện deleted_at — soft-delete sẽ chặn ô trống.
    await existing.destroy({ force: true });
    return success(res, {}, 'Đã xóa lịch học');
  } catch (err) {
    return error(res, 'Xóa thất bại', 400, err.message);
  }
};

const loadClassItems = async (class_id, school_year) => {
  const items = await Schedule.findAll({
    where: { class_id, school_year },
    include: includeDetail,
  });
  return scheduleService.annotateConflicts(items, school_year);
};

const validation = async (req, res) => {
  try {
    const sy = parseSchoolYear(req);
    const class_id = req.query.class_id ? parseInt(req.query.class_id, 10) : null;
    const result = await scheduleService.getScheduleValidation({
      school_year: sy,
      class_id,
    });
    return success(res, result);
  } catch (err) {
    return error(res, err.message || 'Lỗi kiểm tra TKB', err.status || 500);
  }
};

const validationSchool = async (req, res) => {
  try {
    const sy = parseSchoolYear(req);
    const result = await scheduleService.getSchoolScheduleValidation({ school_year: sy });
    return success(res, result);
  } catch (err) {
    return error(res, err.message || 'Lỗi kiểm tra TKB toàn trường', err.status || 500);
  }
};

const generate = async (req, res) => {
  try {
    const { class_id, school_year, clear_existing } = req.body;
    if (!class_id) return error(res, 'Thiếu class_id', 400);
    const sy = school_year || parseSchoolYear(req);
    const cid = parseInt(class_id, 10);
    const result = await scheduleService.generateClassSchedule({
      class_id: cid,
      school_year: sy,
      clearExisting: clear_existing !== false,
    });
    const items = await loadClassItems(cid, sy);
    return success(
      res,
      { ...result, items },
      `Đã sinh ${result.created} tiết từ phân công`,
    );
  } catch (err) {
    return error(res, err.message || 'Sinh TKB thất bại', err.status || 400, err.message);
  }
};

const generateSchool = async (req, res) => {
  try {
    const { school_year, clear_existing, class_ids } = req.body;
    const sy = school_year || parseSchoolYear(req);
    const result = await scheduleService.generateSchoolSchedule({
      school_year: sy,
      class_ids: class_ids || null,
      clearExisting: clear_existing !== false,
    });
    const classes = await Class.findAll({
      where: { school_year: sy, is_active: true },
      attributes: ['id'],
    });
    for (const cls of classes) {
      scheduleNotify.notifyClassScheduleChange(
        cls.id,
        'Thời khóa biểu toàn trường đã được sinh lại',
      ).catch(() => {});
    }
    return success(res, result, `Đã sinh ${result.total_created} tiết toàn trường`);
  } catch (err) {
    return error(res, err.message || 'Sinh TKB toàn trường thất bại', err.status || 400, err.message);
  }
};

const repack = async (req, res) => {
  try {
    const { class_id, school_year } = req.body;
    if (!class_id) return error(res, 'Thiếu class_id', 400);
    const sy = school_year || parseSchoolYear(req);
    const cid = parseInt(class_id, 10);
    const result = await scheduleService.repackClassSchedule({
      class_id: cid,
      school_year: sy,
    });
    const items = await loadClassItems(cid, sy);
    return success(
      res,
      { ...result, items },
      `Đã xếp lại ${result.moved} tiết (không tạo thêm)`,
    );
  } catch (err) {
    return error(res, err.message || 'Xếp lại TKB thất bại', err.status || 400, err.message);
  }
};

const repackSchool = async (req, res) => {
  try {
    const { school_year, class_ids } = req.body;
    const sy = school_year || parseSchoolYear(req);
    const result = await scheduleService.repackSchoolSchedule({
      school_year: sy,
      class_ids: class_ids || null,
    });
    return success(res, result, `Đã xếp lại ${result.total_moved} tiết toàn trường`);
  } catch (err) {
    return error(res, err.message || 'Xếp lại toàn trường thất bại', err.status || 400, err.message);
  }
};

const resolveConflicts = async (req, res) => {
  try {
    const { school_year, class_id } = req.body;
    const sy = school_year || parseSchoolYear(req);
    const cid = class_id ? parseInt(class_id, 10) : null;
    const result = await scheduleService.resolveConflictsSchedule({
      school_year: sy,
      class_id: cid,
    });
    let items;
    if (cid) items = await loadClassItems(cid, sy);
    return success(res, { ...result, items }, `Đã dời ${result.moved} tiết trùng`);
  } catch (err) {
    return error(res, err.message || 'Giải trùng thất bại', err.status || 400, err.message);
  }
};

/** Alias cũ → sinh TKB lớp */
const autoArrange = async (req, res) => {
  try {
    const { class_id, school_year } = req.body;
    if (!class_id) return error(res, 'Thiếu class_id', 400);
    const sy = school_year || parseSchoolYear(req);
    const cid = parseInt(class_id, 10);
    const result = await scheduleService.autoArrangeClassSchedule({
      class_id: cid,
      school_year: sy,
    });
    const items = await loadClassItems(cid, sy);
    const synced = result.curriculum_sync?.updated_count || 0;
    const syncNote = synced > 0 ? ` (đã đồng bộ ${synced} phân công theo khung CT)` : '';
    return success(
      res,
      { ...result, items },
      `Đã tự động phân bổ ${result.created} tiết — đạt ràng buộc cứng${syncNote}`,
    );
  } catch (err) {
    return error(
      res,
      err.message || 'Tự động xếp lịch thất bại',
      err.status || 400,
      err.validation || err.curriculum_issues || err.message,
    );
  }
};
/** Alias cũ → sinh toàn trường nếu clear_existing, không thì giải trùng */
const autoArrangeSchool = async (req, res) => {
  if (req.body?.clear_existing) return generateSchool(req, res);
  return resolveConflicts(req, res);
};

module.exports = {
  list,
  myClass,
  listMine,
  create,
  update,
  patchLesson,
  move,
  remove,
  validation,
  validationSchool,
  generate,
  generateSchool,
  repack,
  repackSchool,
  resolveConflicts,
  autoArrange,
  autoArrangeSchool,
};
