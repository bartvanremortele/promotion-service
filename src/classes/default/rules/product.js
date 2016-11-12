function factory(/* base */) {
  return {
    alias: ['category'],
    fn: (context, opContext, level, { product: promoProduct, category: promoCategory }, evaluator) => {
      // Search the product/category in the cart, counting against the threshold (quantity)
      let collectedQuantity = 0;
      const promoQuantity = promoProduct ? promoProduct.quantity : promoCategory.quantity;
      let threshold = promoProduct ? promoProduct.threshold : promoCategory.threshold;
      const collectedItems = [];
      for (const item of context.cart.items) {
        // Is this a product the promotion wants?
        let pass = false;
        if (promoProduct && promoProduct.id === item.productId) {
          pass = true;
        }
        const product = context.products[item.productId];
        if (!pass && promoCategory) {
          for (const categoryId of product.categories) {
            if (product.categoryPaths[categoryId].indexOf(promoCategory.id) !== -1) {
              pass = true;
              break;
            }
          }
        }
        // Is there enough quantity?
        if (pass) {
          const cartItemQuantityUsed = context.cartContext[item.id]
            ? context.cartContext[item.id].quantityUsed : 0;
          const promoItemContext = opContext[item.id] = opContext[item.id]
            || {
              quantityUsed: 0,
              promos: []
            };
          const quantityNeeded = promoQuantity - collectedQuantity;
          const quantityAvailable = item.quantity - cartItemQuantityUsed
            - promoItemContext.quantityUsed;
          if (quantityAvailable > 0) {
            const quantityToUse = quantityAvailable > quantityNeeded
              ? quantityNeeded : quantityAvailable;
            collectedQuantity += quantityToUse;
            collectedItems.push({ promoId: context.promotion.id, itemId: item.id, quantityToUse });
          }
          if (collectedQuantity === promoQuantity) break;
        }
      }
      // Calculate value
      const value = collectedQuantity === 0 ? 0.00 : collectedQuantity / promoQuantity;
      if (!threshold) threshold = collectedQuantity === 0 ? 1 : (promoQuantity - 1) / promoQuantity;

      // Store the results
      if (value === 1) {
        // Condition fulfilled
        collectedItems.forEach(collectedItem => {
          const promoItemContext = opContext[collectedItem.itemId];
          promoItemContext.promos.push({
            promotion: context.promotion.id,
            quantityToUse: collectedItem.quantityToUse
          });
          promoItemContext.quantityUsed += collectedItem.quantityToUse;
        });
        return {
          ok: true
        };
      } else if (value >= threshold) {
        // Condition almost fulfilled
        const data = {
          collectedQuantity,
          promoQuantity,
          threshold,
          value,
          type: promoProduct ? 'PRODUCT' : 'CATEGORY',
          code: promoProduct ? promoProduct.id : promoCategory.id,
          items: collectedItems.map(({ itemId, quantityToUse }) => ({
            itemId, quantityToUse
          }))
        };
        return {
          ok: false,
          data
        };
      }
      // Condition not fulfilled
      return {
        ok: false
      };
    }
  };
}

module.exports = factory;
