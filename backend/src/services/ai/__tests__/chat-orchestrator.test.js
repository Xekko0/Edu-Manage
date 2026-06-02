/**
 * Unit tests — resolvePersona & intent rules.
 */
const { resolvePersona, PERSONAS } = require('../chat-orchestrator.service');
const { detectIntentByRules } = require('../intent.rules');
const { detectStaffIntentByRules } = require('../staff-intent.rules');
const { enforceChatScope } = require('../../../middleware/chatScope.middleware');

jest.mock('../../../models', () => ({
  Class: { count: jest.fn() },
}));

const { Class } = require('../../../models');

describe('resolvePersona', () => {
  it('maps admin, parent, student', async () => {
    expect(await resolvePersona({ role: 'admin', id: 1 })).toBe('admin');
    expect(await resolvePersona({ role: 'parent', id: 2 })).toBe('parent');
    expect(await resolvePersona({ role: 'student', id: 3 })).toBe('student');
  });

  it('maps subject with homeroom to gvcn', async () => {
    Class.count.mockResolvedValue(1);
    expect(await resolvePersona({ role: 'subject', id: 10 })).toBe('gvcn');
  });

  it('maps subject without homeroom to gvbm', async () => {
    Class.count.mockResolvedValue(0);
    expect(await resolvePersona({ role: 'subject', id: 11 })).toBe('gvbm');
  });

  it('maps homeroom role to gvcn', async () => {
    expect(await resolvePersona({ role: 'homeroom', id: 12 })).toBe('gvcn');
  });
});

describe('PERSONAS', () => {
  it('has 5 personas', () => {
    expect(PERSONAS).toEqual(expect.arrayContaining(['admin', 'gvcn', 'gvbm', 'parent', 'student']));
  });
});

describe('family intent rules', () => {
  it('detects tuition and compare', () => {
    expect(detectIntentByRules('Học phí đã đóng chưa').intent).toBe('view_tuition');
    expect(detectIntentByRules('So sánh các môn').intent).toBe('compare_subjects');
  });

  it('detects schedule / TKB', () => {
    expect(detectIntentByRules('TKB').intent).toBe('view_schedule');
    expect(detectIntentByRules('Lịch học tuần này').intent).toBe('view_schedule');
  });
});

describe('staff intent rules', () => {
  it('detects help and blocks gvbm attendance via scope', () => {
    expect(detectStaffIntentByRules('Tôi có thể làm gì', 'subject', 'gvcn').intent).toBe('help_features');
    const intent = detectStaffIntentByRules('Điểm danh lớp', 'subject', 'gvbm');
    expect(intent.intent).toBe('view_class_attendance');
    const block = enforceChatScope('gvbm', intent);
    expect(block).not.toBeNull();
    expect(block.message).toMatch(/GVCN/i);
  });
});
