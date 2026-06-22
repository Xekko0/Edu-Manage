'use strict';

const {
  SEMESTER_ALL,
  parseArrangeSemester,
  assignmentMatchesArrangeSemester,
  scheduleSemesterForRow,
  curriculumKey,
} = require('../semester');

describe('semester helpers', () => {
  it('parseArrangeSemester accepts 1 and 2', () => {
    expect(parseArrangeSemester(1)).toBe(1);
    expect(parseArrangeSemester('2')).toBe(2);
  });

  it('parseArrangeSemester rejects invalid', () => {
    expect(() => parseArrangeSemester(0)).toThrow();
    expect(() => parseArrangeSemester(3)).toThrow();
  });

  it('assignmentMatchesArrangeSemester', () => {
    expect(assignmentMatchesArrangeSemester(0, 1)).toBe(true);
    expect(assignmentMatchesArrangeSemester(1, 1)).toBe(true);
    expect(assignmentMatchesArrangeSemester(1, 2)).toBe(false);
    expect(assignmentMatchesArrangeSemester(2, 2)).toBe(true);
  });

  it('scheduleSemesterForRow maps ALL to arrange semester', () => {
    expect(scheduleSemesterForRow(0, 1)).toBe(1);
    expect(scheduleSemesterForRow(2, 1)).toBe(2);
  });

  it('curriculumKey includes semester', () => {
    expect(curriculumKey(10, 5, 1)).toBe('10|5|1');
    expect(curriculumKey(10, 5, null)).toBe(`10|5|${SEMESTER_ALL}`);
  });
});
