/**
 * Tool LLM — hội thoại tự do (Admin/GV).
 */
const staffConversational = require('../../ai/staff-conversational.service');

const toolId = 'llm.conversational.staff';
const intents = ['general_chat'];

const execute = async (ctx, options = {}) => {
  const { userMessage, chatHistory, persona } = options;
  return staffConversational.answerStaffFreeform({
    message: userMessage,
    ctx,
    chatHistory,
    persona: persona || ctx.persona,
  });
};

module.exports = { toolId, audience: 'staff', intents, execute, source: 'llm' };
