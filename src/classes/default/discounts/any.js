function factory(/* base */) {
  return {
    fn: (context, opContext, level, { any: ops }, evaluator) => {
      for (const op of ops) {
        const result = evaluator.evaluate(context, {}, level + 1, op);
        if (result.ok) {
          return {
            ok: true
          };
        }
      }
      return {
        ok: false
      };
    }
  };
}

module.exports = factory;
