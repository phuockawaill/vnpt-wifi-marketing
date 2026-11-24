const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');

const debug = require('debug')('app:boot:cache-tracking-code');
const error = require('debug')('err:boot:cache-tracking-code');

module.exports = (app, next) => {
  if (!app.shouldStart) return next();

  const fileExt = app.get('template').useMinified ? '.min.js' : '.tpl.js';

  const cache = file =>
    Promise.promisify(fs.readFile).call(fs, file, 'utf8').then((data) => {
      const key = path.basename(file, fileExt);
      app.set(key, data);
      debug('cached template %s as %s', file, key);
    });

  return Promise.promisify(fs.readdir)
    .call(fs, path.resolve(__dirname, '../templates'))
    .reduce((selectedFiles, fileName) => {
      if (fileName.slice(-7) === fileExt) selectedFiles.push(fileName);
      return selectedFiles;
    }, [])
    .each(file => cache(path.resolve(__dirname, '../templates', file)))
    .then(() => next())
    .catch((err) => {
      error('cache template failed');
      error(err);
      next(err);
    });
};
