const { ObjectId } = require('mongodb').ObjectID;
const logger = require('../import/logger')().child({ module: 'job:creator' });

module.exports = (Model) => {
  Model.defineProperty('createdBy', { type: ObjectId });
  Model.defineProperty('createdByUsername', { type: 'string' });
  Model.defineProperty('updatedBy', { type: ObjectId });
  Model.defineProperty('updatedByUsername', { type: 'string' });

  Model.observe('before save', (ctx, next) => {
    const { User } = Model.app.models;
    const context = ctx.options && ctx.options.accessToken;
    if (!context) {
      return next();
    }
    User.findById(context.userId, { fields: { name: 1, username: 1 } }, (err, user) => {
      if (err) return next(err);

      if (ctx.instance && ctx.isNewInstance) {
        ctx.instance.createdBy = context.userId || null;
        ctx.instance.createdByUsername = user && (user.name || user.username || '');
        return next();
      } else {
        if (ctx.instance) {
          ctx.instance.updatedBy = context.userId || null;
          ctx.instance.updatedByUsername = user && (user.name || user.username || '');
        } else if (ctx.data) {
          ctx.data.updatedBy = context.userId || null;
          ctx.data.updatedByUsername = user && (user.name || user.username || '');
        }

        if ((ctx.instance && ctx.instance.createdBy) || (ctx.data && ctx.data.createdBy)) {
          User.findById(ctx.instance.createdBy || ctx.data.createdBy, (err, userCreate) => {
            if (ctx.instance) {
              ctx.instance.createdByUsername = userCreate && (userCreate.name || userCreate.username || '');
            } else if (ctx.data) {
              ctx.data.createdByUsername = userCreate && (userCreate.name || userCreate.username || '');
            }
          });
          return next();
        } else {
          return next();
        }
      }


    });
  });
};
