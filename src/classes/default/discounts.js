// @formatter:off
/*

 then: {
   all: [
     { product: {id: '0001', quantity: 1, discount: { rate: 99.99, isPercentage: false }}},
     { category: {id: 'aaa', quantity: 1, discount: { rate: 10, isPercentage: true }}}
   ]
 }

*/
// @formatter:on

function promotionFn(base) {
  const discountsEvaluator = new base.utils.Evaluator().use('promotions:default:discounts');

  return (context) => {
    if (base.logger.isDebugEnabled()) {
      base.logger.debug(`[promotions] Firing '${context.promotion.title}' [${context.promotion.id}] discounts for cart [${context.cart.cartId}]`);
    }
    context.fulfilledPromos.forEach(ffp => {
      if (ffp.id === context.promotion.id) {
        const opContext = {};
        const result = discountsEvaluator.evaluate(
          {
            promotion: context.promotion,
            cart: context.cart,
            products: context.products,
            ffp
          },
          opContext,
          0,
          context.promotion.then
        );
      }
    });
  };
}

module.exports = promotionFn;
