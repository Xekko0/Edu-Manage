'use strict';

const { Op } = require('sequelize');
const {
  TeacherAssignment, Class, Subject, TeacherUnavailability,
} = require('../../../models');
const {
  buildCurriculumStandardMap,
  resolveRequiredPeriods,
  collectCurriculumMismatches,
} = require('../curriculum');
const {
  whereAssignmentForSemester,
  parseArrangeSemester,
  SEMESTER_HK1,
} = require('../semester');
const { loadActiveRooms } = require('../room-assign');
const { buildSlotOrder, countGridSlots } = require('../slot-order');
const { PROGRAM_COMPONENT_ORDER } = require('../constants');

const buildRoomPool = (rooms) => {
  const pool = { classroom: 0, lab: 0, computer: 0 };
  for (const r of rooms) {
    const t = r.room_type || 'classroom';
    pool[t] = (pool[t] || 0) + 1;
  }
  if (pool.classroom === 0) pool.classroom = Math.max(rooms.length, 1);
  return pool;
};

const sortAssignmentsByDifficulty = (assignments, teacherClassCount) => {
  const list = [...assignments];
  list.sort((a, b) => {
    const tcA = teacherClassCount.get(a.teacher_id) || 1;
    const tcB = teacherClassCount.get(b.teacher_id) || 1;
    if (tcB !== tcA) return tcB - tcA;
    const compA = a.subject?.program_component || 'elective';
    const compB = b.subject?.program_component || 'elective';
    const oa = PROGRAM_COMPONENT_ORDER[compA] ?? 99;
    const ob = PROGRAM_COMPONENT_ORDER[compB] ?? 99;
    if (oa !== ob) return oa - ob;
    return (b.periodsNeeded || b.periods_per_week || 0)
      - (a.periodsNeeded || a.periods_per_week || 0);
  });
  return list;
};

const buildProblem = async ({
  school_year,
  semester: semesterInput,
  class_ids = null,
  timetableConfig,
  unavailability: unavailabilityInput = null,
}) => {
  const arrangeSemester = semesterInput != null && semesterInput !== ''
    ? parseArrangeSemester(semesterInput)
    : SEMESTER_HK1;

  const classWhere = { school_year, is_active: true };
  if (class_ids?.length) {
    classWhere.id = { [Op.in]: class_ids.map((id) => parseInt(id, 10)) };
  }

  const classes = await Class.findAll({
    where: classWhere,
    order: [['grade_level', 'ASC'], ['name', 'ASC']],
  });
  const classMap = new Map(classes.map((c) => [c.id, c]));

  const assignWhere = {
    school_year,
    is_active: true,
    class_id: { [Op.in]: classes.map((c) => c.id) },
    ...whereAssignmentForSemester(arrangeSemester),
  };

  const assignmentsRaw = await TeacherAssignment.findAll({
    where: assignWhere,
    include: [
      {
        model: Subject,
        as: 'subject',
        attributes: ['id', 'code', 'name', 'program_component', 'preferred_room_type'],
      },
      { model: Class, as: 'class', attributes: ['id', 'name', 'grade_level'] },
    ],
  });

  let unavailability = unavailabilityInput;
  if (unavailability === null) {
    unavailability = await TeacherUnavailability.findAll({
      where: { school_year },
    });
  }

  const standardMap = await buildCurriculumStandardMap(school_year, arrangeSemester);
  const rooms = await loadActiveRooms();
  const roomPool = buildRoomPool(rooms);
  const slotOrder = buildSlotOrder(timetableConfig);
  const gridSlots = countGridSlots(timetableConfig);

  const teacherClassCount = new Map();
  const workItems = [];

  for (const asn of assignmentsRaw) {
    const cls = classMap.get(asn.class_id) || asn.class;
    const { required } = resolveRequiredPeriods(
      { ...(asn.toJSON ? asn.toJSON() : asn), class: cls },
      standardMap,
      arrangeSemester,
    );
    teacherClassCount.set(
      asn.teacher_id,
      (teacherClassCount.get(asn.teacher_id) || 0) + 1,
    );
    workItems.push({
      ...(asn.toJSON ? asn.toJSON() : asn),
      subject: asn.subject,
      class: cls,
      periodsNeeded: required,
    });
  }

  const assignments = sortAssignmentsByDifficulty(workItems, teacherClassCount);
  const curriculumIssues = await collectCurriculumMismatches(
    school_year,
    classes.map((c) => c.id),
    arrangeSemester,
  );

  let totalRequired = 0;
  for (const a of assignments) totalRequired += a.periodsNeeded;

  return {
    school_year,
    arrangeSemester,
    classes,
    classMap,
    assignments,
    standardMap,
    rooms,
    roomPool,
    slotOrder,
    gridSlots,
    unavailability,
    curriculumIssues,
    totalRequired,
    class_ids: classes.map((c) => c.id),
  };
};

module.exports = {
  buildProblem,
  buildRoomPool,
  sortAssignmentsByDifficulty,
};
