const jwt = require('json-web-token');
const path = require('path');

// const debug = require('debug')('app:boot:current-user');
const error = require('debug')('err:boot:current-user');

module.exports = function currentUser() {
  const getCurrentUserByJwt = async (req, res) => {
    const jwtToken = req.headers['jwt-token'] || req.query.jwtToken;
    const jwtClientId = req.headers['jwt-client-id'] || req.query.jwtClientId;
    if (!jwtToken || !jwtClientId) {
      return null;
    }

    const { user: User, accessToken: AccessToken } = req.app.models;
    const user = await User.findOne({
      fields: { password: 0 },
      where: { clientId: jwtClientId },
    });

    let jwtInfo;
    try {
      jwtInfo = await Promise.promisify(jwt.decode).call(
        jwt,
        user.secretkey,
        jwtToken,
      );
    } catch (err) {
      error('decode jwt token failed');
      error(err);
    }
    if (!jwtInfo) return null;

    let actualDir = path.join(user.rootdir, jwtInfo.dir || '');
    if (actualDir.indexOf(user.rootdir) !== 0) return null;
    if (actualDir.indexOf('/') !== 0) {
      actualDir = `/${actualDir}`;
    }

    const token = await AccessToken.create({ userId: user.id, dir: actualDir });
    req.accessToken = token;
    res.cookie('access_token', token.id, {
      httpOnly: true,
      signed: true,
      maxAge: 1000 * token.ttl,
    });

    user.rootdir = actualDir;
    return user;
  };

  const getCurrentUserByToken = async (req) => {
    const { user: User, accessToken: AccessToken } = req.app.models;
    const token = await Promise.promisify(AccessToken.findForRequest).call(
      AccessToken,
      req,
    );
    if (!token) return null;

    const user = await User.findById(token.userId, { fields: { password: 0 } });
    if (user) {
      req.accessToken = token;
      user.rootdir = token.dir || user.rootdir || '/';

      if (user.rootdir.indexOf('/') !== 0) {
        user.rootdir = `/${user.rootdir}`;
      }
    }

    return user;
  };

  return function setCurrentUser(req, res, next) {
    return getCurrentUserByJwt(req, res)
      .then(user => user || getCurrentUserByToken(req, res))
      .then((user) => {
        req.user = user;
        next();
        return user;
      })
      .catch((err) => {
        error('get current user failed');
        error(err);
        next();
      });
  };
};
