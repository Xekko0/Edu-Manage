/**
 * Contract kết quả tool chat (module hoặc LLM).
 */
const wrapToolResult = (result, { intent, toolId, source = 'module' }) => ({
  type: result.type || 'chat',
  message: result.message || '',
  payload: result.payload ?? null,
  chips: result.chips,
  chip_actions: result.chip_actions,
  meta: {
    source,
    toolId: toolId || intent,
    intent,
  },
});

module.exports = { wrapToolResult };
