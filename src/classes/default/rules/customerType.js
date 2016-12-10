function factory(/* base */) {
  return {
    fn: (context, opContext, level, { customerType }, evaluator) => {
      const ok = context.user.type === customerType;
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
