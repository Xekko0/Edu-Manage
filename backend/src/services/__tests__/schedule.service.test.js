/**
 * Unit tests — TKB: config, sinh từ phân công, xếp lại.
 */
jest.mock('../../models', () => ({
  Schedule: {
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    destroy: jest.fn(),
  },
  TeacherAssignment: { findAll: jest.fn(), findOne: jest.fn() },
  Class: { findByPk: jest.fn(), findAll: jest.fn() },
  TimetableConfig: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Subject: { findByPk: jest.fn() },
  User: {},
  CurriculumStandard: { findOne: jest.fn(), findAll: jest.fn() },
  Room: { findAll: jest.fn() },
}));

const {
  Schedule, TeacherAssignment, Class, TimetableConfig, Subject, CurriculumStandard, Room,
} = require('../../models');
const scheduleService = require('../schedule.service');

const mockConfig = {
  school_year: '2024-2025',
  days_of_week: [1, 2, 3, 4, 5],
  morning_periods: 5,
  afternoon_periods: 5,
  afternoon_enabled: true,
  sessions: ['morning', 'afternoon'],
};

beforeEach(() => {
  jest.clearAllMocks();
  TimetableConfig.findOne.mockResolvedValue({
    toJSON: () => mockConfig,
    ...mockConfig,
  });
  Subject.findByPk.mockResolvedValue({ preferred_room_type: 'classroom', code: 'TOAN' });
  Room.findAll.mockResolvedValue([
    { code: 'P10A1', name: 'Phòng 10A1', room_type: 'classroom', is_active: true },
    { code: 'LAB1', name: 'Phòng Lab', room_type: 'lab', is_active: true },
  ]);
  CurriculumStandard.findOne.mockImplementation(({ where }) => Promise.resolve({
    periods_per_week: 2,
    grade_level: where?.grade_level,
    subject_id: where?.subject_id,
  }));
  CurriculumStandard.findAll.mockResolvedValue([]);
  Class.findAll.mockResolvedValue([]);
});

describe('schedule.service — buildSlotOrder + config', () => {
  test('buildSlotOrder theo config — 50 ô (T2–T6, 2 ca, 5 tiết)', () => {
    const order = scheduleService.buildSlotOrder(mockConfig);
    expect(order).toHaveLength(50);
  });

  test('config tắt ca chiều — 25 ô', () => {
    const order = scheduleService.buildSlotOrder({
      ...mockConfig,
      afternoon_enabled: false,
      sessions: ['morning'],
    });
    expect(order).toHaveLength(25);
  });
});

describe('schedule.service — generateClassSchedule', () => {
  beforeEach(() => {
    let id = 1;
    Schedule.create.mockImplementation((data) => Promise.resolve({ id: id++, ...data }));
    Schedule.destroy.mockResolvedValue(0);
    Schedule.findAll.mockResolvedValue([]);

    Class.findByPk.mockResolvedValue({ id: 1, name: '10A1', grade_level: 10 });
    Class.findAll.mockResolvedValue([{ id: 1, name: '10A1', grade_level: 10, is_active: true }]);
    TeacherAssignment.findAll.mockResolvedValue([
      { id: 10, teacher_id: 5, subject_id: 2, periods_per_week: 2, class_id: 1, subject: { name: 'Toán' } },
    ]);
  });

  test('sinh tiết từ phân công — gọi create', async () => {
    const result = await scheduleService.generateClassSchedule({
      class_id: 1,
      school_year: '2024-2025',
      clearExisting: true,
    });
    expect(result.mode).toBe('generate');
    expect(result.created).toBe(2);
    expect(Schedule.create).toHaveBeenCalledTimes(2);
  });
});

describe('schedule.service — repack và GV trùng', () => {
  beforeEach(() => {
    Schedule.update.mockResolvedValue([1]);
    Schedule.count.mockImplementation(() => Promise.resolve(2));
  });

  test('GV 2 lớp trùng slot — update không create', async () => {
    Schedule.findAll.mockResolvedValue([
      {
        id: 1, class_id: 1, teacher_id: 7, subject_id: 1,
        day_of_week: 1, session: 'morning', period: 1, school_year: '2024-2025',
      },
      {
        id: 2, class_id: 2, teacher_id: 7, subject_id: 1,
        day_of_week: 1, session: 'morning', period: 1, school_year: '2024-2025',
      },
    ]);

    const result = await scheduleService.resolveConflictsSchedule({
      school_year: '2024-2025',
    });

    expect(Schedule.create).not.toHaveBeenCalled();
    expect(result.moved).toBeGreaterThanOrEqual(1);
    expect(result.schedules_before).toBe(result.schedules_after);
  });
});

describe('schedule.service — generateSchoolSchedule', () => {
  test('2 lớp cùng GV — không trùng khung giờ', async () => {
    const createdSlots = [];
    let scheduleId = 1;
    Schedule.create.mockImplementation((data) => {
      createdSlots.push({
        class_id: data.class_id,
        teacher_id: data.teacher_id,
        day_of_week: data.day_of_week,
        session: data.session,
        period: data.period,
      });
      return Promise.resolve({ id: scheduleId++, ...data });
    });
    Schedule.destroy.mockResolvedValue(0);
    Schedule.findAll.mockResolvedValue([]);

    Class.findAll.mockResolvedValue([
      { id: 1, name: '10A1', grade_level: 10 },
      { id: 2, name: '10A2', grade_level: 10 },
    ]);
    Class.findByPk.mockImplementation((id) => Promise.resolve({
      id, name: id === 1 ? '10A1' : '10A2', grade_level: 10,
    }));
    Class.findAll.mockResolvedValue([
      { id: 1, name: '10A1', grade_level: 10, is_active: true },
      { id: 2, name: '10A2', grade_level: 10, is_active: true },
    ]);
    TeacherAssignment.findAll.mockImplementation(({ where }) => {
      if (where.class_id === 1) {
        return Promise.resolve([
          { id: 10, teacher_id: 7, subject_id: 1, periods_per_week: 2, class_id: 1 },
        ]);
      }
      return Promise.resolve([
        { id: 11, teacher_id: 7, subject_id: 1, periods_per_week: 2, class_id: 2 },
      ]);
    });

    await scheduleService.generateSchoolSchedule({
      school_year: '2024-2025',
      clearExisting: true,
    });

    const byTeacher = new Map();
    for (const s of createdSlots) {
      const key = `${s.teacher_id}|${s.day_of_week}|${s.session}|${s.period}`;
      expect(byTeacher.has(key)).toBe(false);
      byTeacher.set(key, s.class_id);
    }
    expect(createdSlots.length).toBe(4);
  });
});
