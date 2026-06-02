/**
 * @deprecated Dùng chat/dispatcher — giữ export cho tương thích.
 */
const dispatcher = require('../chat/dispatcher.service');

const routeStaff = async (ctx, options = {}) => {
  const wrapped = await dispatcher.dispatchStaff(ctx, options);
  const { meta, ...result } = wrapped;
  return result;
};

module.exports = { routeStaff };
