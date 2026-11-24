const ConfigLoader = require('loopback-boot/lib/config-loader');

const env = process.env.NODE_ENV || 'development';
const config = ConfigLoader.loadAppConfig(__dirname, env);

module.exports = config;
