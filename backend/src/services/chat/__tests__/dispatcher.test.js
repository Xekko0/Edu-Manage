/**
 * Unit tests — registry & dispatcher contract.
 */
const {
  isLlmIntent,
  getResponseMode,
  LLM_INTENTS,
  TOOL_CATALOG,
  getFamilyHandler,
  getStaffHandler,
  getToolId,
} = require('../registry');
const { wrapToolResult } = require('../types');

describe('chat registry', () => {
  it('identifies LLM-only intents', () => {
    expect(LLM_INTENTS.has('general_chat')).toBe(true);
    expect(LLM_INTENTS.has('ai_advice')).toBe(true);
    expect(isLlmIntent('view_schedule')).toBe(false);
  });

  it('getResponseMode respects LLM config', () => {
    expect(getResponseMode('general_chat', true)).toBe('conversational');
    expect(getResponseMode('general_chat', false)).toBe('rules');
    expect(getResponseMode('view_scores', true)).toBe('rules');
  });

  it('catalog has family and staff module tools', () => {
    const ids = TOOL_CATALOG.map((t) => t.toolId);
    expect(ids).toContain('family.scores');
    expect(ids).toContain('staff.class_schedule');
    expect(ids).toContain('llm.advice');
  });

  it('maps intents to handlers', () => {
    expect(typeof getFamilyHandler('view_schedule')).toBe('function');
    expect(typeof getStaffHandler('view_class_schedule')).toBe('function');
    expect(getToolId('family', 'view_tuition')).toBe('family.tuition');
    expect(getToolId('staff', 'admin_stats')).toBe('staff.admin_stats');
  });
});

describe('wrapToolResult', () => {
  it('adds meta contract', () => {
    const out = wrapToolResult(
      { type: 'scores', message: 'ok', payload: [] },
      { intent: 'view_scores', source: 'module', toolId: 'family.scores' },
    );
    expect(out.meta).toEqual({
      source: 'module',
      toolId: 'family.scores',
      intent: 'view_scores',
    });
    expect(out.type).toBe('scores');
  });
});
