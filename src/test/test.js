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
  expect(response.statusCode).to.equal(200);
  expect(response.result.ok).to.be.a.boolean().and.to.equal(true);
  expect(response.result.fulfilledPromos).to.be.an.array();
  expect(response.result.almostFulfilledPromos).to.be.an.array();
  console.log(response.result);
  if (response.result.fulfilledPromos.length > 0) {
    expect(response.result.fulfilledPromos).to.equal(data);
    expect(response.result.almostFulfilledPromos).to.be.an.array().and.to.have.length(0);
  } else {
    expect(response.result.almostFulfilledPromos).to.equal(data);
    expect(response.result.fulfilledPromos).to.be.an.array().and.to.have.length(0);
  }
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
    const promotion = {
      if: {
        product: { id: productId, quantity }
      }
    };
    const cart = {
      items: [
        { id: '0', productId, quantity }
      ]
    };
    const expectedResponse = [
      { items: [{ itemId: cart.items[0].id, quantityUsed: cart.items[0].quantity }] }
    ];
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse[0].id = creationResponse.result.promotion.id;
        mockProductList(productId, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => checkResponse(response, expectedResponse, done))
      .catch(error => done(error));
  });

  it('3x2 fulfilled, two items per product', done => {
    const productId = '0001';
    const quantity = 3;
    const promotion = {
      if: {
        product: { id: productId, quantity }
      }
    };
    const cart = {
      items: [
        { id: '0', productId, quantity: quantity - 1 },
        { id: '1', productId, quantity: 1 }
      ]
    };
    const expectedResponse = [
      {
        items: [
          { itemId: cart.items[0].id, quantityUsed: cart.items[0].quantity },
          { itemId: cart.items[1].id, quantityUsed: cart.items[1].quantity }
        ]
      }
    ];
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse[0].id = creationResponse.result.promotion.id;
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
      }
    };
    const cart = {
      items: [
        { id: '0', productId, quantity: quantity - 1 }
      ]
    };
    const expectedResponse = [
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
    ];
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse[0].id = creationResponse.result.promotion.id;
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
      }
    };
    const cart = {
      items: [
        { id: '0', productId, quantity: 1 }
      ]
    };
    const expectedResponse = [
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
    ];
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse[0].id = creationResponse.result.promotion.id;
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
      }
    };
    const cart = {
      items: [
        { id: '0', productId, quantity: 1 },
        { id: '1', productId, quantity: 1 }
      ]
    };
    const expectedResponse = [
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
    ];
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse[0].id = creationResponse.result.promotion.id;
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
      }
    };
    const cart = {
      items: [
        { id: '0', productId, quantity: quantity - 2 }
      ]
    };
    const expectedResponse = [];
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
      }
    };
    const cart = {
      items: [
        { id: '0', productId, quantity: quantity - 1 }
      ]
    };
    const expectedResponse = [];
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
    const promotion = {
      if: {
        and: [
          { product: { id: productId1, quantity: quantity1 } },
          { product: { id: productId2, quantity: quantity2 } }
        ]
      }
    };
    const cart = {
      items: [
        { id: '0', productId: productId1, quantity: quantity1 },
        { id: '1', productId: productId2, quantity: quantity2 }
      ]
    };
    const expectedResponse = [
      {
        items: [
          { itemId: cart.items[0].id, quantityUsed: cart.items[0].quantity },
          { itemId: cart.items[1].id, quantityUsed: cart.items[1].quantity }
        ]
      }
    ];
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse[0].id = creationResponse.result.promotion.id;
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
        and: [
          { product: { id: productId1, quantity: quantity1 } },
          { product: { id: productId2, quantity: quantity2 } }
        ]
      }
    };
    const cart = {
      items: [
        { id: '0', productId: productId1, quantity: quantity1 },
        { id: '1', productId: productId2, quantity: quantity2 - 1 }
      ]
    };
    const expectedResponse = [
      {
        data: [{
          and: [{
            collectedQuantity: cart.items[1].quantity,
            promoQuantity: promotion.if.and[1].product.quantity,
            threshold: cart.items[1].quantity / promotion.if.and[0].product.quantity,
            value: cart.items[1].quantity / promotion.if.and[0].product.quantity,
            type: 'PRODUCT',
            code: cart.items[1].productId,
            items: [
              { itemId: cart.items[1].id, quantityToUse: cart.items[1].quantity }
            ]
          }],
          value: (cart.items[1].quantity / promotion.if.and[0].product.quantity)
          / promotion.if.and.length
        }]
      }
    ];
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse[0].id = creationResponse.result.promotion.id;
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
        and: [
          { product: { id: productId1, quantity: quantity1 } },
          { product: { id: productId2, quantity: quantity2, threshold: 0.3 } }
        ]
      }
    };
    const cart = {
      items: [
        { id: '0', productId: productId1, quantity: quantity1 },
        { id: '1', productId: productId2, quantity: 1 }
      ]
    };
    const expectedResponse = [
      {
        data: [{
          and: [{
            collectedQuantity: cart.items[1].quantity,
            promoQuantity: promotion.if.and[1].product.quantity,
            threshold: promotion.if.and[1].product.threshold,
            value: cart.items[1].quantity / promotion.if.and[0].product.quantity,
            type: 'PRODUCT',
            code: cart.items[1].productId,
            items: [
              { itemId: cart.items[1].id, quantityToUse: cart.items[1].quantity }
            ]
          }],
          value: (cart.items[1].quantity / promotion.if.and[0].product.quantity)
          / promotion.if.and.length
        }]
      }
    ];
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse[0].id = creationResponse.result.promotion.id;
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
        and: [
          { product: { id: productId1, quantity: quantity1 } },
          { product: { id: productId2, quantity: quantity2 } }
        ]
      }
    };
    const cart = {
      items: [
        { id: '0', productId: productId1, quantity: quantity1 },
        { id: '1', productId: productId2, quantity: 1 }
      ]
    };
    const expectedResponse = [];
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
    const promotion = {
      if: {
        any: [
          {
            and: [
              { product: { id: productId1, quantity: quantity1 } },
              { product: { id: productId2, quantity: quantity2 } }
            ]
          },
          {
            product: { id: productId3, quantity: quantity3 }
          }
        ]
      }
    };
    const cart = {
      items: [
        { id: '0', productId: productId1, quantity: quantity1 },
        { id: '1', productId: productId2, quantity: quantity2 },
        { id: '2', productId: productId3, quantity: quantity3 - 1 }
      ]
    };
    const expectedResponse = [
      {
        items: [
          { itemId: cart.items[0].id, quantityUsed: cart.items[0].quantity },
          { itemId: cart.items[1].id, quantityUsed: cart.items[1].quantity }
        ]
      }
    ];
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse[0].id = creationResponse.result.promotion.id;
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
    const promotion = {
      if: {
        any: [
          {
            and: [
              { product: { id: productId1, quantity: quantity1 } },
              { product: { id: productId2, quantity: quantity2 } }
            ]
          },
          {
            product: { id: productId3, quantity: quantity3 }
          }
        ]
      }
    };
    const cart = {
      items: [
        { id: '0', productId: productId1, quantity: quantity1 - 1 },
        { id: '1', productId: productId2, quantity: quantity2 - 1 },
        { id: '2', productId: productId3, quantity: quantity3 }
      ]
    };
    const expectedResponse = [
      {
        items: [
          { itemId: cart.items[2].id, quantityUsed: cart.items[2].quantity }
        ]
      }
    ];
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse[0].id = creationResponse.result.promotion.id;
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
            and: [
              { product: { id: productId1, quantity: quantity1 } },
              { product: { id: productId2, quantity: quantity2 } }
            ]
          },
          {
            product: { id: productId3, quantity: quantity3 }
          }
        ]
      }
    };
    const cart = {
      items: [
        { id: '0', productId: productId1, quantity: quantity1 },
        { id: '1', productId: productId2, quantity: quantity2 - 1 },
        { id: '2', productId: productId3, quantity: 1 }
      ]
    };
    const expectedResponse = [
      {
        data: [{
          any: [{
            and: [{
              collectedQuantity: cart.items[1].quantity,
              promoQuantity: promotion.if.any[0].and[1].product.quantity,
              threshold: cart.items[1].quantity / promotion.if.any[0].and[1].product.quantity,
              value: cart.items[1].quantity / promotion.if.any[0].and[1].product.quantity,
              type: 'PRODUCT',
              code: cart.items[1].productId,
              items: [
                { itemId: cart.items[1].id, quantityToUse: cart.items[1].quantity }
              ]
            }],
            value: cart.items[1].quantity / promotion.if.any[0].and[1].product.quantity
            / promotion.if.any[0].and.length
          }],
          value: cart.items[1].quantity / promotion.if.any[0].and[1].product.quantity
          / promotion.if.any[0].and.length
        }]
      }
    ];
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse[0].id = creationResponse.result.promotion.id;
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
            and: [
              { product: { id: productId1, quantity: quantity1 } },
              { product: { id: productId2, quantity: quantity2, threshold: 0.3 } }
            ]
          },
          {
            product: { id: productId3, quantity: quantity3 }
          }
        ]
      }
    };
    const cart = {
      items: [
        { id: '0', productId: productId1, quantity: quantity1 - 1 },
        { id: '1', productId: productId2, quantity: 1 },
        { id: '2', productId: productId3, quantity: 1 }
      ]
    };
    const expectedResponse = [
      {
        data: [{
          any: [{
            and: [{
              collectedQuantity: cart.items[0].quantity,
              promoQuantity: promotion.if.any[0].and[0].product.quantity,
              threshold: cart.items[0].quantity / promotion.if.any[0].and[0].product.quantity,
              value: cart.items[0].quantity / promotion.if.any[0].and[0].product.quantity,
              type: 'PRODUCT',
              code: cart.items[0].productId,
              items: [
                { itemId: cart.items[0].id, quantityToUse: cart.items[0].quantity }
              ]
            }, {
              collectedQuantity: cart.items[1].quantity,
              promoQuantity: promotion.if.any[0].and[1].product.quantity,
              threshold: promotion.if.any[0].and[1].product.threshold,
              value: cart.items[1].quantity / promotion.if.any[0].and[1].product.quantity,
              type: 'PRODUCT',
              code: cart.items[1].productId,
              items: [
                { itemId: cart.items[1].id, quantityToUse: cart.items[1].quantity }
              ]
            }],
            value: ((cart.items[0].quantity / promotion.if.any[0].and[0].product.quantity)
            + (cart.items[1].quantity / promotion.if.any[0].and[1].product.quantity))
            / promotion.if.any[0].and.length
          }],
          value: ((cart.items[0].quantity / promotion.if.any[0].and[0].product.quantity)
          + (cart.items[1].quantity / promotion.if.any[0].and[1].product.quantity))
          / promotion.if.any[0].and.length
        }]
      }
    ];
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse[0].id = creationResponse.result.promotion.id;
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
            and: [
              { product: { id: productId1, quantity: quantity1 } },
              { product: { id: productId2, quantity: quantity2 } }
            ]
          },
          {
            product: { id: productId3, quantity: quantity3 }
          }
        ]
      }
    };
    const cart = {
      items: [
        { id: '0', productId: productId1, quantity: quantity1 },
        { id: '1', productId: productId2, quantity: 1 },
        { id: '2', productId: productId3, quantity: quantity3 - 1 }
      ]
    };
    const expectedResponse = [
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
    ];
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse[0].id = creationResponse.result.promotion.id;
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
            and: [
              { product: { id: productId1, quantity: quantity1 } },
              { product: { id: productId2, quantity: quantity2 } }
            ]
          },
          {
            product: { id: productId3, quantity: quantity3 }
          }
        ]
      }
    };
    const cart = {
      items: [
        { id: '0', productId: productId1, quantity: quantity1 - 1 },
        { id: '1', productId: productId2, quantity: quantity2 - 1 },
        { id: '2', productId: productId3, quantity: quantity3 - 1 }
      ]
    };
    const expectedResponse = [
      {
        data: [
          {
            any: [
              {
                and: [
                  {
                    collectedQuantity: cart.items[0].quantity,
                    promoQuantity: promotion.if.any[0].and[0].product.quantity,
                    threshold: cart.items[1].quantity / promotion.if.any[0].and[0].product.quantity,
                    value: cart.items[1].quantity / promotion.if.any[0].and[0].product.quantity,
                    type: 'PRODUCT',
                    code: cart.items[0].productId,
                    items: [
                      { itemId: cart.items[0].id, quantityToUse: cart.items[0].quantity }
                    ]
                  }, {
                    collectedQuantity: cart.items[1].quantity,
                    promoQuantity: promotion.if.any[0].and[1].product.quantity,
                    threshold: cart.items[1].quantity / promotion.if.any[0].and[1].product.quantity,
                    value: cart.items[1].quantity / promotion.if.any[0].and[1].product.quantity,
                    type: 'PRODUCT',
                    code: cart.items[1].productId,
                    items: [
                      { itemId: cart.items[1].id, quantityToUse: cart.items[1].quantity }
                    ]
                  }],
                value: ((cart.items[0].quantity / promotion.if.any[0].and[0].product.quantity)
                + (cart.items[1].quantity / promotion.if.any[0].and[1].product.quantity))
                / promotion.if.any[0].and.length
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
      }];
    createPromotion(promotion)
      .then(creationResponse => {
        expectedResponse[0].id = creationResponse.result.promotion.id;
        mockProductList(`${productId1},${productId2},${productId3}`, 'categories');
        return evaluatePromotions(cart);
      })
      .then(response => checkResponse(response, expectedResponse, done))
      .catch(error => done(error));
  });
});
