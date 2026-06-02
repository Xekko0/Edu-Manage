/**
 * Intent detection — Admin / GVCN / GVBM (rules only).
 */
const { detectStaffIntentByRules } = require('./staff-intent.rules');

const detectStaffIntent = async (message, userRole, persona = 'gvbm') => {
  const rulesResult = detectStaffIntentByRules(message, userRole, persona);
  return { ...rulesResult, source: 'rules' };
};

module.exports = { detectStaffIntent };
