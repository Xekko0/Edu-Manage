const {
  buildSlotId,
  formatRoomDisplay,
  toStudentSlotView,
  validateLessonPatch,
} = require('../schedule-enrichment.service');

describe('schedule-enrichment.service', () => {
  test('buildSlotId', () => {
    expect(buildSlotId(2, 'morning', 1)).toBe('T2_morning_P1');
  });

  test('formatRoomDisplay with campus', () => {
    expect(formatRoomDisplay({ name: 'Phòng 201', campus: 'Cơ sở chính' }, null))
      .toBe('Phòng 201 (Cơ sở chính)');
    expect(formatRoomDisplay(null, 'Lab')).toBe('Lab');
  });

  test('toStudentSlotView', () => {
    const slot = toStudentSlotView({
      id: 5,
      day_of_week: 2,
      session: 'morning',
      period: 1,
      delivery_mode: 'offline',
      subject: { name: 'Toán' },
      teacher: { full_name: 'GV A' },
      room: 'P101',
    });
    expect(slot.slot_id).toBe('T2_morning_P1');
    expect(slot.subject).toBe('Toán');
    expect(slot.teacher_name).toBe('GV A');
  });

  test('validateLessonPatch requires URL for online', () => {
    expect(() => validateLessonPatch({ delivery_mode: 'online', online_meeting_url: '' }))
      .toThrow('Tiết online cần link');
    expect(() => validateLessonPatch({
      delivery_mode: 'online',
      online_meeting_url: 'https://zoom.us/j/123',
    })).not.toThrow();
  });
});
