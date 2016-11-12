function factory(/* base */) {
  return {
    fn: (context, opContext, level, { userType: userType }, evaluator) => {
      const result = context.user.type === userType;
      return {
        ok,
        data: {
          value: result ? 1 : 0
        }
      };
    }
  };
}

module.exports = factory;
