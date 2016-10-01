const moment = require('moment');

// @formatter:off
/*

 if: {
   and: [
     {any: [
       {product: {id: '0001', quantity: 3}},
       {product: {id: '0002', quantity: 3}},
       {category: {id: 'aaa', quantity: 3}}
     ]},
     {subtotal_gte: 100.00},
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

  function indent(level) {
    return ' '.repeat(level * 2);
  }

  function interpolate(s, props) {
    return s.replace(/\$\{(\w+)\}/g, function (match, expr) {
      return props[expr];
    });
  }

  /* Business */

  function productFn(context, promoContext, level, { product: promoProduct, category: promoCategory }) {
    // Search the product/category in the cart, counting against the threshold (quantity)
    let collectedQuantity = 0;
    let promoQuantity = promoProduct ? promoProduct.quantity : promoCategory.quantity;
    const collectedItems = [];
    for (const item of context.cart.items) {
      // Is this a product the promotion wants?
      let pass = false;
      if (promoProduct && promoProduct.id === item.productId) {
        pass = true;
      }
      if (promoCategory &&
        context.products[item.productId]
          .categories.indexOf(promoCategory.id) !== -1) {
        pass = true;
      }
      // Is there enough quantity?
      if (pass) {
        const cartItemContext = context.cartContext[item.id] = context.cartContext[item.id] || {
            quantityUsed: 0,
            promos: []
          };
        const promoItemContext = promoContext[item.id] = promoContext[item.id] || {
            quantityUsed: 0,
            promos: []
          };
        const quantityNeeded = promoQuantity - collectedQuantity;
        const quantityAvailable = item.quantity - cartItemContext.quantityUsed - promoItemContext.quantityUsed;
        if (quantityAvailable > 0) {
          const quantityToUse = quantityAvailable > quantityNeeded
            ? quantityNeeded : quantityAvailable;
          collectedQuantity += quantityToUse;
          collectedItems.push({ promoId: context.promotion.id, itemId: item.id, quantityToUse });
        }
        if (collectedQuantity === promoQuantity) break;
      }
    }
    // Store the results
    if (collectedQuantity === promoQuantity) {
      collectedItems.forEach(collectedItem => {
        const promoItemContext = promoContext[collectedItem.itemId];
        promoItemContext.promos.push({
          promotion: context.promotion.id,
          quantityToUse: collectedItem.quantityToUse
        });
        promoItemContext.quantityUsed += collectedItem.quantityToUse;
      });
      return {
        ok: true
      };
    } else if (promoQuantity - collectedQuantity === 1) {
      const data = {
        collectedQuantity,
        promoQuantity,
        missingQuantity: promoQuantity - collectedQuantity,
        type: promoProduct ? 'PRODUCT' : 'CATEGORY',
        code: promoProduct ? promoProduct.id : promoCategory.id,
        title: (promoProduct && context.products[promoProduct.id])
          ? context.products[promoProduct.id].title : ''
      };
      data.message = interpolate(promoProduct ? promoProduct.message : promoCategory.message, data);
      return {
        ok: false,
        data
      };
    }
    return {
      ok: false
    };
  }

  function subtotalFn(context, promoContext, level, { subtotal_gte: threshold }) {
    return {
      ok: true
    };
  }

  function periodFn(context, promoContext, level, { period: { from, until } }) {
    const now = moment();
    return {
      ok: now.isAfter(from) && now.isBefore(until)
    };
  }

  function userTypeFn(context, level, { userType: userType }) {
    return {
      ok: context.user.type === userType
    };
  }

  /* Logical */

  function andFn(context, promoContext, level, { and: ops }) {
    const thisPromoContext = {};
    Object.keys(promoContext).forEach(id => {
      thisPromoContext[id] = promoContext[id];
    });
    const data = { and: [] };
    let lastData;
    let trues = 0;
    // Evaluate all the operands to get the messages
    for (let op of ops) {
      const result = evaluate(context, thisPromoContext, level + 1, op);
      if (result.data) data.and.push(result.data);
      if (result.ok) {
        trues += 1;
      } else {
        lastData = result.data;
      }
    }
    if (trues === ops.length) {
      // All operands returned true, return true
      Object.keys(thisPromoContext).forEach(id => {
        promoContext[id] = thisPromoContext[id];
      });
      return {
        ok: true
      };
    } else if (trues === ops.length - 1) {
      // Only one operand returned false, return false with the message
      return {
        ok: false,
        data: lastData
      };
    } else {
      // More than one operand returned false, return false
      return {
        ok: false
      };
    }
  }

  function anyFn(context, promoContext, level, { any: ops }) {
    const data = { any: [] };
    for (let op of ops) {
      const thisPromoContext = {};
      Object.keys(promoContext).forEach(id => {
        thisPromoContext[id] = promoContext[id];
      });
      const result = evaluate(context, thisPromoContext, level + 1, op);
      if (result.data) data.any.push(result.data);
      if (result.ok) {
        Object.keys(thisPromoContext).forEach(id => {
          promoContext[id] = thisPromoContext[id];
        });
        return {
          ok: true
        };
      }
    }
    return {
      ok: false,
      data: data.any
    };
  }

  /* Control */

  const fns = {
    and: andFn,
    any: anyFn,
    product: productFn,
    category: productFn,
    collection: productFn,
    subtotal_gte: subtotalFn,
    period: periodFn,
    userType: userTypeFn
  };

  function evaluate(context, promoContext, level, op) {
    base.logger.debug(indent(level), Object.keys(op)[0], JSON.stringify(op).substring(0, 200));
    const result = fns[Object.keys(op)[0]](context, promoContext, level, op);
    base.logger.debug(indent(level), 'result:', JSON.stringify(result).substring(0, 200));
    return result;
  }

  return (context /* { result, promotion, cart, products, user } */) => {

    if (base.logger.isDebugEnabled()) {
      base.logger.debug(`[promotions] Firing '${context.promotion.id} [${context.promotion.class}] ${context.promotion.title}' promotion check`);
      base.logger.debug(`[promotions] ${JSON.stringify(context.promotion.if, null, 2)}`);
    }

    const promoContext = {};
    const result = evaluate(context, promoContext, 0, context.promotion.if);

    if (result.ok) {
      // Promotion condition fulfilled!

      // Copy the promoContext to context.cartContext, to not allow product reuse
      Object.keys(promoContext).forEach(itemId => {
        context.cartContext[itemId].quantityUsed += promoContext[itemId].quantityUsed;
        Array.prototype.push.apply(context.cartContext[itemId].promos, promoContext[itemId].promos);
    });

      // Copy the Promotion result to the cartContext to easy the access
      const items = [];
      Object.keys(promoContext).forEach(itemId => {
        items.push({
          itemId,
          quantityUsed: promoContext[itemId].quantityUsed
        })
      });
      context.fulfilledPromos.push({
        id: context.promotion.id,
        items
      });
    } else {
      // Promotion not fulfilled, only copy the data
      context.almostFulfilledPromos.push({
        id: context.promotion.id,
        data: result.data
      });
    }

    // console.log('*** This promo result');
    // console.log(JSON.stringify(result, null, 2));
    // console.log('*** This promo context');
    // console.log(JSON.stringify(promoContext, null, 2));
    // console.log('*** Cart context');
    // console.log(JSON.stringify(context.cartContext, null, 2));
    console.log('*** Fulfilled promos');
    console.log(JSON.stringify(context.fulfilledPromos, null, 2));
    console.log('*** Almost fulfilled promos');
    console.log(JSON.stringify(context.almostFulfilledPromos, null, 2));

  };
}

module.exports = promotionFn;
