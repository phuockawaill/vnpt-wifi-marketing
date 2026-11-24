const Promise = require('bluebird');

const success = Promise.resolve;

const error = (
  statusCode = 400,
  code = 'INVALID_REQUEST',
  message = 'Invalid Request',
) => Promise.reject({ statusCode, code, message });

const invalidRequest = () =>
  Promise.reject({
    statusCode: 400,
    code: 'INVALID_REQUEST',
    message: 'Invalid Request',
  });
const createOrderFailed = () =>
  Promise.reject({ statusCode: 500, code: 'INIT_PAYMENT_FAILED' });

module.exports = {
  success,
  error,
  invalidRequest,
  createOrderFailed
};
