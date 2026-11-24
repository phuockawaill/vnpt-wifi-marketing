const useragent = require('../import/useragent');

module.exports = (app) => {
  if (!app.shouldStart) return;
    // Trust X-Forwarded-For-* headers
    app.set('trust proxy', true);
  app.use(
      // app.loopback.token({
      //   model: app.models.accessToken,
      //   currentUserLiteral: 'me',
      //   searchDefaultTokenKeys: false,
      //   cookies: ['access_token'],
      //   headers: ['access_token', 'X-Access-Token'],
      //   params: ['access_token'],
      // }),
      (req, res, next) => {
    // enable useragent
    const uaString = req.headers['user-agent'];
    req.useragent = useragent.parse(uaString);

    // ip from proxy;
    req.ipAddr = req.headers['x-forwarded-for'] || req.ip;
    next();
  });
};
