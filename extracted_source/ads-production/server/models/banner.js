const Promise = require('bluebird');
const { embedCodeHtml } = require('../import/banner-util');
const { lstatSync, readdirSync } = require('fs');
const { join } = require('path');

const isDirectory = source => lstatSync(source).isDirectory();
const getDirectories = source => readdirSync(source).map(name => name);
const srcTree = (parent, source, images) => {
    if (isDirectory(`${parent}/${source}`)) {
        return { name: source, link: `${parent}/${source}`, child: getDirectories(`${parent}/${source}`).map(name => srcTree(`${parent}/${source}`, name, images)) };
    } else {
        if (source.match(/.(jpg|jpeg|png|gif)$/i)) {
            images.push(`${parent}/${source}`);
        }
        return { name: source, link: `${parent}/${source}` };
    }
};
const debug = require('debug')('app:model:Banner');
const error = require('debug')('err:model:Banner');
const { ObjectId } = require('mongodb').ObjectID;

module.exports = (Banner) => {
  Banner.defineProperty('createdBy', { type: ObjectId, require: true });
  Banner.observe('after save', (ctx, next) => {
    const { BannerCached } = Banner.app.models;

    let chain = Promise.resolve();

    debug(ctx);

    if (ctx.instance) {
      chain = chain.then(() => [ctx.instance]);
    } else if (ctx.data && ctx.where) {
      chain = chain.then(() => Banner.find({ where: ctx.where }));
    } else {
      chain = chain.then(() => []);
    }

    chain
      .then(banners =>
        Promise.each(banners, (banner) => {
          debug('cache banner %s', banner.name);
          return BannerCached.upsert(banner.toJSON());
        }),
      )
      .then(() => next())
      .catch((err) => {
        error('cache banner failed');
        error(err);
        next(err);
      });
  });

  Banner.preview = (bannerId, req, res) =>
    Banner.findById(bannerId, { skipCheckResource: true }).then((banner) => {
      if (!banner) {
        return Promise.reject({ statusCode: 404 });
      }
      res.header('Content-Type', 'text/html');
      // res.header('X-Frame-Options', `allow-from ${req.headers.referer}`);
      res.header('X-Frame-Options', 'SAMEORIGIN');
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET');
      res.header('Access-Control-Allow-Credentials', 'true');
      return res.send(embedCodeHtml(banner));
    });
  Banner.remoteMethod('preview', {
    description: 'Preview banner',
    accepts: [
      { arg: 'bannerId', type: 'string' },
      { arg: 'req', type: 'object', http: { source: 'req' } },
      { arg: 'res', type: 'object', http: { source: 'res' } }
    ],
    http: { verb: 'get', path: '/:bannerId/preview' }
  });

  Banner.sourceDir = (req, res, cb) => {
      const { AccessToken, Configuration, User } = Banner.app.models;
      Promise.all([Configuration.find({}), Promise.promisify(AccessToken.findForRequest).call(AccessToken, req)])
      .spread((configs, token) => {
          let obj = {};
          configs.forEach((item) => { obj[item.key] = item.value });
          return Promise.all([obj, User.findById(token.userId, { fields: { password: 0 } })]);
      }).then(([config, usr]) => {
          let physicPath = config.cloudDir, images = [];
          if (usr.rootdir) {
              if (usr.rootdir !== '/') {
                  physicPath += usr.rootdir;
              }
              res.send({ link:'/', child: getDirectories(physicPath).map(name => srcTree(physicPath, name, images)), images });
          } else {
              res.send({});
          }
      })
      .catch((err) => {
        cb(err);
      });
  };
  Banner.remoteMethod('sourceDir', {
    description: 'Preview banner',
    accepts: [
        { arg: 'req', type: 'object', http: { source: 'req' } },
        { arg: 'res', type: 'object', http: { source: 'res' } },
    ],
    http: { verb: 'post', path: '/sourceDir' }
  });
};
