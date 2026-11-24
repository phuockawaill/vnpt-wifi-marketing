const logger = require('../import/logger')().child({ module: 'job:expire' });

module.exports = (Model, options) => {
  const idField = '_ids';
  const clientField = '_client';

  if (Model.getDataSource().connector.name !== 'redis') {
    logger.error('Expire', 'Only redis connector is supported');
    return;
  }
  if (
    !Model.definition[idField].length ||
    Model.definition[idField][0].name !== 'id'
  ) {
    logger.error('Expire', 'Model must have id field named `id`');
    return;
  }

  const ttl = (options && options.ttl) || 600;

  Model.observe('after save', (ctx, next) => {
    const data = ctx.instance || ctx.data;
    if (!data || !data.id) {
      return next();
    }

    Model.getDataSource().connector.client[
      clientField
    ].expire(`${Model.modelName}:${data.id}`, ttl, () => {
      next();
    });

    return null;
  });
};
