function factory(/* base */) {
  return {
    fn: (context, opContext, level, { subtotal_gte: threshold }, evaluator) => {
      return {
        ok: true,
        data: {
          value: 1
        }
      };
    }
  };
}

module.exports = factory;
