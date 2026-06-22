'use strict';

const { createBusyState } = require('../../busy-state');
const { isTeacherUnavailable, isValidPlacement } = require('../hard-checker');

describe('hard-checker', () => {
  test('isTeacherUnavailable — cả ngày', () => {
    const unavail = [{ teacher_id: 5, day_of_week: 2, session: null, period: null }];
    expect(isTeacherUnavailable(unavail, 5, { day_of_week: 2, session: 'morning', period: 1 }))
      .toBe(true);
    expect(isTeacherUnavailable(unavail, 5, { day_of_week: 3, session: 'morning', period: 1 }))
      .toBe(false);
  });

  test('isValidPlacement — pool lab đầy', () => {
    const busy = createBusyState();
    const slot = { day_of_week: 2, session: 'morning', period: 1 };
    const roomPool = { lab: 1, classroom: 5 };
    busy.roomTypeSlotCount.set('lab|2|morning|1', 1);
    expect(isValidPlacement({
      busy,
      classId: 2,
      teacherId: 20,
      subjectId: 3,
      subjectCode: 'HOA',
      preferredRoomType: 'lab',
      slot,
      roomName: 'Lab1',
      roomId: 9,
      roomType: 'lab',
      unavailability: [],
      roomPool,
    })).toBe(false);
  });
});
