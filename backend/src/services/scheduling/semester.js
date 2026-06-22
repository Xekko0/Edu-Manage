'use strict';

const { Op } = require('sequelize');

/** 0 = cả năm (môn học xuyên suốt); 1/2 = học kỳ cụ thể. */
const SEMESTER_ALL = 0;
const SEMESTER_HK1 = 1;
const SEMESTER_HK2 = 2;

const parseArrangeSemester = (value) => {
  const n = parseInt(value, 10);
  if (n !== SEMESTER_HK1 && n !== SEMESTER_HK2) {
    const err = new Error('Tham số semester phải là 1 (HK1) hoặc 2 (HK2)');
    err.status = 400;
    err.code = 'INVALID_SEMESTER';
    throw err;
  }
  return n;
};

const parseSemesterOptional = (value, defaultValue = null) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  const n = parseInt(value, 10);
  if (n === SEMESTER_ALL || n === SEMESTER_HK1 || n === SEMESTER_HK2) return n;
  return defaultValue;
};

const normalizeSemester = (value) => parseSemesterOptional(value, SEMESTER_ALL);

const assignmentMatchesArrangeSemester = (assignmentSemester, arrangeSemester) => {
  const s = normalizeSemester(assignmentSemester);
  return s === SEMESTER_ALL || s === arrangeSemester;
};

const scheduleSemesterForRow = (assignmentSemester, arrangeSemester) => {
  const s = normalizeSemester(assignmentSemester);
  return s === SEMESTER_ALL ? arrangeSemester : s;
};

const whereAssignmentForSemester = (arrangeSemester) => ({
  [Op.or]: [{ semester: SEMESTER_ALL }, { semester: arrangeSemester }],
});

const whereScheduleForViewSemester = (viewSemester) => {
  if (viewSemester == null || viewSemester === '') return {};
  const s = parseInt(viewSemester, 10);
  if (s !== SEMESTER_HK1 && s !== SEMESTER_HK2) return {};
  return { semester: s };
};

const whereScheduleForArrangeClear = (arrangeSemester) => ({
  semester: arrangeSemester,
});

const curriculumKey = (gradeLevel, subjectId, semester) =>
  `${gradeLevel}|${subjectId}|${normalizeSemester(semester)}`;

const findCurriculumStandard = async (CurriculumStandard, {
  school_year,
  grade_level,
  subject_id,
  assignmentSemester,
  arrangeSemester,
}) => {
  const asmSem = normalizeSemester(assignmentSemester);
  const tries = asmSem !== SEMESTER_ALL
    ? [asmSem]
    : [arrangeSemester, SEMESTER_ALL].filter((v, i, a) => a.indexOf(v) === i);

  for (const sem of tries) {
    const row = await CurriculumStandard.findOne({
      where: {
        school_year,
        grade_level,
        subject_id,
        semester: sem,
      },
    });
    if (row) return row;
  }
  return null;
};

module.exports = {
  SEMESTER_ALL,
  SEMESTER_HK1,
  SEMESTER_HK2,
  parseArrangeSemester,
  parseSemesterOptional,
  normalizeSemester,
  assignmentMatchesArrangeSemester,
  scheduleSemesterForRow,
  whereAssignmentForSemester,
  whereScheduleForViewSemester,
  whereScheduleForArrangeClear,
  curriculumKey,
  findCurriculumStandard,
};
