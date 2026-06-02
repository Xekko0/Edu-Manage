const env = require('../../../../config/env');
const { assertClassAccess } = require('../../../ai/staff-context.service');

const STAFF_CHIPS = [
  'Tôi có thể làm gì?',
  'Lớp tôi dạy / quản lý',
  'Điểm trung bình lớp',
  'Cách nhập điểm',
];

const schoolYear = () => env.CURRENT_SCHOOL_YEAR;

const requireClass = (ctx) => {
  if (!ctx.active_class_id) return null;
  if (!assertClassAccess(ctx, ctx.active_class_id)) return null;
  return ctx.active_class_id;
};

module.exports = { STAFF_CHIPS, schoolYear, requireClass };
