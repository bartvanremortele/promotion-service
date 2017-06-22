module.exports = (/* base */) => {
  const urls = {
    stock: 'http://localhost:3000',
    cart: 'http://localhost:3001',
    catalog: 'http://localhost:3002',
    tax: 'http://localhost:3003',
    promotion: 'http://localhost:3004',
    customer: 'http://localhost:3005',
    recommendation: 'http://localhost:3006',
    payment: 'http://localhost:3007',
    oauth: 'http://localhost:4000'
  };
  return (serviceName /* , serviceVersion, operationName */) => urls[serviceName];
};
