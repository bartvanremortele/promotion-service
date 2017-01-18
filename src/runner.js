const raven = require('raven');
const dd = require('connect-datadog');
const dogstatsd = require('node-dogstatsd');

require('./index')
  .start({
    extra: { raven, dd, dogstatsd }
  });
