/**
 * Tool LLM — hội thoại tự do (PH/HS).
 */
const conversationalService = require('../../ai/conversational.service');

const toolId = 'llm.conversational.family';
const intents = ['general_chat'];

const execute = async (ctx, options = {}) => {
  const { userMessage, chatHistory, userRole, persona } = options;
  return conversationalService.answerFreeform({
    message: userMessage,
    childId: ctx.child_id,
    chatHistory,
    userRole,
    persona,
  });
};

module.exports = { toolId, audience: 'family', intents, execute, source: 'llm' };
