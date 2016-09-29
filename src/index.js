const base = require('microbase')();

// Register model(s)
require(base.config.get('models:promotionModel'))(base);

// Add operations
base.services.addOperationsFromFolder();

module.exports = base;
