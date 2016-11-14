function factory(/* base */) {
  return {
    fn: (context, opContext, level, { all: ops, threshold: threshold = 0 }, evaluator) => {
      const thisOpContext = {};
      Object.keys(opContext).forEach(id => {
        thisOpContext[id] = opContext[id];
      });
      const data = { all: [] };
      let trues = 0;
      let value = 0;
      // Evaluate all the operands to get the messages
      for (const op of ops) {
        const result = evaluator.evaluate(context, thisOpContext, level + 1, op);
        if (result.ok) trues += 1;
        if (result.data) {
          data.all.push(result.data);
          value += result.data.value;
        }
      }
      value = value / ops.length;
      data.value = value;

      if (trues === ops.length) {
        // All operands returned true, condition fulfilled
        Object.keys(thisOpContext).forEach(id => {
          opContext[id] = thisOpContext[id];
        });
        return {
          ok: true
        };
      } else if (value >= threshold && data.all.length + trues === ops.length) {
        // Condition almost fullfilled
        return {
          ok: false,
          data
        };
      } else {
        // Condition not fulfilled
        return {
          ok: false
        };
      }
    }
  };
}

module.exports = factory;
