const shortId = require('shortid');

const Code = require('code');
const Lab = require('lab');
const nock = require('nock');

// shortcuts
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const beforeEach = lab.beforeEach;
const after = lab.after;
const it = lab.it;
const expect = Code.expect;

const base = require('../index.js');
const server = base.services.server;

const defaultHeaders = base.config.get('test:defaultHeaders');

const defaultPromoClass = 'default';

// Check the environment
if (process.env.NODE_ENV !== 'test') {
  console.log('\n[test] THIS ENVIRONMENT IS NOT FOR TEST!\n');
  process.exit(1);
}
// Check the database
if (!base.db.url.includes('test')) {
  console.log('\n[test] THIS DATABASE IS NOT A TEST DATABASE!\n');
  process.exit(1);
}

// Helper to clean the DB
function cleaner(callback) {
  const db = base.db.connections[0];
  var count = Object.keys(db.collections).length;
  Object.keys(db.collections).forEach(colName => {
    const collection = db.collections[colName];
    collection.drop(() => {
      if (--count <= 0 && callback) {
        callback();
      }
    });
  });
}

// Helper to clean the database
function cleanDB(done) {
  return cleaner(done);
}

// Helper to initialize the database
function initDB(done) {
  return cleanDB(done);
}

// Helper to inject a call with default parameters
function callService(options) {
  options.method = options.method || 'POST';
  options.headers = options.headers || defaultHeaders;
  return server.inject(options);
}

// Helper to create promotions
function createPromotion(payload) {
  Object.assign(payload, {
    title: 'Promotion',
    class: defaultPromoClass,
    active: true,
    priority: 100
  });
  return callService({
    url: '/services/promotion/v1/promotion.create',
    payload
  });
}

// Helper to evaluate promotions
function evaluatePromotions(cart) {
  return callService({
    url: '/services/promotion/v1/promotion.cartPromotions?cartId=H19PRsec',
    payload: cart
  });
}

// Helper to mock a successful stock:reserve call
function mockProductList(id, fields) {
  const ids = id.split(',');
  nock('http://gateway')
    .post('/services/catalog/v1/product.list', {
      id,
      fields
    })
    .reply(200, {
      ok: true,
      page: { limit: 10, skip: 0 },
      data: ids.map(id => ({ id, categories: ['BJeVBrmsV'] }))
    });
}

/*
 Promotion Tests
 */

describe('Promotion CRUDs', () => {
  beforeEach(done => {
    initDB(done);
  });
  after(done => {
    cleanDB(done);
  });

  it('creates a Promotion', done => {
    const payload = {
      if: {}
    };
    createPromotion(payload)
      .then(response => {
        expect(response.statusCode).to.equal(200);
        // Expected result:
        //
        // {
        //   ok: true,
        //   promotion: {
        //     id: 'SJp7i8TT',
        //     title: 'Promotion',
        //     class: 'default',
        //     active: true,
        //     priority: 100,
        //     if: {}
        //   }
        // }
        expect(response.result.ok).to.be.a.boolean().and.to.equal(true);
        expect(response.result.promotion).to.be.an.instanceof(Object);
        const promotion = response.result.promotion;
        expect(promotion.id).to.be.a.string();
        expect(promotion.title).to.be.a.string().and.to.equal(payload.title);
        expect(promotion.class).to.be.a.string().and.to.equal(payload.class);
        expect(promotion.active).to.be.a.boolean().and.be.a.boolean();
        expect(promotion.priority).to.be.a.number().and.to.equal(payload.priority);
        expect(promotion.if).to.be.an.instanceof(Object);
        done();
      });
  });
});

