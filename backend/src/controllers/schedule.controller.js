/**
 * Schedule controller — thời khóa biểu.
 */
const {
  Schedule, Subject, Class, User, Student,
} = require('../models');
const { success, error } = require('../utils/responseHelper');
const scheduleService = require('../services/schedule.service');

const includeDetail = [
  { model: Subject, as: 'subject' },
  { model: Class, as: 'class' },
  { model: User, as: 'teacher', attributes: ['id', 'full_name'] },
];

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

    return success(res, {
      items: annotated,
      conflicts,
      maxPeriodsPerWeek: scheduleService.MAX_PERIODS_PER_WEEK,
    });
  } catch (err) {
    return error(res, err.message || 'Lỗi tải thời khóa biểu', err.status || 500, err.message);
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
    const full = await Schedule.findByPk(existing.id, { include: includeDetail });
    const [annotated] = await scheduleService.annotateConflicts([full], full.school_year);
    return success(res, { ...annotated, warnings }, 'Cập nhật thành công');
  } catch (err) {
    return error(res, err.message || 'Cập nhật thất bại', err.status || 400, err.conflicts);
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
    const full = await Schedule.findByPk(existing.id, { include: includeDetail });
    const [annotated] = await scheduleService.annotateConflicts([full], full.school_year);
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
    await Schedule.destroy({ where: { id: req.params.id } });
    return success(res, {}, 'Đã xóa lịch học');
  } catch (err) {
    return error(res, 'Xóa thất bại', 400, err.message);
  }
};

const autoArrange = async (req, res) => {
  try {
    const { class_id, school_year, clear_existing } = req.body;
    if (!class_id) return error(res, 'Thiếu class_id', 400);
    const sy = school_year || parseSchoolYear(req);
    const result = await scheduleService.autoArrangeClass({
      class_id: parseInt(class_id, 10),
      school_year: sy,
      clearExisting: !!clear_existing,
    });
    const items = await Schedule.findAll({
      where: { class_id, school_year: sy },
      include: includeDetail,
    });
    const annotated = await scheduleService.annotateConflicts(items, sy);
    return success(res, { ...result, items: annotated }, 'Tự động xếp lịch hoàn tất');
  } catch (err) {
    return error(res, err.message || 'Tự động xếp lịch thất bại', err.status || 400, err.message);
  }
};

module.exports = {
  list, listMine, create, update, move, remove, autoArrange,
};
