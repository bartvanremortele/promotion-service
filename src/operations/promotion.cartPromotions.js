/**
 * ## `promotion.cartPromotions` operation factory
 *
 * Calculate Cart Promotions operation
 *
 * @param {base} Object The microbase object
 * @return {Function} The operation factory
 */
function opFactory(base) {
  // Preload promotions
  let promotions;

  function loadPromotions() {
    base.db.models.Promotion
      .find({ active: true })
      .sort({ priority: 1 })
      .exec()
      .then(loadedPromotions => {
        promotions = loadedPromotions;
        if (base.logger.isDebugEnabled()) base.logger.debug('[promotions] promotions loaded');
      })
      .catch(error => {
        base.logger.error('[promotions]', error);
      });
  }

  loadPromotions();

  // Reload promotions on Promotions change
  const promotionsChannel = base.config.get('bus:channels:promotions:name');
  base.bus.subscribe(`${promotionsChannel}.*`, (/* msg */) => {
    loadPromotions();
  });

  const classesLocation = base.config.get('promotions:classes');
  // Preload rules classes
  const rulesClasses = {};
  Object.keys(classesLocation).forEach(key => {
    rulesClasses[key] = base.utils.loadModule(`promotions:classes:${key}:rules`);
  });
  // Preload discounts classes
  const discountsClasses = {};
  Object.keys(classesLocation).forEach(key => {
    discountsClasses[key] = base.utils.loadModule(`promotions:classes:${key}:discounts`);
  });

  const op = {
    // TODO: create the promotion JsonSchema
    handler: (cart, reply) => {
      if (base.logger.isDebugEnabled()) loadPromotions();
      // List unique product IDs
      const productIds = [...new Set(cart.items.reduce((list, item) => {
        list.push(item.productId);
        return list;
      }, []))];
      return Promise
        .resolve(productIds)
        .then(() => {
          // Preload products
          return base.services
            .call({
              name: 'catalog:product.list'
            }, {
              id: productIds.join(','),
              fields: 'categories',
              categoryPaths: true
            })
            .then(productsList => {
              return productsList.data.reduce((result, item) => {
                result[item.id] = item;
                return result;
              }, {});
            });
        })
        .then(products => {
          const cartContext = {};
          const fulfilledPromos = [];
          const almostFulfilledPromos = [];
          // Run each promotion until there is no change in the fullfilled outcome
          promotions.forEach(promotion => {
            let last = 0;
            let previous = 0;
            do {
              previous = last;
              rulesClasses[promotion.class]({
                promotion,
                cart,
                products,
                cartContext,
                fulfilledPromos,
                almostFulfilledPromos
                /* ,user */
              });
              last = fulfilledPromos.length;
            } while (last > previous);
          });
          if (fulfilledPromos.length > 0) {
            // Apply the product discounts
            promotions.forEach(promotion => {
              discountsClasses[promotion.class]({
                promotion,
                cart,
                fulfilledPromos
              });
            });
          }
          reply(base.utils.genericResponse({
            almostFulfilledPromos,
            itemDiscounts: cart.items
              .filter(item => item.discounts)
              .map(({ id, discounts }) => ({
                id,
                discounts
              }))
          }));
        })
        .catch(error => reply(base.utils.genericResponse(null, error)));
    }
  };
  return op;
}

// Exports the factory
module.exports = opFactory;
