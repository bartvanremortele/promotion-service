function factory(/* base */) {
  return {
    name: 'product',
    fn: (context, opContext, level, { product: promoProduct, category: promoCategory }, evaluator) => {
      // Search the product/category in the cart, counting against the threshold (quantity)
      let collectedQuantity = 0;
      const promoQuantity = promoProduct ? promoProduct.quantity : promoCategory.quantity;
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
          const cartItemQuantityUsed = context.cartContext[item.id] ? context.cartContext[item.id] : 0;
          const promoItemContext = opContext[item.id] = opContext[item.id] || {
              quantityUsed: 0,
              promos: []
            };
          const quantityNeeded = promoQuantity - collectedQuantity;
          const quantityAvailable = item.quantity - cartItemQuantityUsed - promoItemContext.quantityUsed;
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
      } else if (promoQuantity - collectedQuantity === 1) {
        const data = {
          collectedQuantity,
          promoQuantity,
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
      return {
        ok: false
      };
    }
  };
}

module.exports = factory;
