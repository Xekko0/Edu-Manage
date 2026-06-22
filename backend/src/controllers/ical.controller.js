/**
 * iCal Controller — API xuất lịch .ics theo chuẩn RFC 5545.
 */
const icalService = require('../services/ical.service');
const { success, error } = require('../utils/responseHelper');

/** GET /ical/teacher/:teacher_id — Feed .ics cho GV */
const teacherFeed = async (req, res) => {
  try {
    const ics = await icalService.generateTeacherFeed(req.params.teacher_id);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="edusmart-schedule.ics"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.send(ics);
  } catch (err) {
    return error(res, 'Lỗi tạo iCal feed', 500, err.message);
  }
};

/** GET /ical/student/:student_id — Feed .ics cho HS */
const studentFeed = async (req, res) => {
  try {
    const ics = await icalService.generateStudentFeed(req.params.student_id);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="edusmart-schedule.ics"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.send(ics);
  } catch (err) {
    return error(res, 'Lỗi tạo iCal feed', 500, err.message);
  }
};

/** GET /ical/class/:class_id — Feed .ics cho lớp */
const classFeed = async (req, res) => {
  try {
    const ics = await icalService.generateClassFeed(req.params.class_id);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="edusmart-schedule.ics"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.send(ics);
  } catch (err) {
    return error(res, 'Lỗi tạo iCal feed', 500, err.message);
  }
};

/** GET /ical/link — Lấy URL feed cho user hiện tại (JWT) */
const getMyLink = async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}/api/ical`;
    let url = '';

    if (req.user.role === 'subject' || req.user.role === 'homeroom') {
      url = `${baseUrl}/teacher/${req.user.id}`;
    } else if (req.user.role === 'student') {
      const { Student } = require('../models');
      const student = await Student.findOne({ where: { user_id: req.user.id } });
      if (student) url = `${baseUrl}/student/${student.id}`;
    } else if (req.user.role === 'parent') {
      // PH lấy feed của con đầu tiên
      const { Student } = require('../models');
      const { User } = require('../models');
      const parent = await User.findByPk(req.user.id, { include: [{ association: 'children' }] });
      const firstChild = parent?.children?.[0];
      if (firstChild) url = `${baseUrl}/student/${firstChild.id}`;
    }

    return success(res, { url, message: 'Thêm URL này vào Google Calendar / Apple Calendar / Outlook' });
  } catch (err) {
    return error(res, 'Lỗi lấy link', 500, err.message);
  }
};

module.exports = { teacherFeed, studentFeed, classFeed, getMyLink };
