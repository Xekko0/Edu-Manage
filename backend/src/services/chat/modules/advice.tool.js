/**
 * Tool LLM — tư vấn học tập (family).
 */
const env = require('../../../config/env');
const scoreService = require('../../score.service');
const adviceService = require('../../ai/advice.service');

const SCHOOL_YEAR = () => env.CURRENT_SCHOOL_YEAR;

const toolId = 'llm.advice';
const intents = ['ai_advice'];

const execute = async (ctx, { subject } = {}) => {
  const sem = ctx.semester || 1;
  const all = await scoreService.getStudentSubjectAverages(ctx.child_id, sem, SCHOOL_YEAR());
  const advice = await adviceService.generateAdvice(all, subject || ctx.subject);
  return {
    type: 'advice',
    message: advice.content,
    payload: { subject: subject || ctx.subject, allScores: all },
    chips: advice.chips,
  };
};

module.exports = { toolId, audience: 'family', intents, execute, source: 'llm' };
