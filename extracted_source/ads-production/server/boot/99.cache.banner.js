const Promise = require('bluebird');
const error = require('debug')('err:boot:cache-banner');

module.exports = (app, next) => {
  if (!app.shouldStart) return next();

  const { Banner, BannerCached } = app.models;

  return Banner.find()
    .then(banners =>
      Promise.map(banners, banner => BannerCached.upsert(banner.toJSON()), {
        concurrency: 5,
      }),
    )
    .then(() => next())
    .catch((err) => {
      error('cache banner failed');
      error(err);
      next();
    });
};
