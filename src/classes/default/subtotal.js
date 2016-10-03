function factory(/* base */) {
  return {
    name: 'subtotal',
    fn: (context, opContext, level, { subtotal_gte: threshold }, evaluator) => {
      return {
        ok: true
      };
    }
  };
}

module.exports = factory;
