'use strict';

const { Op } = require('sequelize');
const { Schedule } = require('../../../models');
const { whereScheduleForArrangeClear } = require('../semester');
const {
  detectHardViolationsFromSchedules,
  summarizeViolations,
} = require('../hard-constraints');
const { buildProblem } = require('./problem-builder');
const { greedyInit } = require('./greedy-init');
const { hillClimb } = require('./hill-climb');

const persistPlacements = async (placements) => {
  if (!placements.length) return [];
  const rows = placements.map((p) => ({
    class_id: p.class_id,
    subject_id: p.subject_id,
    teacher_id: p.teacher_id,
    day_of_week: p.day_of_week,
    session: p.session,
    period: p.period,
    room: p.room,
    room_id: p.room_id,
    school_year: p.school_year,
    semester: p.semester,
    program_component: p.program_component,
  }));
  return Schedule.bulkCreate(rows);
};

const solveSchoolSchedule = async ({
  school_year,
  semester,
  class_ids = null,
  timetableConfig,
  unavailability = [],
  clearExisting = true,
  runHillClimb = true,
}) => {
  const started = Date.now();
  const problem = await buildProblem({
    school_year,
    semester,
    class_ids,
    timetableConfig,
    unavailability,
  });

  if (problem.curriculumIssues.length) {
    const err = new Error('Phân công chưa khớp khung chương trình theo khối');
    err.status = 400;
    err.code = 'CURRICULUM_BLOCK';
    err.curriculum_issues = problem.curriculumIssues;
    throw err;
  }

  if (!problem.assignments.length) {
    const err = new Error('Không có phân công giáo viên để xếp lịch');
    err.status = 400;
    throw err;
  }

  for (const cls of problem.classes) {
    const classRequired = problem.assignments
      .filter((a) => a.class_id === cls.id)
      .reduce((s, a) => s + (a.periodsNeeded || 0), 0);
    if (classRequired > problem.gridSlots) {
      const err = new Error(
        `Lớp ${cls.name} cần ${classRequired} tiết/tuần nhưng lưới chỉ có ${problem.gridSlots} ô`,
      );
      err.status = 400;
      throw err;
    }
  }

  if (clearExisting) {
    const destroyWhere = { school_year, semester: problem.arrangeSemester };
    if (class_ids?.length) {
      destroyWhere.class_id = { [Op.in]: problem.class_ids };
    }
    await Schedule.destroy({ where: destroyWhere, force: true });
  }

  const initResult = await greedyInit(problem);
  const climbResult = runHillClimb ? hillClimb(initResult, problem) : initResult;

  const created = await persistPlacements(climbResult.placements);
  const violations = detectHardViolationsFromSchedules(created, {
    curriculumMismatches: problem.curriculumIssues,
  });
  const summary = summarizeViolations(violations);
  const elapsed_ms = Date.now() - started;

  return {
    mode: 'solver',
    school_year,
    semester: problem.arrangeSemester,
    classes_processed: problem.classes.length,
    created: created.length,
    periods_placed: climbResult.placed,
    periods_requested: climbResult.requested,
    missing_periods: Math.max(0, climbResult.requested - climbResult.placed),
    failures: climbResult.failures,
    soft_score: climbResult.soft_score,
    soft_score_before: climbResult.soft_score_before ?? initResult.soft_score,
    moves_applied: climbResult.moves_applied ?? 0,
    hard_ok: summary.hard_ok && climbResult.placed >= climbResult.requested,
    violations,
    violation_summary: summary,
    grid_slots: problem.gridSlots,
    elapsed_ms,
    by_class: problem.classes.map((c) => ({
      class_id: c.id,
      class_name: c.name,
      placed: climbResult.placements.filter((p) => p.class_id === c.id).length,
    })),
  };
};

module.exports = {
  solveSchoolSchedule,
  persistPlacements,
};
