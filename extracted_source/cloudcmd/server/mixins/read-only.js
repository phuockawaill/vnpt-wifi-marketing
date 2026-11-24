module.exports = (Model, options) => {
  Model.stripReadOnlyProperties = (ctx, modelInstance, next) => {
    if (typeof modelInstance === 'function') {
      next = modelInstance;
      modelInstance = {};
    }
    const body = ctx.args.data || ctx.args;
    if (!body) {
      next();
      return;
    }
    const properties = Object.keys(options).length ? options : null;
    if (properties) {
      Object.keys(properties).forEach((key) => {
        delete body[key];
      });
      next();
    } else {
      next();
    }
  };

  Model.beforeRemote('updateAll', Model.stripReadOnlyProperties);
  Model.beforeRemote('patchOrCreate', Model.stripReadOnlyProperties);
  Model.beforeRemote('replaceById', Model.stripReadOnlyProperties);
  Model.beforeRemote('replaceOrCreate', Model.stripReadOnlyProperties);
  Model.beforeRemote('prototype.save', Model.stripReadOnlyProperties);
  Model.beforeRemote(
    'prototype.patchAttributes',
    Model.stripReadOnlyProperties,
  );
  Model.beforeRemote(
    'prototype.replaceAttributes',
    Model.stripReadOnlyProperties,
  );
};
