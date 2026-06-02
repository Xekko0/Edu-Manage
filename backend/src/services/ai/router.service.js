/**
 * @deprecated Dùng chat/dispatcher — giữ export cho tương thích.
 */
const dispatcher = require('../chat/dispatcher.service');

const route = async (ctx, options = {}) => {
  const wrapped = await dispatcher.dispatchFamily(ctx, options);
  const { meta, ...result } = wrapped;
  return result;
};

module.exports = { route };
