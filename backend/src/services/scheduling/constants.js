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

/** Trọng số chấm điểm ràng buộc mềm (Hill Climbing). */
const SOFT_WEIGHTS = {
  subject_same_day_over2: -50,
  subject_same_session_over1: -30,
  heavy_subject_day_over2: -40,
  gap_per_slot: -20,
  afternoon_period: -5,
  day_load_imbalance: -8,
};

const MAX_SAME_SUBJECT_PER_DAY = 2;
const MAX_SAME_SUBJECT_PER_SESSION = 1;
const MANDATORY_LAB_SUBJECT_CODES = new Set(['VLY', 'HOA', 'SINH']);

const HILL_CLIMB_MAX_STEPS = 2000;
const HILL_CLIMB_TIMEOUT_MS = 30000;

module.exports = {
  MAX_PERIODS_PER_SESSION,
  MAX_PERIODS_PER_WEEK,
  MAX_PERIODS_PER_DAY_CLASS,
  DEFAULT_TEACHING_WEEKS,
  EXPECTED_WEEKLY_BY_GRADE,
  GRADE_ANNUAL_TARGETS,
  PROGRAM_COMPONENT_ORDER,
  SOFT_WEIGHTS,
  MAX_SAME_SUBJECT_PER_DAY,
  MAX_SAME_SUBJECT_PER_SESSION,
  MANDATORY_LAB_SUBJECT_CODES,
  HILL_CLIMB_MAX_STEPS,
  HILL_CLIMB_TIMEOUT_MS,
};
