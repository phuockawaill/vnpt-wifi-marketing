const bunyan = require('bunyan');
const path = require('path');
const lodash = require('lodash');

const { logger: config } = require('../server-config');

const createStream = (sConfig) => {
  switch (sConfig.type) {
    case 'file':
      return {
        path: path.resolve(sConfig.path),
      };
    case 'stderr':
      return {
        stream: process.stderr,
      };
    default:
      return {
        stream: process.stdout,
      };
  }
};

const loggerStreams = [{ stream: process.stdout }];

if (config.error) {
  loggerStreams.push(
    lodash.extend({ level: bunyan.ERROR }, createStream(config.error)),
  );
}
if (config.fatal) {
  loggerStreams.push(
    lodash.extend({ level: bunyan.FATAL }, createStream(config.fatal)),
  );
}

module.exports = (options = {}) =>
  bunyan.createLogger({
    name: options.name || 'ads-platform',
    level: process.env.LOG_LEVEL || config.level || bunyan.ERROR,
    serializers: bunyan.stdSerializers,
    streams: loggerStreams,
  });
