// @formatter:off
/*

 then: {
   discounts: [
     { product: {id: '0001', quantity: 1, discount: { rate: 99.99, isPercentage: false }}},
     { category: {id: 'aaa', quantity: -1, discount: { rate: 10, isPercentage: true }}}
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

    // context.promotion.then.discounts.forEach(discount => {
    //   discounts[Object.keys(discount)[0]]({
    //     promotion,
    //     cart,
    //     fulfilledPromos
    //   }, discount);
    // });

    const opContext = {};
    const result = discountsEvaluator.evaluate(context, opContext, 0, context.promotion.then);

    // if (result.ok) {
    //   // Promotion condition fulfilled!
    //
    //   // Copy the promoContext to context.cartContext, to not allow product reuse
    //   Object.keys(opContext).forEach(itemId => {
    //     if (opContext[itemId].quantityUsed > 0) {
    //       const cartItemContext = context.cartContext[itemId] = context.cartContext[itemId]
    //         || {
    //           quantityUsed: 0,
    //           promos: []
    //         };
    //       cartItemContext.quantityUsed += opContext[itemId].quantityUsed;
    //       Array.prototype.push
    //         .apply(cartItemContext.promos, opContext[itemId].promos);
    //     }
    //   });
    //
    //   // Copy the Promotion result to the fulfilledPromos to easy the access
    //   const items = [];
    //   Object.keys(opContext).forEach(itemId => {
    //     items.push({
    //       itemId,
    //       quantityUsed: opContext[itemId].quantityUsed
    //     });
    //   });
    //   context.fulfilledPromos.push({
    //     id: context.promotion.id,
    //     items
    //   });
    // } else {
    //   // Promotion not fulfilled, only copy the data
    //   if (result.data) {
    //     if (!Array.isArray(result.data)) result.data = [result.data];
    //     if (result.data.length > 0) {
    //       context.almostFulfilledPromos.push({
    //         id: context.promotion.id,
    //         data: result.data
    //       });
    //     }
    //   }
    // }
    //
    // // Log the output
    // if (base.logger.isDebugEnabled()) {
    //   if (context.fulfilledPromos.length > 0) {
    //     debugJson('fulfilledPromos:', context.fulfilledPromos);
    //   }
    //   if (context.almostFulfilledPromos.length > 0) {
    //     debugJson('almostFulfilledPromos:', context.almostFulfilledPromos);
    //   }
    // }
  };
}

module.exports = promotionFn;
