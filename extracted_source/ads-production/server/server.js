/* eslint no-console:0 */
if (!global._babelPolyfill) {
  require('babel-polyfill');
}

require('dotenv').config();
const loopback = require('loopback');
const boot = require('loopback-boot');
const path = require('path');

global.Promise = require('bluebird');

const app = loopback();
app.shouldStart =
  require.main &&
  (require.main === module ||
    path.basename(require.main.filename) === 'server.dev.js');

// start the web server
app.start = () =>
  app.listen(() => {
    app.emit('started');
    const baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      const explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, (err) => {
  if (err) {
    throw err;
  }

  // start the server if `$ node server.js`
  if (app.shouldStart) {
    // trust proxy
    app.set('trust proxy', true);

    app.start();
  }
});

module.exports = app;
