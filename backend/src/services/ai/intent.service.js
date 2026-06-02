/**
 * Lớp 1 — Intent Detection (rules only, không LLM).
 */
const { detectIntentByRules } = require('./intent.rules');

const detectIntent = async (message) => {
  const rulesResult = detectIntentByRules(message);
  if (rulesResult.intent === 'unknown') {
    return { ...rulesResult, intent: 'general_chat', source: 'rules' };
  }
  return { ...rulesResult, source: 'rules' };
};

module.exports = { detectIntent };
