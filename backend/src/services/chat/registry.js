/**
 * Tool registry — catalog tools (rules chọn intent → registry chọn handler).
 */
const adviceTool = require('./modules/advice.tool');
const conversationalTool = require('./modules/conversational.tool');
const staffConversationalTool = require('./modules/staff-conversational.tool');
const familyFallback = require('./modules/family/fallback.module');

const FAMILY_MODULES = [
  require('./modules/family/scores.module'),
  require('./modules/family/schedule.module'),
  require('./modules/family/attendance.module'),
  require('./modules/family/tuition.module'),
  require('./modules/family/evaluations.module'),
  require('./modules/family/notifications.module'),
  require('./modules/family/extracurricular.module'),
  require('./modules/family/contact-teacher.module'),
];

const STAFF_MODULES = [
  require('./modules/staff/help.module'),
  require('./modules/staff/admin-stats.module'),
  require('./modules/staff/assignments.module'),
  require('./modules/staff/class-students.module'),
  require('./modules/staff/class-scores.module'),
  require('./modules/staff/class-report.module'),
  require('./modules/staff/class-attendance.module'),
  require('./modules/staff/class-schedule.module'),
];

const LLM_INTENTS = new Set(['general_chat', 'ai_advice']);

const buildIntentIndex = (modules) => {
  const byIntent = {};
  for (const mod of modules) {
    for (const intent of mod.intents) {
      byIntent[intent] = {
        toolId: mod.toolId,
        audience: mod.audience,
        run: mod.handlers[intent],
      };
    }
  }
  return byIntent;
};

const FAMILY_BY_INTENT = buildIntentIndex(FAMILY_MODULES);
const STAFF_BY_INTENT = buildIntentIndex(STAFF_MODULES);

const TOOL_CATALOG = [
  ...FAMILY_MODULES,
  ...STAFF_MODULES,
  adviceTool,
  conversationalTool,
  staffConversationalTool,
  familyFallback,
].map((m) => ({
  toolId: m.toolId,
  audience: m.audience,
  intents: m.intents || [],
  source: m.source || 'module',
}));

const getFamilyHandler = (intent) => FAMILY_BY_INTENT[intent]?.run;
const getStaffHandler = (intent) => STAFF_BY_INTENT[intent]?.run;

const getToolId = (audience, intent) => {
  if (intent === 'ai_advice') return adviceTool.toolId;
  if (intent === 'general_chat') {
    return audience === 'staff' ? staffConversationalTool.toolId : conversationalTool.toolId;
  }
  const map = audience === 'staff' ? STAFF_BY_INTENT : FAMILY_BY_INTENT;
  return map[intent]?.toolId || intent;
};

const isLlmIntent = (intent) => {
  const name = typeof intent === 'string' ? intent : intent?.intent;
  return LLM_INTENTS.has(name);
};

const getResponseMode = (intent, llmConfigured) => {
  if (isLlmIntent(intent) && llmConfigured) return 'conversational';
  return 'rules';
};

const getFamilyFallback = () => familyFallback.fallback;

module.exports = {
  LLM_INTENTS,
  TOOL_CATALOG,
  FAMILY_BY_INTENT,
  STAFF_BY_INTENT,
  adviceTool,
  conversationalTool,
  staffConversationalTool,
  getFamilyHandler,
  getStaffHandler,
  getToolId,
  getFamilyFallback,
  isLlmIntent,
  getResponseMode,
};
