/**
 * ## `promotion.create` operation factory
 *
 * Create Promotion operation
 *
 * @param {base} Object The microbase object
 * @return {Function} The operation factory
 */
function opFactory(base) {
  const promotionsChannel = base.config.get('bus:channels:promotions:name');
  const op = {
    // TODO: create the promotion JsonSchema
    handler: (msg, reply) => {
      const promotion = new base.db.models.Promotion({
        title: msg.title,
        class: msg.class,
        active: msg.active,
        priority: msg.priority,
        if: msg.if
      });
      promotion.save()
        .then(savedPromotion => {
          if (base.logger.isDebugEnabled()) {
            base.logger.debug(`[promotion] promotion ${savedPromotion._id} created`);
          }

          base.bus.publish(`${promotionsChannel}.CREATE`,
            {
              new: savedPromotion.toObject({ virtuals: true }),
              data: msg
            }
          );
          return (reply(base.utils.genericResponse({ promotion: savedPromotion.toClient() })));
        })
        .catch(error => reply(base.utils.genericResponse(null, error)));
    }
  };
  return op;
}

// Exports the factory
module.exports = opFactory;
