function factory(/* base */) {
  return {
    name: 'any',
    fn: (context, opContext, level, { any: ops }, evaluator) => {
      const data = { any: [] };
      for (let op of ops) {
        const thisOpContext = {};
        Object.keys(opContext).forEach(id => {
          thisOpContext[id] = opContext[id];
        });
        const result = evaluator.evaluate(context, thisOpContext, level + 1, op);
        if (result.data) data.any.push(result.data);
        if (result.ok) {
          Object.keys(thisOpContext).forEach(id => {
            opContext[id] = thisOpContext[id];
          });
          return {
            ok: true
          };
        }
      }
      return {
        ok: false,
        data: data.any
      };
    }
  };
}

module.exports = factory;
