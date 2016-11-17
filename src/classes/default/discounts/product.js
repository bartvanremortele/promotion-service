/*
 Product & Category discounts
 */
function factory(/* base */) {

  function calculateDiscount(item, quantity, discount) {

    if (discount.isPercentage) {
      // Discount a percentage
      // ie: price=100$, rate=10, discount=10$, discountedPrice=90$
      return Math.round(item.price * quantity * discount.rate / 100);
    }
    if (discount.isFixedPrice) {
      // The final price should be a fixed amount
      // ie: price=100$, rate=25, discount=75$, discountedPrice=25$
      return item.price * quantity - discount.rate * quantity;
    }
    // Discounts a fixed amount of money
    // ie: price=100$, rate=5, discount=5$, discountedPrice=95$
    return discount.rate * quantity;
  }

  return {
    alias: ['category'],
    fn: (context, opContext, level, { product: discountProduct, category: discountCategory }, evaluator) => {
      let quantityDiscounted = 0;
      context.ffp.items.forEach(promoItem => {
        const cartItem = context.cart.items.find(it => it.id === promoItem.itemId);
        // Is this a product the discount wants?
        let pass = false;
        if (discountProduct && cartItem.productId === discountProduct.id) {
          pass = true;
        }
        if (!pass && discountCategory) {
          const product = context.products[cartItem.productId];
          for (const categoryId of product.categories) {
            if (product.categoryPaths[categoryId].indexOf(discountCategory.id) !== -1) {
              pass = true;
              break;
            }
          }
        }
        if (pass) {
          const quantityToDiscount = discountProduct ? discountProduct.quantity : discountCategory.quantity;
          const discountToDiscount = discountProduct ? discountProduct.discount : discountCategory.discount;
          if (quantityDiscounted < quantityToDiscount) {
            const quantityMissing = quantityToDiscount - quantityDiscounted;
            const quantityAvailable = (quantityToDiscount - quantityDiscounted) > cartItem.quantity
              ? cartItem.quantity
              : quantityMissing;
            quantityDiscounted += quantityAvailable;
            const discount = calculateDiscount(cartItem, quantityAvailable, discountToDiscount);
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
        }
      });

      return {
        ok: true
      };
    }
  };
}

module.exports = factory;
