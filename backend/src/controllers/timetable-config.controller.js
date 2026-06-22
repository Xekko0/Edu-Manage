/**
 * Cấu hình khung giờ TKB theo năm học.
 */
const scheduleService = require('../services/schedule.service');
const { buildCalendarPayload } = require('../services/academic-calendar.service');
const { success, error } = require('../utils/responseHelper');
const env = require('../config/env');

const parseSchoolYear = (req) =>
  req.query.school_year || req.body.school_year || env.CURRENT_SCHOOL_YEAR || '2024-2025';

const get = async (req, res) => {
  try {
    const school_year = parseSchoolYear(req);
    const config = await scheduleService.getTimetableConfig(school_year);
    return success(res, config);
  } catch (err) {
    return error(res, err.message || 'Lỗi tải cấu hình khung giờ', err.status || 500);
  }
};

const update = async (req, res) => {
  try {
    const school_year = parseSchoolYear(req);
    const {
      days_of_week,
      morning_periods,
      afternoon_periods,
      afternoon_enabled,
      period_duration_minutes,
      semester1_start,
      semester1_end,
      semester2_start,
      semester2_end,
      holidays,
      morning_break_after_period,
      morning_break_minutes,
      afternoon_break_after_period,
      afternoon_break_minutes,
    } = req.body;

    const config = await scheduleService.upsertTimetableConfig(school_year, {
      days_of_week,
      morning_periods,
      afternoon_periods,
      afternoon_enabled,
      period_duration_minutes,
      semester1_start,
      semester1_end,
      semester2_start,
      semester2_end,
      holidays,
      morning_break_after_period,
      morning_break_minutes,
      afternoon_break_after_period,
      afternoon_break_minutes,
    });
    return success(res, config, 'Đã lưu cấu hình khung giờ');
  } catch (err) {
    const status = err.status || (err.message?.includes('SQLITE') ? 500 : 400);
    return error(res, err.message || 'Lỗi lưu cấu hình', status);
  }
};

const getCalendar = async (req, res) => {
  try {
    const school_year = parseSchoolYear(req);
    const semester = parseInt(req.query.semester, 10) || 1;
    const week_start = req.query.week_start || null;
    const selected_date = req.query.selected_date || null;
    const config = await scheduleService.getTimetableConfig(school_year);
    const calendar = buildCalendarPayload(config, semester, {
      weekStart: week_start,
      selectedDate: selected_date,
    });
    return success(res, calendar);
  } catch (err) {
    return error(res, err.message || 'Lỗi tải lịch học kỳ', err.status || 500);
  }
};

module.exports = { get, update, getCalendar };
