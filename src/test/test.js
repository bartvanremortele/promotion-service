const Code = require('code');
const Lab = require('lab');
const nock = require('nock');
const request = require('supertest-as-promised');

// shortcuts
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const beforeEach = lab.beforeEach;
const after = lab.after;
const it = lab.it;
const expect = Code.expect;

const base = require('../index.js');
const app = base.transports.http.app;

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
  const promise = request(app)[options.method.toLowerCase()](options.url);
  Object.keys(options.headers).forEach(key => {
    promise.set(key, options.headers[key]);
  });
  if (options.payload) promise.send(options.payload);
  return promise;
}

// Helper to create promotions
const defaultPromotionTitle = 'Promotion';
function createPromotion(payload) {
  Object.assign(payload, {
    title: defaultPromotionTitle,
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
function mockProductList(idsList, fields) {
  const ids = idsList.split(',');
  nock('http://gateway')
    .post('/services/catalog/v1/product.list', {
      id: idsList,
      fields
    })
    .reply(200, {
      ok: true,
      page: { limit: 10, skip: 0 },
      data: ids.map(id => ({ id, categories: ['BJeVBrmsV'] }))
    });
}

// Helper to validate responses
function checkResponse(response, data, done) {
  if (!data.ok) data.ok = true;
  if (!data.almostFulfilledPromos) data.almostFulfilledPromos = [];
  if (!data.itemDiscounts) data.itemDiscounts = [];

  expect(response.statusCode).to.equal(200);
  expect(response.body.almostFulfilledPromos).to.be.an.array();
  expect(response.body).to.equal(data);

  if (done) done();
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
      if: {},
      then: {}
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
        expect(response.body.ok).to.be.a.boolean().and.to.equal(true);
        expect(response.body.promotion).to.be.an.instanceof(Object);
        const promotion = response.body.promotion;
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

describe('Calculate cart promotions', () => {
  beforeEach(done => {
    initDB(done);
  });
  after(done => {
    cleanDB(done);
  });

  it('3x2 fulfilled', done => {
    const productId = '0001';
    const quantity = 3;
    const price = 100.00;
    const rate = 10;
    const discountQuantity = 1;
    const promotion = {
      if: {
        product: {
          id: productId,
          quantity
        }
      },
      then: {
        product: {
          id: productId,
          quantity: discountQuantity,
          discount: {
            isPercentage: true,
            rate
          }
        }
      }
    };
    const cart = {
      items: [
        { id: '0', productId, quantity, price }
      ]
    };
    const expectedResponse = {
      itemDiscounts: [{
        id: cart.items[0].id,
        discounts: [{
          quantity: discountQuantity,
          promotionTitle: defaultPromotionTitle,
          discount: price * rate / 100 * discountQuantity,
          price
        }]
      }]
    };
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse.itemDiscounts[0].discounts[0].promotionId = creationResponse.body.promotion.id;
        mockProductList(productId, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => checkResponse(response, expectedResponse, done))
      .catch(error => done(error));
  });

  it('3x2 fulfilled, two items per product', done => {
    const productId = '0001';
    const quantity = 3;
    const price = 100.00;
    const rate = 10;
    const discountQuantity = 1;
    const promotion = {
      if: {
        product: {
          id: productId,
          quantity
        }
      },
      then: {
        product: {
          id: productId,
          quantity: discountQuantity,
          discount: {
            isPercentage: true,
            rate
          }
        }
      }
    };
    const cart = {
      items: [
        { id: '0', productId, quantity: quantity - 1, price },
        { id: '1', productId, quantity: 1, price }
      ]
    };
    const expectedResponse = {
      itemDiscounts: [{
        id: cart.items[0].id,
        discounts: [{
          quantity: discountQuantity,
          promotionTitle: defaultPromotionTitle,
          discount: price * rate / 100 * discountQuantity,
          price
        }]
      }]
    };
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse.itemDiscounts[0].discounts[0].promotionId = creationResponse.body.promotion.id;
        mockProductList(productId, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => checkResponse(response, expectedResponse, done))
      .catch(error => done(error));
  });

  it('3x2 almost fulfilled', done => {
    const productId = '0001';
    const quantity = 3;
    const promotion = {
      if: {
        product: { id: productId, quantity }
      },
      then: {
      }
    };
    const cart = {
      items: [
        { id: '0', productId, quantity: quantity - 1 }
      ]
    };
    const expectedResponse = {
      almostFulfilledPromos: [
        {
          data: [{
            collectedQuantity: cart.items[0].quantity,
            promoQuantity: promotion.if.product.quantity,
            threshold: cart.items[0].quantity / promotion.if.product.quantity,
            value: cart.items[0].quantity / promotion.if.product.quantity,
            type: 'PRODUCT',
            code: cart.items[0].productId,
            items: [
              { itemId: cart.items[0].id, quantityToUse: cart.items[0].quantity }
            ]
          }]
        }
      ]
    };
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse.almostFulfilledPromos[0].id = creationResponse.body.promotion.id;
        mockProductList(productId, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => checkResponse(response, expectedResponse, done))
      .catch(error => done(error));
  });

  it('3x2 almost fulfilled, with threshold', done => {
    const productId = '0001';
    const quantity = 3;
    const promotion = {
      if: {
        product: { id: productId, quantity, threshold: 0.3 }
      },
      then: {}
    };
    const cart = {
      items: [
        { id: '0', productId, quantity: 1 }
      ]
    };
    const expectedResponse = {
      almostFulfilledPromos: [
        {
          data: [{
            collectedQuantity: cart.items[0].quantity,
            promoQuantity: promotion.if.product.quantity,
            threshold: promotion.if.product.threshold,
            value: cart.items[0].quantity / promotion.if.product.quantity,
            type: 'PRODUCT',
            code: cart.items[0].productId,
            items: [
              { itemId: cart.items[0].id, quantityToUse: cart.items[0].quantity }
            ]
          }]
        }
      ]
    };
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse.almostFulfilledPromos[0].id = creationResponse.body.promotion.id;
        mockProductList(productId, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => checkResponse(response, expectedResponse, done))
      .catch(error => done(error));
  });

  it('3x2 almost fulfilled, two items per product', done => {
    const productId = '0001';
    const quantity = 3;
    const expectedQuantity = 2;
    const promotion = {
      if: {
        product: { id: productId, quantity }
      },
      then: {}
    };
    const cart = {
      items: [
        { id: '0', productId, quantity: 1 },
        { id: '1', productId, quantity: 1 }
      ]
    };
    const expectedResponse = {
      almostFulfilledPromos: [
        {
          data: [{
            collectedQuantity: expectedQuantity,
            promoQuantity: promotion.if.product.quantity,
            threshold: expectedQuantity / promotion.if.product.quantity,
            value: expectedQuantity / promotion.if.product.quantity,
            type: 'PRODUCT',
            code: cart.items[0].productId,
            items: [
              { itemId: cart.items[0].id, quantityToUse: cart.items[0].quantity },
              { itemId: cart.items[1].id, quantityToUse: cart.items[1].quantity }
            ]
          }]
        }
      ]
    };
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse.almostFulfilledPromos[0].id = creationResponse.body.promotion.id;
        mockProductList(productId, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => checkResponse(response, expectedResponse, done))
      .catch(error => done(error));
  });

  it('3x2 not fulfilled', done => {
    const productId = '0001';
    const quantity = 3;
    const promotion = {
      if: {
        product: { id: productId, quantity }
      },
      then: {}
    };
    const cart = {
      items: [
        { id: '0', productId, quantity: quantity - 2 }
      ]
    };
    const expectedResponse = {};
    createPromotion(promotion)
      .then(() => {
        mockProductList(productId, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => checkResponse(response, expectedResponse, done))
      .catch(error => done(error));
  });

  it('3x2 not fulfilled, with threshold', done => {
    const productId = '0001';
    const quantity = 3;
    const promotion = {
      if: {
        product: { id: productId, quantity, threshold: 0.8 }
      },
      then: {}
    };
    const cart = {
      items: [
        { id: '0', productId, quantity: quantity - 1 }
      ]
    };
    const expectedResponse = {};
    createPromotion(promotion)
      .then(() => {
        mockProductList(productId, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => checkResponse(response, expectedResponse, done))
      .catch(error => done(error));
  });

  it('(3x2 AND 3x2) fulfilled', done => {
    const productId1 = '0001';
    const productId2 = '0002';
    const quantity1 = 3;
    const quantity2 = 3;
    const price = 100.00;
    const rate = 10;
    const discountQuantity = 1;
    const promotion = {
      if: {
        all: [
          { product: { id: productId1, quantity: quantity1 } },
          { product: { id: productId2, quantity: quantity2 } }
        ]
      },
      then: {
        product: {
          id: productId1,
          quantity: discountQuantity,
          discount: {
            isPercentage: true,
            rate
          }
        }
      }
    };
    const cart = {
      items: [
        { id: '0', productId: productId1, quantity: quantity1, price },
        { id: '1', productId: productId2, quantity: quantity2, price }
      ]
    };
    const expectedResponse = {
      itemDiscounts: [{
        id: cart.items[0].id,
        discounts: [{
          quantity: discountQuantity,
          promotionTitle: defaultPromotionTitle,
          discount: price * rate / 100 * discountQuantity,
          price
        }]
      }]
    };
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse.itemDiscounts[0].discounts[0].promotionId = creationResponse.body.promotion.id;
        mockProductList(`${productId1},${productId2}`, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => checkResponse(response, expectedResponse, done))
      .catch(error => done(error));
  });

  it('(3x2 AND 3x2) almostFulfilled', done => {
    const productId1 = '0001';
    const productId2 = '0002';
    const quantity1 = 3;
    const quantity2 = 3;
    const promotion = {
      if: {
        all: [
          { product: { id: productId1, quantity: quantity1 } },
          { product: { id: productId2, quantity: quantity2 } }
        ]
      },
      then: {}
    };
    const cart = {
      items: [
        { id: '0', productId: productId1, quantity: quantity1 },
        { id: '1', productId: productId2, quantity: quantity2 - 1 }
      ]
    };
    const expectedResponse = {
      almostFulfilledPromos: [
        {
          data: [{
            all: [{
              collectedQuantity: cart.items[1].quantity,
              promoQuantity: promotion.if.all[1].product.quantity,
              threshold: cart.items[1].quantity / promotion.if.all[0].product.quantity,
              value: cart.items[1].quantity / promotion.if.all[0].product.quantity,
              type: 'PRODUCT',
              code: cart.items[1].productId,
              items: [
                { itemId: cart.items[1].id, quantityToUse: cart.items[1].quantity }
              ]
            }],
            value: (cart.items[1].quantity / promotion.if.all[0].product.quantity)
            / promotion.if.all.length
          }]
        }
      ]
    };
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse.almostFulfilledPromos[0].id = creationResponse.body.promotion.id;
        mockProductList(`${productId1},${productId2}`, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => checkResponse(response, expectedResponse, done))
      .catch(error => done(error));
  });

  it('(3x2 AND 3x2) almostFulfilled, with threshold', done => {
    const productId1 = '0001';
    const productId2 = '0002';
    const quantity1 = 3;
    const quantity2 = 3;
    const promotion = {
      if: {
        all: [
          { product: { id: productId1, quantity: quantity1 } },
          { product: { id: productId2, quantity: quantity2, threshold: 0.3 } }
        ]
      },
      then: {}
    };
    const cart = {
      items: [
        { id: '0', productId: productId1, quantity: quantity1 },
        { id: '1', productId: productId2, quantity: 1 }
      ]
    };
    const expectedResponse = {
      almostFulfilledPromos: [
        {
          data: [{
            all: [{
              collectedQuantity: cart.items[1].quantity,
              promoQuantity: promotion.if.all[1].product.quantity,
              threshold: promotion.if.all[1].product.threshold,
              value: cart.items[1].quantity / promotion.if.all[0].product.quantity,
              type: 'PRODUCT',
              code: cart.items[1].productId,
              items: [
                { itemId: cart.items[1].id, quantityToUse: cart.items[1].quantity }
              ]
            }],
            value: (cart.items[1].quantity / promotion.if.all[0].product.quantity)
            / promotion.if.all.length
          }]
        }
      ]
    };
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse.almostFulfilledPromos[0].id = creationResponse.body.promotion.id;
        mockProductList(`${productId1},${productId2}`, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => checkResponse(response, expectedResponse, done))
      .catch(error => done(error));
  });

  it('(3x2 AND 3x2) notFulfilled', done => {
    const productId1 = '0001';
    const productId2 = '0002';
    const quantity1 = 3;
    const quantity2 = 3;
    const promotion = {
      if: {
        all: [
          { product: { id: productId1, quantity: quantity1 } },
          { product: { id: productId2, quantity: quantity2 } }
        ]
      },
      then: {}
    };
    const cart = {
      items: [
        { id: '0', productId: productId1, quantity: quantity1 },
        { id: '1', productId: productId2, quantity: 1 }
      ]
    };
    const expectedResponse = {};
    createPromotion(promotion)
      .then(() => {
        mockProductList(`${productId1},${productId2}`, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => checkResponse(response, expectedResponse, done))
      .catch(error => done(error));
  });

  it('((3x2 AND 3x2) OR 3x2) fulfilled AND', done => {
    const productId1 = '0001';
    const productId2 = '0002';
    const productId3 = '0003';
    const quantity1 = 3;
    const quantity2 = 3;
    const quantity3 = 3;
    const price = 100.00;
    const discountQuantity = 1;
    const rate = 10;
    const promotion = {
      if: {
        any: [
          {
            all: [
              { product: { id: productId1, quantity: quantity1 } },
              { product: { id: productId2, quantity: quantity2 } }
            ]
          },
          {
            product: { id: productId3, quantity: quantity3 }
          }
        ]
      },
      then: {
        product: {
          id: productId1,
          quantity: discountQuantity,
          discount: {
            isPercentage: true,
            rate
          }
        }
      }
    };
    const cart = {
      items: [
        { id: '0', productId: productId1, quantity: quantity1, price },
        { id: '1', productId: productId2, quantity: quantity2, price },
        { id: '2', productId: productId3, quantity: quantity3 - 1, price }
      ]
    };
    const expectedResponse = {
      itemDiscounts: [{
        id: cart.items[0].id,
        discounts: [{
          quantity: discountQuantity,
          promotionTitle: defaultPromotionTitle,
          discount: price * rate / 100 * discountQuantity,
          price
        }]
      }],
      almostFulfilledPromos: [
        {
          data: [{
            any: [{
              collectedQuantity: cart.items[2].quantity,
              promoQuantity: promotion.if.any[1].product.quantity,
              threshold: cart.items[2].quantity / promotion.if.any[1].product.quantity,
              value: cart.items[2].quantity / promotion.if.any[1].product.quantity,
              type: 'PRODUCT',
              code: cart.items[2].productId,
              items: [
                { itemId: cart.items[2].id, quantityToUse: cart.items[2].quantity }
              ]
            }],
            value: cart.items[2].quantity / promotion.if.any[1].product.quantity
          }]
        }
      ]
    };
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse.itemDiscounts[0].discounts[0].promotionId = creationResponse.body.promotion.id;
        expectedResponse.almostFulfilledPromos[0].id = creationResponse.body.promotion.id;
        mockProductList(`${productId1},${productId2},${productId3}`, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => checkResponse(response, expectedResponse, done))
      .catch(error => done(error));
  });

  it('((3x2 AND 3x2) OR 3x2) fulfilled OR', done => {
    const productId1 = '0001';
    const productId2 = '0002';
    const productId3 = '0003';
    const quantity1 = 3;
    const quantity2 = 3;
    const quantity3 = 3;
    const price = 100.00;
    const discountQuantity = 1;
    const rate = 10;
    const promotion = {
      if: {
        any: [
          {
            all: [
              { product: { id: productId1, quantity: quantity1 } },
              { product: { id: productId2, quantity: quantity2 } }
            ]
          },
          {
            product: { id: productId3, quantity: quantity3 }
          }
        ]
      },
      then: {
        product: {
          id: productId3,
          quantity: discountQuantity,
          discount: {
            isPercentage: true,
            rate
          }
        }
      }
    };
    const cart = {
      items: [
        { id: '0', productId: productId1, quantity: quantity1 - 1, price },
        { id: '1', productId: productId2, quantity: quantity2 - 1, price },
        { id: '2', productId: productId3, quantity: quantity3, price }
      ]
    };
    const expectedResponse = {
      almostFulfilledPromos: [
        {
          data: [
            {
              any: [
                {
                  all: [
                    {
                      collectedQuantity: cart.items[0].quantity,
                      promoQuantity: promotion.if.any[0].all[0].product.quantity,
                      threshold: cart.items[0].quantity / promotion.if.any[0].all[0].product.quantity,
                      value: cart.items[0].quantity / promotion.if.any[0].all[0].product.quantity,
                      type: 'PRODUCT',
                      code: cart.items[0].productId,
                      items: [
                        { itemId: cart.items[0].id, quantityToUse: cart.items[0].quantity }
                      ]
                    }, {
                      collectedQuantity: cart.items[1].quantity,
                      promoQuantity: promotion.if.any[0].all[1].product.quantity,
                      threshold: cart.items[1].quantity / promotion.if.any[0].all[1].product.quantity,
                      value: cart.items[1].quantity / promotion.if.any[0].all[1].product.quantity,
                      type: 'PRODUCT',
                      code: cart.items[1].productId,
                      items: [
                        { itemId: cart.items[1].id, quantityToUse: cart.items[1].quantity }
                      ]
                    }],
                  value: ((cart.items[0].quantity / promotion.if.any[0].all[0].product.quantity)
                  + (cart.items[1].quantity / promotion.if.any[0].all[1].product.quantity))
                  / promotion.if.any[0].all.length
                }],
              value: ((cart.items[0].quantity / promotion.if.any[0].all[0].product.quantity)
              + (cart.items[1].quantity / promotion.if.any[0].all[1].product.quantity))
              / promotion.if.any[0].all.length
            }]
        }
      ],
      itemDiscounts: [{
        id: cart.items[2].id,
        discounts: [{
          quantity: discountQuantity,
          promotionTitle: defaultPromotionTitle,
          discount: price * rate / 100 * discountQuantity,
          price
        }]
      }]
    };
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse.itemDiscounts[0].discounts[0].promotionId = creationResponse.body.promotion.id;
        expectedResponse.almostFulfilledPromos[0].id = creationResponse.body.promotion.id;
        mockProductList(`${productId1},${productId2},${productId3}`, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => checkResponse(response, expectedResponse, done))
      .catch(error => done(error));
  });

  it('((3x2 AND 3x2) OR 3x2) almostFulfilled AND', done => {
    const productId1 = '0001';
    const productId2 = '0002';
    const productId3 = '0003';
    const quantity1 = 3;
    const quantity2 = 3;
    const quantity3 = 3;
    const promotion = {
      if: {
        any: [
          {
            all: [
              { product: { id: productId1, quantity: quantity1 } },
              { product: { id: productId2, quantity: quantity2 } }
            ]
          },
          {
            product: { id: productId3, quantity: quantity3 }
          }
        ]
      },
      then: {}
    };
    const cart = {
      items: [
        { id: '0', productId: productId1, quantity: quantity1 },
        { id: '1', productId: productId2, quantity: quantity2 - 1 },
        { id: '2', productId: productId3, quantity: 1 }
      ]
    };
    const expectedResponse = {
      almostFulfilledPromos: [
        {
          data: [{
            any: [{
              all: [{
                collectedQuantity: cart.items[1].quantity,
                promoQuantity: promotion.if.any[0].all[1].product.quantity,
                threshold: cart.items[1].quantity / promotion.if.any[0].all[1].product.quantity,
                value: cart.items[1].quantity / promotion.if.any[0].all[1].product.quantity,
                type: 'PRODUCT',
                code: cart.items[1].productId,
                items: [
                  { itemId: cart.items[1].id, quantityToUse: cart.items[1].quantity }
                ]
              }],
              value: cart.items[1].quantity / promotion.if.any[0].all[1].product.quantity
              / promotion.if.any[0].all.length
            }],
            value: cart.items[1].quantity / promotion.if.any[0].all[1].product.quantity
            / promotion.if.any[0].all.length
          }]
        }
      ]
    };
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse.almostFulfilledPromos[0].id = creationResponse.body.promotion.id;
        mockProductList(`${productId1},${productId2},${productId3}`, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => checkResponse(response, expectedResponse, done))
      .catch(error => done(error));
  });

  it('((3x2 AND 3x2) OR 3x2) almostFulfilled AND, with threshold', done => {
    const productId1 = '0001';
    const productId2 = '0002';
    const productId3 = '0003';
    const quantity1 = 3;
    const quantity2 = 3;
    const quantity3 = 3;
    const promotion = {
      if: {
        any: [
          {
            all: [
              { product: { id: productId1, quantity: quantity1 } },
              { product: { id: productId2, quantity: quantity2, threshold: 0.3 } }
            ]
          },
          {
            product: { id: productId3, quantity: quantity3 }
          }
        ]
      },
      then: {}
    };
    const cart = {
      items: [
        { id: '0', productId: productId1, quantity: quantity1 - 1 },
        { id: '1', productId: productId2, quantity: 1 },
        { id: '2', productId: productId3, quantity: 1 }
      ]
    };
    const expectedResponse = {
      almostFulfilledPromos: [
        {
          data: [{
            any: [{
              all: [{
                collectedQuantity: cart.items[0].quantity,
                promoQuantity: promotion.if.any[0].all[0].product.quantity,
                threshold: cart.items[0].quantity / promotion.if.any[0].all[0].product.quantity,
                value: cart.items[0].quantity / promotion.if.any[0].all[0].product.quantity,
                type: 'PRODUCT',
                code: cart.items[0].productId,
                items: [
                  { itemId: cart.items[0].id, quantityToUse: cart.items[0].quantity }
                ]
              }, {
                collectedQuantity: cart.items[1].quantity,
                promoQuantity: promotion.if.any[0].all[1].product.quantity,
                threshold: promotion.if.any[0].all[1].product.threshold,
                value: cart.items[1].quantity / promotion.if.any[0].all[1].product.quantity,
                type: 'PRODUCT',
                code: cart.items[1].productId,
                items: [
                  { itemId: cart.items[1].id, quantityToUse: cart.items[1].quantity }
                ]
              }],
              value: ((cart.items[0].quantity / promotion.if.any[0].all[0].product.quantity)
              + (cart.items[1].quantity / promotion.if.any[0].all[1].product.quantity))
              / promotion.if.any[0].all.length
            }],
            value: ((cart.items[0].quantity / promotion.if.any[0].all[0].product.quantity)
            + (cart.items[1].quantity / promotion.if.any[0].all[1].product.quantity))
            / promotion.if.any[0].all.length
          }]
        }
      ]
    };
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse.almostFulfilledPromos[0].id = creationResponse.body.promotion.id;
        mockProductList(`${productId1},${productId2},${productId3}`, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => checkResponse(response, expectedResponse, done))
      .catch(error => done(error));
  });

  it('((3x2 AND 3x2) OR 3x2) almostFulfilled OR', done => {
    const productId1 = '0001';
    const productId2 = '0002';
    const productId3 = '0003';
    const quantity1 = 3;
    const quantity2 = 3;
    const quantity3 = 3;
    const promotion = {
      if: {
        any: [
          {
            all: [
              { product: { id: productId1, quantity: quantity1 } },
              { product: { id: productId2, quantity: quantity2 } }
            ]
          },
          {
            product: { id: productId3, quantity: quantity3 }
          }
        ]
      },
      then: {}
    };
    const cart = {
      items: [
        { id: '0', productId: productId1, quantity: quantity1 },
        { id: '1', productId: productId2, quantity: 1 },
        { id: '2', productId: productId3, quantity: quantity3 - 1 }
      ]
    };
    const expectedResponse = {
      almostFulfilledPromos: [
        {
          data: [{
            any: [{
              collectedQuantity: cart.items[2].quantity,
              promoQuantity: promotion.if.any[1].product.quantity,
              threshold: cart.items[2].quantity / promotion.if.any[1].product.quantity,
              value: cart.items[2].quantity / promotion.if.any[1].product.quantity,
              type: 'PRODUCT',
              code: cart.items[2].productId,
              items: [
                { itemId: cart.items[2].id, quantityToUse: cart.items[2].quantity }
              ]
            }],
            value: cart.items[2].quantity / promotion.if.any[1].product.quantity
          }]
        }
      ]
    };
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse.almostFulfilledPromos[0].id = creationResponse.body.promotion.id;
        mockProductList(`${productId1},${productId2},${productId3}`, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => checkResponse(response, expectedResponse, done))
      .catch(error => done(error));
  });

  it('((3x2 AND 3x2) OR 3x2) almostFulfilled AND & OR', done => {
    const productId1 = '0001';
    const productId2 = '0002';
    const productId3 = '0003';
    const quantity1 = 3;
    const quantity2 = 3;
    const quantity3 = 3;
    const promotion = {
      if: {
        any: [
          {
            all: [
              { product: { id: productId1, quantity: quantity1 } },
              { product: { id: productId2, quantity: quantity2 } }
            ]
          },
          {
            product: { id: productId3, quantity: quantity3 }
          }
        ]
      },
      then: {}
    };
    const cart = {
      items: [
        { id: '0', productId: productId1, quantity: quantity1 - 1 },
        { id: '1', productId: productId2, quantity: quantity2 - 1 },
        { id: '2', productId: productId3, quantity: quantity3 - 1 }
      ]
    };
    const expectedResponse = {
      almostFulfilledPromos: [
        {
          data: [
            {
              any: [
                {
                  all: [
                    {
                      collectedQuantity: cart.items[0].quantity,
                      promoQuantity: promotion.if.any[0].all[0].product.quantity,
                      threshold: cart.items[1].quantity / promotion.if.any[0].all[0].product.quantity,
                      value: cart.items[1].quantity / promotion.if.any[0].all[0].product.quantity,
                      type: 'PRODUCT',
                      code: cart.items[0].productId,
                      items: [
                        { itemId: cart.items[0].id, quantityToUse: cart.items[0].quantity }
                      ]
                    }, {
                      collectedQuantity: cart.items[1].quantity,
                      promoQuantity: promotion.if.any[0].all[1].product.quantity,
                      threshold: cart.items[1].quantity / promotion.if.any[0].all[1].product.quantity,
                      value: cart.items[1].quantity / promotion.if.any[0].all[1].product.quantity,
                      type: 'PRODUCT',
                      code: cart.items[1].productId,
                      items: [
                        { itemId: cart.items[1].id, quantityToUse: cart.items[1].quantity }
                      ]
                    }],
                  value: ((cart.items[0].quantity / promotion.if.any[0].all[0].product.quantity)
                  + (cart.items[1].quantity / promotion.if.any[0].all[1].product.quantity))
                  / promotion.if.any[0].all.length
                },
                {
                  collectedQuantity: cart.items[2].quantity,
                  promoQuantity: promotion.if.any[1].product.quantity,
                  threshold: cart.items[2].quantity / promotion.if.any[1].product.quantity,
                  value: cart.items[2].quantity / promotion.if.any[1].product.quantity,
                  type: 'PRODUCT',
                  code: cart.items[2].productId,
                  items: [
                    { itemId: cart.items[2].id, quantityToUse: cart.items[2].quantity }
                  ]
                }],
              value: cart.items[2].quantity / promotion.if.any[1].product.quantity
            }]
        }
      ]
    };
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse.almostFulfilledPromos[0].id = creationResponse.body.promotion.id;
        mockProductList(`${productId1},${productId2},${productId3}`, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => checkResponse(response, expectedResponse, done))
      .catch(error => done(error));
  });
});
