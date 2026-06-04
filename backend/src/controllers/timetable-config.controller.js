/**

 * Cấu hình khung giờ TKB theo năm học.

 */

const scheduleService = require('../services/schedule.service');

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

    } = req.body;



    const config = await scheduleService.upsertTimetableConfig(school_year, {

      days_of_week,

      morning_periods,

      afternoon_periods,

      afternoon_enabled,

    });

    return success(res, config, 'Đã lưu cấu hình khung giờ');

  } catch (err) {

    const status = err.status || (err.message?.includes('SQLITE') ? 500 : 400);

    return error(res, err.message || 'Lỗi lưu cấu hình', status);

  }

};



module.exports = { get, update };

