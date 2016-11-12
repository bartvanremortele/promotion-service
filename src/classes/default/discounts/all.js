function factory(/* base */) {
  return {
    fn: (context, opContext, level, { all: ops }, evaluator) => {
      let thisResult = true;
      for (const op of ops) {
        const result = evaluator.evaluate(context, {}, level + 1, op);
        thisResult = thisResult || result;
      }
      return {
        ok: thisResult
      };
    }
  };
}

module.exports = factory;
