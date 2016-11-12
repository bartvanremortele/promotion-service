function factory(/* base */) {
  return {
    name: 'any',
    fn: (context, opContext, level, { any: ops, threshold: threshold = 0 }, evaluator) => {
      const data = { any: [] };
      let value = 0;
      for (const op of ops) {
        const thisOpContext = {};
        Object.keys(opContext).forEach(id => {
          thisOpContext[id] = opContext[id];
        });
        const result = evaluator.evaluate(context, thisOpContext, level + 1, op);
        if (result.data) {
          data.any.push(result.data);
          if (result.data.value > value) value = result.data.value;
        }
        if (result.ok) {
          Object.keys(thisOpContext).forEach(id => {
            opContext[id] = thisOpContext[id];
          });
          return {
            ok: true
          };
        }
      }
      data.value = value;
      if (value >= threshold && data.any.length > 0) {
        return {
          ok: false,
          data
        };
      }
      return {
        ok: false
      };

    }
  };
}

module.exports = factory;
