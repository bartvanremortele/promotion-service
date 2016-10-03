function factory(/* base */) {
  return {
    name: 'and',
    fn: (context, opContext, level, { and: ops }, evaluator) => {
      const thisOpContext = {};
      Object.keys(opContext).forEach(id => {
        thisOpContext[id] = opContext[id];
      });
      const data = { and: [] };
      let lastData;
      let trues = 0;
      // Evaluate all the operands to get the messages
      for (let op of ops) {
        const result = evaluator.evaluate(context, thisOpContext, level + 1, op);
        if (result.data) data.and.push(result.data);
        if (result.ok) {
          trues += 1;
        } else {
          lastData = result.data;
        }
      }
      if (trues === ops.length) {
        // All operands returned true, return true
        Object.keys(thisOpContext).forEach(id => {
          opContext[id] = thisOpContext[id];
        });
        return {
          ok: true
        };
      } else if (trues === ops.length - 1) {
        // Only one operand returned false, return false with the message
        return {
          ok: false,
          data: lastData
        };
      } else {
        // More than one operand returned false, return false
        return {
          ok: false
        };
      }
    }
  };
}

module.exports = factory;
