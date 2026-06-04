'use strict';

const { Op } = require('sequelize');
const { CurriculumStandard, Class, Subject, TeacherAssignment } = require('../../models');
const {
  DEFAULT_TEACHING_WEEKS,
  EXPECTED_WEEKLY_BY_GRADE,
} = require('./constants');

const deriveWeeklyPeriods = (totalPeriodsPerYear, teachingWeeks = DEFAULT_TEACHING_WEEKS) => {
  const weeks = Math.max(1, parseInt(teachingWeeks, 10) || DEFAULT_TEACHING_WEEKS);
  const total = parseInt(totalPeriodsPerYear, 10);
  return Math.round(total / weeks);
};

const exactWeeklyPeriods = (totalPeriodsPerYear, teachingWeeks = DEFAULT_TEACHING_WEEKS) => {
  const weeks = Math.max(1, parseInt(teachingWeeks, 10) || DEFAULT_TEACHING_WEEKS);
  return parseInt(totalPeriodsPerYear, 10) / weeks;
};

const hasWeeklyApproximation = (totalPeriodsPerYear, teachingWeeks, roundedWeekly) => {
  const exact = exactWeeklyPeriods(totalPeriodsPerYear, teachingWeeks);
  return Math.abs(exact - roundedWeekly) >= 0.01;
};

const standardToPayload = (row) => {
  const json = row.toJSON ? row.toJSON() : row;
  const weeks = json.teaching_weeks || DEFAULT_TEACHING_WEEKS;
  const total = json.total_periods_per_year;
  const weekly = json.periods_per_week ?? deriveWeeklyPeriods(total, weeks);
  const exact = exactWeeklyPeriods(total, weeks);
  return {
    ...json,
    teaching_weeks: weeks,
    periods_per_week: weekly,
    derived_periods_per_week: weekly,
    exact_weekly_periods: exact,
    weekly_approximation: hasWeeklyApproximation(total, weeks, weekly),
  };
};

const getCurriculumPeriods = async ({ school_year, grade_level, subject_id }) => {
  const row = await CurriculumStandard.findOne({
    where: { school_year, grade_level, subject_id },
  });
  return row ? row.periods_per_week : null;
};

const listCurriculumForGrade = async (school_year, grade_level) => {
  const rows = await CurriculumStandard.findAll({
    where: { school_year, grade_level },
    include: [{
      model: Subject,
      as: 'subject',
      attributes: ['id', 'code', 'name', 'program_component'],
    }],
    order: [['subject_id', 'ASC']],
  });
  return rows.map(standardToPayload);
};

const validateAssignmentAgainstCurriculum = async ({
  class_id,
  subject_id,
  school_year,
  periods_per_week,
  allow_override = false,
}) => {
  const cls = await Class.findByPk(class_id, { attributes: ['id', 'grade_level', 'name'] });
  if (!cls) {
    const err = new Error('Không tìm thấy lớp');
    err.status = 404;
    throw err;
  }

  const standard = await CurriculumStandard.findOne({
    where: {
      school_year,
      grade_level: cls.grade_level,
      subject_id,
    },
    include: [{ model: Subject, as: 'subject', attributes: ['code', 'name'] }],
  });

  if (!standard) {
    if (allow_override) return { ok: true, grade_level: cls.grade_level, standard: null };
    const err = new Error(
      `Chưa có khung CT khối ${cls.grade_level} cho môn này — cấu hình tại Khung chương trình`,
    );
    err.status = 400;
    err.code = 'CURRICULUM_MISSING';
    throw err;
  }

  const required = standard.periods_per_week;
  const actual = parseInt(periods_per_week, 10);
  if (actual !== required) {
    if (allow_override) {
      return {
        ok: false,
        warning: true,
        grade_level: cls.grade_level,
        standard: standardToPayload(standard),
        required,
        actual,
      };
    }
    const subName = standard.subject?.name || 'môn';
    const err = new Error(
      `Khối ${cls.grade_level}: ${subName} phải ${required} tiết/tuần (đang ${actual})`,
    );
    err.status = 400;
    err.code = 'CURRICULUM_MISMATCH';
    throw err;
  }

  return {
    ok: true,
    grade_level: cls.grade_level,
    standard: standardToPayload(standard),
    required,
    actual,
  };
};

const buildCurriculumStandardMap = async (school_year) => {
  const rows = await CurriculumStandard.findAll({ where: { school_year } });
  const map = new Map();
  for (const r of rows) {
    map.set(`${r.grade_level}|${r.subject_id}`, standardToPayload(r));
  }
  return map;
};

const resolveRequiredPeriods = (assignment, standardMap) => {
  const grade = assignment.class?.grade_level;
  const std = grade != null
    ? standardMap.get(`${grade}|${assignment.subject_id}`)
    : undefined;
  const assignmentPeriods = Math.max(1, assignment.periods_per_week || 2);
  let required = assignmentPeriods;
  let curriculumRequired = null;
  let weeklyApproximation = false;
  let exactWeekly = null;

  if (std != null) {
    if (typeof std === 'object') {
      required = std.periods_per_week;
      curriculumRequired = std.periods_per_week;
      exactWeekly = std.exact_weekly_periods;
      weeklyApproximation = std.weekly_approximation;
    } else {
      required = std;
      curriculumRequired = std;
    }
  }

  return {
    required,
    curriculum_required: curriculumRequired,
    assignment_periods: assignmentPeriods,
    curriculum_aligned: curriculumRequired == null || curriculumRequired === assignmentPeriods,
    exact_weekly_periods: exactWeekly,
    weekly_approximation: weeklyApproximation,
    total_periods_per_year: typeof std === 'object' ? std.total_periods_per_year : null,
    teaching_weeks: typeof std === 'object' ? std.teaching_weeks : null,
  };
};

