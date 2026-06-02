const { FALLBACK_CHIPS } = require('./shared');

const fallback = async () => ({
  type: 'fallback',
  message: 'Bạn có thể hỏi tự do về điểm, lịch, học phí, nhận xét, hoặc chọn gợi ý:',
  payload: null,
  chips: FALLBACK_CHIPS,
});

module.exports = {
  toolId: 'family.fallback',
  audience: 'family',
  intents: [],
  handlers: { fallback },
  fallback,
};
