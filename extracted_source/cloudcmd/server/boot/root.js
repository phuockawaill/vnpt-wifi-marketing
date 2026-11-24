module.exports = function root(app) {
  const router = app.loopback.Router();
  router.get('/', (req, res) => res.redirect(app.get('cloudcmd').mountPath));
  router.get('/status', app.loopback.status());

  router.all('/config', (req, res) => {
    if (!req.user) {
      return res.render('login.pug');
    } else if (req.user && req.user.type === 0) {
      return res.redirect('/');
    }
    return res.render('config.pug');
  });
  app.use(router);
};