const collectCurriculumMismatches = async (school_year, class_ids = null) => {
  const classWhere = { school_year, is_active: true };
  if (class_ids?.length) {
    classWhere.id = { [Op.in]: class_ids.map((id) => parseInt(id, 10)) };
  }
  const classes = await Class.findAll({ where: classWhere, attributes: ['id', 'name', 'grade_level'] });
  const mismatches = [];

  for (const cls of classes) {
    const assignments = await TeacherAssignment.findAll({
      where: { class_id: cls.id, school_year, is_active: true },
      include: [{ model: Subject, as: 'subject', attributes: ['id', 'code', 'name'] }],
    });

    for (const a of assignments) {
      const standard = await CurriculumStandard.findOne({
        where: {
          school_year,
          grade_level: cls.grade_level,
          subject_id: a.subject_id,
        },
      });
      const required = standard?.periods_per_week ?? null;
      const actual = a.periods_per_week;
      if (required === null) {
        mismatches.push({
          type: 'curriculum',
          subtype: 'missing_standard',
          class_id: cls.id,
          class_name: cls.name,
          grade_level: cls.grade_level,
          assignment_id: a.id,
          subject_id: a.subject_id,
          subject_name: a.subject?.name,
          message: `Thiếu khung CT khối ${cls.grade_level} cho ${a.subject?.name || 'môn'}`,
        });
      } else if (actual !== required) {
        mismatches.push({
          type: 'curriculum',
          subtype: 'periods_mismatch',
          class_id: cls.id,
          class_name: cls.name,
          grade_level: cls.grade_level,
          assignment_id: a.id,
          subject_id: a.subject_id,
          subject_name: a.subject?.name,
          required,
          actual,
          total_periods_per_year: standard.total_periods_per_year,
          message: `${cls.name}: ${a.subject?.name} cần ${required} tiết/tuần, phân công ${actual}`,
        });
      }
    }
  }

  return mismatches;
};

const syncAssignmentsFromCurriculum = async (school_year) => {
  const assignments = await TeacherAssignment.findAll({
    where: { school_year, is_active: true },
    include: [
      { model: Class, as: 'class', attributes: ['id', 'name', 'grade_level'] },
      { model: Subject, as: 'subject', attributes: ['id', 'code', 'name'] },
    ],
  });

  const updated = [];
  const skipped = [];

  for (const a of assignments) {
    const standard = await CurriculumStandard.findOne({
      where: {
        school_year,
        grade_level: a.class?.grade_level,
        subject_id: a.subject_id,
      },
    });
    if (!standard) {
      skipped.push({
        assignment_id: a.id,
        class_name: a.class?.name,
        subject_name: a.subject?.name,
        reason: 'missing_standard',
      });
      continue;
    }
    const required = standard.periods_per_week;
    if (a.periods_per_week !== required) {
      const from = a.periods_per_week;
      await a.update({ periods_per_week: required });
      updated.push({
        assignment_id: a.id,
        class_name: a.class?.name,
        subject_name: a.subject?.name,
        from,
        to: required,
        total_periods_per_year: standard.total_periods_per_year,
      });
    }
  }

  const remaining = await collectCurriculumMismatches(school_year);
  return {
    school_year,
    updated_count: updated.length,
    updated,
    skipped,
    remaining_issues: remaining.length,
    curriculum_ok: remaining.length === 0,
  };
};

const computeGdptWeeklyWarning = (gradeLevel, sumWeeklyRequired) => {
  const expected = EXPECTED_WEEKLY_BY_GRADE[gradeLevel];
  if (expected == null) return null;
  const delta = sumWeeklyRequired - expected;
  if (Math.abs(delta) <= 2) return null;
  return {
    grade_level: gradeLevel,
    expected_weekly: expected,
    actual_weekly: sumWeeklyRequired,
    delta,
    message: `Khối ${gradeLevel}: tổng ${sumWeeklyRequired} tiết/tuần lệch chuẩn GDPT ~${expected} (±2)`,
  };
};

const upsertCurriculumFields = ({
  total_periods_per_year,
  teaching_weeks = DEFAULT_TEACHING_WEEKS,
  periods_per_week: legacyWeekly,
}) => {
  const weeks = Math.max(1, parseInt(teaching_weeks, 10) || DEFAULT_TEACHING_WEEKS);
  let total = parseInt(total_periods_per_year, 10);
  if (Number.isNaN(total) && legacyWeekly != null) {
    total = parseInt(legacyWeekly, 10) * weeks;
  }
  if (Number.isNaN(total) || total < 1) {
    const err = new Error('total_periods_per_year không hợp lệ');
    err.status = 400;
    throw err;
  }
  const weekly = deriveWeeklyPeriods(total, weeks);
  return {
    total_periods_per_year: total,
    teaching_weeks: weeks,
    periods_per_week: weekly,
    exact_weekly_periods: total / weeks,
    weekly_approximation: hasWeeklyApproximation(total, weeks, weekly),
  };
};

module.exports = {
  deriveWeeklyPeriods,
  exactWeeklyPeriods,
  standardToPayload,
  upsertCurriculumFields,
  computeGdptWeeklyWarning,
  getCurriculumPeriods,
  listCurriculumForGrade,
  validateAssignmentAgainstCurriculum,
  buildCurriculumStandardMap,
  resolveRequiredPeriods,
  collectCurriculumMismatches,
  syncAssignmentsFromCurriculum,
};
