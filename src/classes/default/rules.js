
// @formatter:off
/*

 if: {
   all: [
     {any: [
       {product: {id: '0001', quantity: 3}},
       {product: {id: '0002', quantity: 3}},
       {category: {id: 'aaa', quantity: 3}}
     ]},
     {subtotal: 100.00},
     {usertType: 'VIP'},
     {period: {
       from : '2016-09-21T14:00:00.000+0000',
       until: '2017-09-21T16:00:00.000+0000'
     }}
   ]
 }

*/
// @formatter:on

function promotionFn(base) {
  const rulesEvaluator = new base.utils.Evaluator().use('promotions:default:rules');

  const debugJson = (title, json) => {
    base.logger.debug('[promotions]', title);
    JSON
      .stringify(json, null, 2)
      .split(/(?:\r\n|\r|\n)/g)
      .forEach(line => {
        base.logger.debug('[promotions]', line);
      });
  };

  return (context) => {
    if (base.logger.isDebugEnabled()) {
      base.logger.debug(`[promotions] Firing '${context.promotion.title}' [${context.promotion.id}] check for cart [${context.cart.cartId}]`);
    }

    const opContext = {};
    const result = rulesEvaluator.evaluate(context, opContext, 0, context.promotion.if);

    if (result.ok) {
      // Promotion condition fulfilled!

      // Copy the promoContext to context.cartContext to avoid product reuse
      Object.keys(opContext).forEach(itemId => {
        if (opContext[itemId].quantityUsed > 0) {
          const cartItemContext = context.cartContext[itemId] = context.cartContext[itemId]
            || {
              quantityUsed: 0,
              promos: []
            };
          cartItemContext.quantityUsed += opContext[itemId].quantityUsed;
          Array.prototype.push
            .apply(cartItemContext.promos, opContext[itemId].promos);
        }
      });

      // Copy the Promotion result to the fulfilledPromos to easy the access
      const items = [];
      Object.keys(opContext).forEach(itemId => {
        items.push({
          itemId,
          quantityUsed: opContext[itemId].quantityUsed
        });
      });
      context.fulfilledPromos.push({
        id: context.promotion.id,
        items
      });
    } else {
      // Promotion not fulfilled, only copy the data
      if (result.data) {
        if (!Array.isArray(result.data)) result.data = [result.data];
        if (result.data.length > 0) {
          context.almostFulfilledPromos.push({
            id: context.promotion.id,
            data: result.data
          });
        }
      }
    }

    // Log the output
    if (base.logger.isDebugEnabled()) {
      if (context.fulfilledPromos.length > 0) {
        debugJson('fulfilledPromos:', context.fulfilledPromos);
      }
      if (context.almostFulfilledPromos.length > 0) {
        debugJson('almostFulfilledPromos:', context.almostFulfilledPromos);
      }
    }
  };
}

module.exports = promotionFn;
