function factory(/* base */) {
  return {
    name: 'subtotal',
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
