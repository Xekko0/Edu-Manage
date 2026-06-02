/**
 * Dispatcher — rules chọn intent, registry chọn tool, wrap contract.
 */
const { wrapToolResult } = require('./types');
const registry = require('./registry');
const llm = require('../ai/llm.service');

const runFamilyTool = async (ctx, options = {}) => {
  const intent = ctx.intent;
  if (intent === 'ai_advice') {
    return registry.adviceTool.execute(ctx, { subject: ctx.subject });
  }
  if (intent === 'general_chat') {
    return registry.conversationalTool.execute(ctx, options);
  }
  const handler = registry.getFamilyHandler(intent);
  if (handler) return handler(ctx, options);
  if (options.userMessage) return registry.conversationalTool.execute(ctx, options);
  return registry.getFamilyFallback()(ctx, options);
};

const runStaffTool = async (ctx, options = {}) => {
  const intent = ctx.intent;
  if (intent === 'general_chat') {
    return registry.staffConversationalTool.execute(ctx, options);
  }
  const handler = registry.getStaffHandler(intent);
  if (handler) return handler(ctx, options);
  return registry.staffConversationalTool.execute(ctx, options);
};

const dispatchFamily = async (ctx, options = {}) => {
  const intent = ctx.intent;
  const raw = await runFamilyTool(ctx, options);
  const source = registry.isLlmIntent(intent) && llm.isConfigured() ? 'llm' : 'module';
  const toolId = registry.getToolId('family', intent);
  return wrapToolResult(raw, { intent, source, toolId });
};

const dispatchStaff = async (ctx, options = {}) => {
  const intent = ctx.intent;
  const raw = await runStaffTool(ctx, options);
  const source = registry.isLlmIntent(intent) && llm.isConfigured() ? 'llm' : 'module';
  const toolId = registry.getToolId('staff', intent);
  return wrapToolResult(raw, { intent, source, toolId });
};

const wrapScopeBlock = (block, intent) => wrapToolResult(block, {
  intent: typeof intent === 'string' ? intent : intent?.intent,
  source: 'module',
  toolId: 'chat_scope',
});

module.exports = {
  dispatchFamily,
  dispatchStaff,
  wrapScopeBlock,
};
