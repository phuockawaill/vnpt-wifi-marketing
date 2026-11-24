const logger = require('../import/logger')().child({
  module: 'job:time-stamp',
});

module.exports = (Model, bootOptions = {}) => {
  const options = Object.assign(
    {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      required: true,
      validateUpsert: false, // default to turning validation off
      silenceWarnings: false,
    },
    bootOptions,
  );

  if (!options.validateUpsert && Model.settings.validateUpsert) {
    Model.settings.validateUpsert = false;
    logger.warn(
      options,
      `${Model.pluralModelName} settings.validateUpsert was overriden to false`,
    );
  }

  if (Model.settings.validateUpsert && options.required) {
    logger.warn(
      options,
      `Upserts for ${Model.pluralModelName} will fail when
          validation is turned on and time stamps are required`,
    );
  }

  Model.defineProperty(options.createdAt, {
    type: Date,
    required: options.required,
  });

  Model.defineProperty(options.updatedAt, {
    type: Date,
    required: options.required,
  });

  Model.observe('before save', (ctx, next) => {
    if (ctx.instance && ctx.isNewInstance) {
      ctx.instance[options.createdAt] = new Date();
    }
    if (ctx.options && ctx.options.skipUpdatedAt) {
      return next();
    }
    if (ctx.instance) {
      ctx.instance[options.updatedAt] = new Date();
    } else {
      ctx.data[options.updatedAt] = new Date();
    }
    return next();
  });
};
