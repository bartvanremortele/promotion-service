function factory(/* base */) {
  return {
    name: 'userType',
    fn: (context, opContext, level, { userType: userType }, evaluator) => {
      return {
        ok: context.user.type === userType
      };
    }
  };
}

module.exports = factory;
