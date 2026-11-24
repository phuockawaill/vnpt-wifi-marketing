const logger = require('../import/logger')().child({ module: 'read-only' });

module.exports = (Model, options) => {
  const stripReadOnlyProperties = (ctx, modelInstance, next) => {
    const body = ctx.args;
    if (!body) {
      return next();
    }
    const properties = Object.keys(options).length ? options : null;
    if (properties) {
      logger.debug(
        { properties },
        'Strip readonly properties of %s',
        Model.modelName,
      );
      Object.keys(properties).forEach((key) => {
        delete body[key];
      });
    }
    return next();
  };

  Model.beforeRemote('create', stripReadOnlyProperties);
  Model.beforeRemote('upsert', stripReadOnlyProperties);
  Model.beforeRemote('updateAll', stripReadOnlyProperties);
  Model.beforeRemote('prototype.updateAttributes', stripReadOnlyProperties);
  Model.beforeRemote('prototype.patchAttributes', stripReadOnlyProperties);
};
