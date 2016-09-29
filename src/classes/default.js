const moment = require('moment');

// @formatter:off
/*
 if: {
   and: [
     {any: [
       {product: {id: '0001', quantity: 5}},
       {product: {id: 'By2ZWfAPnV', quantity: 1}},
       {category: {id: 'aaa', quantity: 1}}
       {category: {id: 'bb', quantity: 1}}
     ]},
     subtotal_gte: 100.00,
     usertType: 'VIP',
     {period: {
       from : '2016-09-21T14:00:00.000+0000',
       until: '2017-09-21T16:00:00.000+0000'
     }}
   ]
 }
*/
// @formatter:on

/* Business */

function productFn(context, { product: promoProduct, category: categoryPromo }) {
  console.log('productFn', promoProduct);

  // Reject products not in cart
  if (!context.products[promoProduct.id]) return false;

  // Search the product in the cart, counting against the threshold (quantity)
  let collectedQuantity = 0;
  const collectedItems = [];
  for (let item of context.cart.items) {
    item.quantityUsedInPromos = item.quantityUsedInPromos || 0;
    item.promos = item.promos || [];
    if (item.productId === promoProduct.id) {
      const quantityNeeded = promoProduct.quantity - collectedQuantity;
      const quantityAvailable = item.quantity - item.quantityUsedInPromos;
      if (quantityAvailable > 0) {
        const quantityToUse = quantityAvailable > quantityNeeded ? quantityNeeded : quantityAvailable;
        collectedQuantity += quantityToUse;
        collectedItems.push({ item, quantityToUse });
      }
      if (collectedQuantity >= promoProduct.quantity) break;
    }
  }
  // Store the results
  if (collectedQuantity === promoProduct.quantity) {
    collectedItems.forEach(collectedItem => {
      collectedItem.item.promos.push({
        promotion: context.promotion.id,
        quantityToUse: collectedItem.quantityToUse
      });
      collectedItem.item.quantityUsedInPromos += collectedItem.quantityToUse;
    });
    return true;
  }
  return false;
}

function categoryFn(context, { category: category }) {
  console.log('categoryFn', category);
  return false;
}

function collectionFn(context, { collection: collection }) {
  console.log('collectionFn', collection);
  return false;
}

function subtotalFn(context, { subtotal_gte: threshold }) {
  console.log('subtotalFn', threshold);
  return true;
}

function periodFn(context, { period: { from, until } }) {
  console.log('periodFn', from, until);
  const now = moment();
  return (now.isAfter(from) && now.isBefore(until));
}

function userTypeFn(context, { userType: userType }) {
  console.log('userTypeFn', user);
  return context.user.type === userType;
}

/* Logical */

function andFn(context, { and: ops }) {
  console.log('andFn', ops);
  for (let op of ops) {
    if (!evaluate(context, op)) return false;
  }
  return true;
}

function anyFn(context, { any: ops }) {
  console.log('anyFn', ops);
  for (let op of ops) {
    if (evaluate(context, op)) return true;
  }
  return false;
}

/* Control */

const fns = {
  and: andFn,
  any: anyFn,
  product: productFn,
  category: categoryFn,
  collection: collectionFn,
  subtotal_gte: subtotalFn,
  period: periodFn,
  userType: userTypeFn
};

function evaluate(context, op) {
  console.log('--------------------', Object.keys(op)[0]);
  let result = fns[Object.keys(op)[0]](context, op);
  console.log('--------------------', Object.keys(op)[0], result);
  return result;
}

/* Main export function */

function promotionFn(base) {
  return (context /* { promotion, cart, products, user } */) => {

    if (base.logger.isDebugEnabled()) {
      base.logger.debug(`[promotions] Firing '${context.promotion.id} [${context.promotion.class}] ${context.promotion.title}' promotion check`);
      base.logger.debug(`[promotions] ${JSON.stringify(context.promotion.if, null, 2)}`);
    }

    const passConditions = evaluate(context, context.promotion.if);

    console.log('passConditions', passConditions);
    context.cart.items.forEach(item => {
      console.log(item);
    });

    // Evaluate which product meets this promotion requirements
    //   if_matches_all
    //   if_matches_any

    // if (!passRestrictions(context /* { promotion, cart, products, user } */)) {
    //   return;
    // }

    let result = 'undefined';
    return result;
  };
}

module.exports = promotionFn;