describe('Calculate promotions', () => {
  beforeEach(done => {
    initDB(done);
  });
  after(done => {
    cleanDB(done);
  });

  it('3x2 fulfilled one item per product', done => {
    const productId = 'SksexGRPn4';
    const quantity = 3;
    let promoId;
    const promotion = {
      if: {
        product: {
          id: productId,
          quantity
        }
      }
    };
    createPromotion(promotion)
      .then(creationResponse => {
        promoId = creationResponse.result.promotion.id;
        const cart = {
          items: [
            {
              id: '0',
              productId,
              quantity,
              price: 100.00
            }
          ]
        };
        mockProductList(productId, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => {
        expect(response.statusCode).to.equal(200);

        expect(response.result.ok).to.be.a.boolean().and.to.equal(true);

        const ffps = response.result.fulfilledPromos;
        expect(ffps).to.be.an.array().and.to.have.length(1);
        const ffp = ffps[0];
        expect(ffp.id).to.be.a.string().and.to.equal(promoId);
        expect(ffp.items).to.be.an.array().and.to.have.length(1);
        expect(ffp.items[0].itemId).to.be.a.string().and.to.equal('0');
        expect(ffp.items[0].quantityUsed).to.be.a.number().and.to.equal(quantity);

        const affps = response.result.almostFulfilledPromos;
        expect(affps).to.be.an.array().and.to.have.length(0);
        done();
      });
  });

  it('3x2 fulfilled two items per product', done => {
    const productId = 'SksexGRPn4';
    const quantity = 3;
    let promoId;
    const promotion = {
      if: {
        product: {
          id: productId,
          quantity
        }
      }
    };
    createPromotion(promotion)
      .then(creationResponse => {
        promoId = creationResponse.result.promotion.id;
        const cart = {
          items: [
            {
              id: '0',
              productId,
              quantity: quantity - 1,
              price: 100.00
            }, {
              id: '1',
              productId,
              quantity: 1,
              price: 100.00
            }
          ]
        };
        mockProductList(productId, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => {
        expect(response.statusCode).to.equal(200);

        expect(response.result.ok).to.be.a.boolean().and.to.equal(true);

        const ffps = response.result.fulfilledPromos;
        expect(ffps).to.be.an.array().and.to.have.length(1);
        const ffp = ffps[0];
        expect(ffp.id).to.be.a.string().and.to.equal(promoId);
        expect(ffp.items).to.be.an.array().and.to.have.length(2);
        expect(ffp.items[0].itemId).to.be.a.string().and.to.equal('0');
        expect(ffp.items[0].quantityUsed).to.be.a.number().and.to.equal(quantity - 1);
        expect(ffp.items[1].itemId).to.be.a.string().and.to.equal('1');
        expect(ffp.items[1].quantityUsed).to.be.a.number().and.to.equal(1);

        const affps = response.result.almostFulfilledPromos;
        expect(affps).to.be.an.array().and.to.have.length(0);
        done();
      });
  });

  it('3x2 almost fulfilled one item per product', done => {
    const productId = 'SksexGRPn4';
    const quantity = 3;
    let promoId;
    const promotion = {
      if: {
        product: {
          id: productId,
          quantity
        }
      }
    };
    createPromotion(promotion)
      .then(creationResponse => {
        promoId = creationResponse.result.promotion.id;
        const cart = {
          items: [
            {
              id: '0',
              productId,
              quantity: quantity - 1,
              price: 100.00
            }
          ]
        };
        mockProductList(productId, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => {
        expect(response.statusCode).to.equal(200);

        expect(response.result.ok).to.be.a.boolean().and.to.equal(true);

        const affps = response.result.almostFulfilledPromos;
        expect(affps).to.be.an.array().and.to.have.length(1);
        const affp = affps[0];
        expect(affp.id).to.be.a.string().and.to.equal(promoId);
        const data = affp.data[0];
        expect(data.collectedQuantity).to.be.a.number().and.to.equal(quantity - 1);
        expect(data.promoQuantity).to.be.a.number().and.to.equal(quantity);
        expect(data.type).to.be.a.string().and.to.equal('PRODUCT');
        expect(data.code).to.be.a.string().and.to.equal(productId);

        expect(data.items).to.be.an.array().and.to.have.length(1);
        expect(data.items[0].itemId).to.be.a.string().and.to.equal('0');
        expect(data.items[0].quantityToUse).to.be.a.number().and.to.equal(quantity - 1);

        const ffps = response.result.fulfilledPromos;
        expect(ffps).to.be.an.array().and.to.have.length(0);

        done();
      });
  });

  it('3x2 almost fulfilled two items per product', done => {
    const productId = 'SksexGRPn4';
    const quantity = 3;
    let promoId;
    const promotion = {
      if: {
        product: {
          id: productId,
          quantity
        }
      }
    };
    createPromotion(promotion)
      .then(creationResponse => {
        promoId = creationResponse.result.promotion.id;
        const cart = {
          items: [
            {
              id: '0',
              productId,
              quantity: 1,
              price: 100.00
            }, {
              id: '1',
              productId,
              quantity: 1,
              price: 100.00
            }
          ]
        };
        mockProductList(productId, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => {
        expect(response.statusCode).to.equal(200);

        expect(response.result.ok).to.be.a.boolean().and.to.equal(true);

        const affps = response.result.almostFulfilledPromos;
        expect(affps).to.be.an.array().and.to.have.length(1);
        const affp = affps[0];
        expect(affp.id).to.be.a.string().and.to.equal(promoId);

        const data = affp.data[0];
        expect(data.collectedQuantity).to.be.a.number().and.to.equal(quantity - 1);
        expect(data.promoQuantity).to.be.a.number().and.to.equal(quantity);
        expect(data.type).to.be.a.string().and.to.equal('PRODUCT');
        expect(data.code).to.be.a.string().and.to.equal(productId);

        expect(data.items).to.be.an.array().and.to.have.length(2);
        expect(data.items[0].itemId).to.be.a.string().and.to.equal('0');
        expect(data.items[0].quantityToUse).to.be.a.number().and.to.equal(1);
        expect(data.items[1].itemId).to.be.a.string().and.to.equal('1');
        expect(data.items[1].quantityToUse).to.be.a.number().and.to.equal(1);

        const ffps = response.result.fulfilledPromos;
        expect(ffps).to.be.an.array().and.to.have.length(0);

        done();
      });
  });

  it('3x2 not filled', done => {
    const productId = 'SksexGRPn4';
    const quantity = 3;
    let promoId;
    const promotion = {
      if: {
        product: {
          id: productId,
          quantity
        }
      }
    };
    createPromotion(promotion)
      .then(creationResponse => {
        promoId = creationResponse.result.promotion.id;
        const cart = {
          items: [
            {
              id: '0',
              productId,
              quantity: quantity - 2,
              price: 100.00
            }
          ]
        };
        mockProductList(productId, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => {
        expect(response.statusCode).to.equal(200);

        expect(response.result.ok).to.be.a.boolean().and.to.equal(true);

        expect(response.result.almostFulfilledPromos).to.be.an.array().and.to.have.length(0);
        expect(response.result.fulfilledPromos).to.be.an.array().and.to.have.length(0);

        done();
      });
  });

  it('AND 3x2 fulfilled one item per product', done => {
    const productId1 = 'SksexGRPn4';
    const productId2 = 'By2ZWfAPnV';
    const quantity1 = 3;
    const quantity2 = 3;
    let promoId;
    const promotion = {
      if: {
        and: [
          { product: { id: productId1, quantity: quantity1 } },
          { product: { id: productId2, quantity: quantity2 } }
        ]
      }
    };
    createPromotion(promotion)
      .then(creationResponse => {
        promoId = creationResponse.result.promotion.id;
        const cart = {
          items: [
            { id: '0', productId: productId1, quantity: quantity1, price: 100.00 },
            { id: '1', productId: productId2, quantity: quantity2, price: 100.00 }
          ]
        };
        mockProductList(`${productId1},${productId2}`, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => {
        expect(response.statusCode).to.equal(200);

        expect(response.result.ok).to.be.a.boolean().and.to.equal(true);

        const ffps = response.result.fulfilledPromos;
        expect(ffps).to.be.an.array().and.to.have.length(1);
        const ffp = ffps[0];
        expect(ffp.id).to.be.a.string().and.to.equal(promoId);
        expect(ffp.items).to.be.an.array().and.to.have.length(2);
        expect(ffp.items[0].itemId).to.be.a.string().and.to.equal('0');
        expect(ffp.items[0].quantityUsed).to.be.a.number().and.to.equal(quantity1);
        expect(ffp.items[1].itemId).to.be.a.string().and.to.equal('1');
        expect(ffp.items[1].quantityUsed).to.be.a.number().and.to.equal(quantity2);

        const affps = response.result.almostFulfilledPromos;
        expect(affps).to.be.an.array().and.to.have.length(0);
        done();
      });
  });

  it('AND 3x2 almostFulfilled one item per product', done => {
    const productId1 = 'SksexGRPn4';
    const productId2 = 'By2ZWfAPnV';
    const quantity1 = 3;
    const quantity2 = 3;
    let promoId;
    const promotion = {
      if: {
        and: [
          { product: { id: productId1, quantity: quantity1 } },
          { product: { id: productId2, quantity: quantity2 } }
        ]
      }
    };
    createPromotion(promotion)
      .then(creationResponse => {
        promoId = creationResponse.result.promotion.id;
        const cart = {
          items: [
            { id: '0', productId: productId1, quantity: quantity1, price: 100.00 },
            { id: '1', productId: productId2, quantity: quantity2 - 1, price: 100.00 }
          ]
        };
        mockProductList(`${productId1},${productId2}`, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => {
        expect(response.statusCode).to.equal(200);

        expect(response.result.ok).to.be.a.boolean().and.to.equal(true);

        const affps = response.result.almostFulfilledPromos;
        expect(affps).to.be.an.array().and.to.have.length(1);
        const affp = affps[0];
        expect(affp.id).to.be.a.string().and.to.equal(promoId);
        const data = affp.data[0];
        expect(data.collectedQuantity).to.be.a.number().and.to.equal(quantity2 - 1);
        expect(data.promoQuantity).to.be.a.number().and.to.equal(quantity2);
        expect(data.type).to.be.a.string().and.to.equal('PRODUCT');
        expect(data.code).to.be.a.string().and.to.equal(productId2);

        expect(data.items).to.be.an.array().and.to.have.length(1);
        expect(data.items[0].itemId).to.be.a.string().and.to.equal('1');
        expect(data.items[0].quantityToUse).to.be.a.number().and.to.equal(quantity2 - 1);

        const ffps = response.result.fulfilledPromos;
        expect(ffps).to.be.an.array().and.to.have.length(0);

        done();
      });
  });

  it('Test or', done => {
    done();
  });

  it('Test nested or/and ', done => {
    done();
  });

  it('Test nested or/and fulfilled', done => {
    done();
  });

  it('Test nested or/and almost fulfilled the or', done => {
    done();
  });

  it('Test nested or/and almost fulfilled the and', done => {
    done();
  });
  it('Test nested or/and almost fulfilled both', done => {
    done();
  });
});
