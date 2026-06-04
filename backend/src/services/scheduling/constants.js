'use strict';

const MAX_PERIODS_PER_SESSION = 5;
const MAX_PERIODS_PER_WEEK = parseInt(process.env.TEACHER_MAX_PERIODS_WEEK, 10) || 20;
/** GDPT 2018: tối đa 7 tiết/ngày/lớp (gộp ca sáng + chiều). */
const MAX_PERIODS_PER_DAY_CLASS = 7;
const DEFAULT_TEACHING_WEEKS = 35;
const EXPECTED_WEEKLY_BY_GRADE = { 10: 29, 11: 29.5, 12: 29.5 };
const GRADE_ANNUAL_TARGETS = { 10: 1015, 11: 1032, 12: 1032 };

const PROGRAM_COMPONENT_ORDER = {
  required_core: 0,
  required_activity: 1,
  elective: 2,
  specialty_cluster: 3,
  optional_elective: 4,
};

module.exports = {
  MAX_PERIODS_PER_SESSION,
  MAX_PERIODS_PER_WEEK,
  MAX_PERIODS_PER_DAY_CLASS,
  DEFAULT_TEACHING_WEEKS,
  EXPECTED_WEEKLY_BY_GRADE,
  GRADE_ANNUAL_TARGETS,
  PROGRAM_COMPONENT_ORDER,
};
