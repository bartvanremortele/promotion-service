/*
 Product & Category discounts
 */
function factory(/* base */) {
  return {
    alias: ['category'],
    fn: (context, opContext, level, { product: dicountProduct, category: dicountCategory }, evaluator) => {
      const quantityToDiscount = dicountProduct ? dicountProduct.quantity : dicountCategory.quantity;
      const discountToDiscount = dicountProduct ? dicountProduct.discount : dicountCategory.discount;
      let quantityDiscounted = 0;
      context.ffp.items.forEach(promoItem => {
        const cartItem = context.cart.items.find(it => it.id === promoItem.itemId);
        if (cartItem.productId === dicountProduct.id && quantityDiscounted < quantityToDiscount) {
          const quantityMissing = quantityToDiscount - quantityDiscounted;
          const quantityAvailable = (quantityToDiscount - quantityDiscounted) > cartItem.quantity
            ? cartItem.quantity
            : quantityMissing;
          quantityDiscounted += quantityAvailable;
          const discount = discountToDiscount.isPercentage
            ? Math.round(cartItem.price * quantityAvailable * discountToDiscount.rate / 100)
            : discountToDiscount.rate * quantityAvailable;
          promoItem.quantityApplied = (promoItem.quantityApplied || 0) + quantityAvailable;
          cartItem.discountedItems = (cartItem.discountedItems || 0) + quantityAvailable;
          cartItem.discountedTotal = (cartItem.discountedTotal || 0) + discount;
          cartItem.discounts = cartItem.discounts || [];
          cartItem.discounts.push({
            promotionId: context.promotion.id,
            promotionTitle: context.promotion.title,
            quantity: quantityAvailable,
            discount
          });
        }
      });

      return {
        ok: true
      };
    }
  };
}

module.exports = factory;
