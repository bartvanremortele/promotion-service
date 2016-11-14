/*
 Product & Category discounts
 */
function factory(/* base */) {
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
        }
      });

      return {
        ok: true
      };
    }
  };
}

module.exports = factory;
