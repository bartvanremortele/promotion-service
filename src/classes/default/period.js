const moment = require('moment');

function factory(/* base */) {
  return {
    name: 'period',
    fn: (context, opContext, level, { period: { from, until } }, evaluator) => {
      const now = moment();
      return {
        ok: now.isAfter(from) && now.isBefore(until)
      };
    }
  };
}

module.exports = factory;
