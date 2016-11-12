/*
 Product & Category discounts
 */
function factory(/* base */) {
  return {
    name: 'product',
    alias: ['category'],
    fn: (context, opContext, level, { product: dicountProduct, category: dicountCategory }, evaluator) => {
      const promo = context.fulfilledPromos.find(p => p.id === context.promotion.id);
      const quantityToDiscount = dicountProduct ? dicountProduct.quantity : dicountCategory.quantity;

      // console.log('--- discount ---');
      // console.log(dicountProduct);
      // console.log('--- fulfilled promo ---');
      // console.log(JSON.stringify(promo, null, 2));

      let quantityDiscounted = 0;
      promo.items.forEach(promoItem => {
        const cartItem = context.cart.items.find(it => it.id === promoItem.itemId);
        if (cartItem.productId === dicountProduct.id && quantityDiscounted < quantityToDiscount) {
          const quantityMissing = quantityToDiscount - quantityDiscounted;
          const quantityAvailable = (quantityToDiscount - quantityDiscounted) > cartItem.quantity
            ? cartItem.quantity
            : quantityMissing;
          quantityDiscounted += quantityAvailable;
          promoItem.quantityApplied = (promoItem.quantityApplied | 0) + quantityAvailable;
          cartItem.discountedItems = quantityAvailable;
          cartItem.discountedTotal = dicountProduct.discount.isPercentage
            ? Math.round(cartItem.price * quantityAvailable * dicountProduct.discount.rate / 100)
            : dicountProduct.discount.rate * quantityAvailable;
        }
      });

      return {
        ok: true
      };
    }
  };
}

module.exports = factory;
