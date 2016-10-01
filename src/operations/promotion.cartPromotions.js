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
        if (base.logger.isDebugEnabled()) base.logger.debug('[Promotions] promotions loaded');
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

  // Preload promotion classes
  const promotionClassesLocation = base.config.get('promotions:classes');
  const promotionClasses = {};
  Object.keys(promotionClassesLocation).forEach(key => {
    promotionClasses[key] = base.utils.loadModule(`promotions:classes:${key}`);
  });

  const op = {
    // TODO: create the promotion JsonSchema
    handler: (cart, reply) => {
      loadPromotions();
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
              fields: 'title,categories'
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
          promotions.forEach(promotion => {
            promotionClasses[promotion.class]({
              promotion,
              cart,
              products,
              cartContext,
              fulfilledPromos,
              almostFulfilledPromos
              /* ,user */
            });
          });
          reply(base.utils.genericResponse({
            cart,
            fulfilledPromos,
            almostFulfilledPromos
          }));
        })
        .catch(error => reply(base.utils.genericResponse(null, error)));
    }
  };
  return op;
}

// Exports the factory
module.exports = opFactory;
