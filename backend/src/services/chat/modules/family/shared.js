const env = require('../../../../config/env');

const FALLBACK_CHIPS = [
  'Tóm tắt tình hình học tập',
  'Điểm con tôi môn Toán?',
  'Học phí đã đóng chưa?',
  'Lịch học tuần này',
  'Nhận xét của giáo viên',
];

const SCHEDULE_CHIP_ACTIONS = [{ label: 'Xem TKB đầy đủ', path: '/schedule' }];

const schoolYear = () => env.CURRENT_SCHOOL_YEAR;

module.exports = { FALLBACK_CHIPS, SCHEDULE_CHIP_ACTIONS, schoolYear };
