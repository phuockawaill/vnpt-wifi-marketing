const path = require('path');

module.exports = function config(app) {
  // Trust X-Forwarded-For-* headers
  app.set('trust proxy', true);

  // Set template engine as pug
  // and root view folder as client
  app.set('view engine', 'pug');
  const rootPath = path.resolve(__dirname, '../../');
  const clientPath = path.resolve(rootPath, 'views');
  app.set('views', clientPath);

  // enable authentication
  app.enableAuth();

  // Override default token setting to use cookie
  app.use(
    app.loopback.token({
      model: app.models.accessToken,
      currentUserLiteral: 'me',
      searchDefaultTokenKeys: false,
      cookies: ['access_token'],
      headers: ['access_token', 'X-Access-Token'],
      params: ['access_token'],
    }),
  );
};
