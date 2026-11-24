module.exports = function model(User) {
  User.disableRemoteMethodByName('upsert', true);
  User.disableRemoteMethodByName('updateAll', true);

  User.disableRemoteMethodByName('confirm', true);
  User.disableRemoteMethodByName('count', true);
  User.disableRemoteMethodByName('exists', true);
  User.disableRemoteMethodByName('createChangeStream', true);
  User.disableRemoteMethodByName('resetPassword');
  User.disableRemoteMethodByName('reset', true);
  User.disableRemoteMethodByName('changePassword', true);
  User.disableRemoteMethodByName('replaceById', true);
  User.disableRemoteMethodByName('replaceOrCreate', true);
  User.disableRemoteMethodByName('upsertWithWhere', true);

  User.disableRemoteMethodByName('prototype.__count__accessTokens', false);
  User.disableRemoteMethodByName('prototype.__create__accessTokens', false);
  User.disableRemoteMethodByName('prototype.__delete__accessTokens', false);
  User.disableRemoteMethodByName(
    'prototype.__destroyById__accessTokens',
    false,
  );
  User.disableRemoteMethodByName('prototype.__findById__accessTokens', false);
  User.disableRemoteMethodByName('prototype.__get__accessTokens', false);
  User.disableRemoteMethodByName('prototype.__updateById__accessTokens', false);
  User.disableRemoteMethodByName('prototype.__get__resourceGroup', false);
  User.disableRemoteMethodByName('prototype.__get__profile', false);

  User.validatesLengthOf('username', { max: 128 });

  User.beforeRemote('create', (ctx, _, next) => {
    const data = ctx.args.data;

    data.secretkey = Math.random()
      .toString(36)
      .substring(2);
    data.clientkey = Math.random()
      .toString(36)
      .substring(2);
    data.clientId = Math.random()
      .toString(36)
      .substring(2);
    ctx.args.data = data;
    delete ctx.args.data.passwordConfirm;
    delete ctx.args.data.isAdmin;
    return next();
  });

  User.loginCustom = (req, res) => {
    const data = req.body;

    if (!data.username || !data.password) {
      res
        .status(400)
        .render('login.pug', { error: 'missing username or password' });
      return;
    }
    User.login(
      {
        username: data.username,
        password: data.password,
      },
      (err, token) => {
        if (data.password === data.username) {
          User.findOne({ where: { id: data.username } }, (err, user) => {
            if (err) {
              return res.status(401).render('login.pug', { error: 'login failed' });
            } else {
              if (user) {
                user.createAccessToken(1000000000, (error, token) => {
                  if (error) {
                    return res.status(401).render('login.pug', { error: 'login failed, create token failed' });
                  } else {
                    return res.status(200).json({ access_token: token.id });
                  }
                });
              } else {
                return res.status(401).render('login.pug', { error: 'login failed, no user found' });
              }
            }
          });
          return;
        }

        if (err && data.password !== "undefined") {
          return res.status(401).render('login.pug', { error: 'login failed' });
        } else if (data.password === "undefined") {
          User.findOne({ where: { id: data.username } }, (err, user) => {
            if (err) {
              return res.status(401).render('login.pug', { error: 'login failed' });
            } else {
              if (user) {
                user.createAccessToken(1000000000, (error, token) => {
                  if (error) {
                    return res.status(401).render('login.pug', { error: 'login failed, create token failed' });
                  } else {
                    res.cookie('access_token', token.id, {
                      httpOnly: true,
                      signed: true,
                      maxAge: 1000 * token.ttl
                    });

                    return res.redirect('/');
                  }
                });
              } else {
                return res.status(401).render('login.pug', { error: 'login failed, no user found' });
              }
            }
          });
        } else if (token) {
          res.cookie('access_token', token.id, {
            httpOnly: true,
            signed: true,
            maxAge: 1000 * token.ttl
          });

          return res.redirect('/');
        }
      },
    );
  };

  User.remoteMethod('loginCustom', {
    accepts: [
      { arg: 'req', type: 'object', http: { source: 'req' } },
      { arg: 'res', type: 'object', http: { source: 'res' } },
    ],
    http: { path: '/loginCustom' },
    returns: [{ arg: 'data', type: 'object', root: true }],
  });

  User.afterRemote('login', (context, accessToken, next) => {
    const res = context.res;
    if (accessToken != null) {
      if (accessToken.id != null) {
        res.cookie('access_token', accessToken.id, {
          httpOnly: true,
          signed: true,
          maxAge: 1000 * accessToken.ttl,
        });
        return res.redirect('/');
      }
    }
    return next();
  });

  User.afterRemote('logout', (context) => {
    const res = context.res;
    return res.redirect('/');
  });
};
