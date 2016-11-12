const moment = require('moment');

function factory(/* base */) {
  return {
    fn: (context, opContext, level, { period: { from, until } }, evaluator) => {
      const now = moment();
      const ok = now.isAfter(from) && now.isBefore(until);
      return {
        ok,
        data: {
          value: ok ? 1 : 0
        }
      };
    }
  };
}

module.exports = factory;
