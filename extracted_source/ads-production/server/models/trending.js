const moment = require('moment');

module.exports = (Trending) => {
  Trending.upComing = () =>
    Trending.find({ where: { timeTo: { gte: moment() } } });

  Trending.remoteMethod('upComing', {
    http: { path: '/next', verb: 'get' },
    returns: { arg: 'trending', type: 'array', root: true },
  });
};
