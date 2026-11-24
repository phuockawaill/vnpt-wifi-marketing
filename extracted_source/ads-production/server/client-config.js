const lodash = require('lodash');
const serverConfig = require('./server-config');

const clientConfigFields = [
  'restApiScheme',
  'restApiHost',
  'restApiRoot',
  'appScheme',
  'appHost',
];

const clientConfig = {};
clientConfigFields.forEach((field) => {
  lodash.set(clientConfig, field, lodash.get(serverConfig, field));
});

module.exports = clientConfig;
