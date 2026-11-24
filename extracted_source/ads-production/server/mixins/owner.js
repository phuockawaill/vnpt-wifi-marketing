const lodash = require('lodash');
const ObjectId = require('mongodb').ObjectId;
const debug = require('debug')('mixin:owner');

const currentUserField = '$currentUser';

module.exports = (Model, options) => {
  options = Object.assign(
    {
      field: 'ownedBy',
      sourceFields: [currentUserField],
    },
    options,
  );

  Model.defineProperty(options.field, { type: [ObjectId] });
  if (!Model.settings.hidden) {
    Model.settings.hidden = [];
  }
  Model.settings.hidden.push(options.field);

  Model.observe('before save', (ctx, next) => {
    const user = lodash.get(ctx, 'options.user');
    if (!user) return process.nextTick(next);

    const ownedBy = [];
    const data = ctx.instance || ctx.data;
    options.sourceFields.forEach((field) => {
      if (field === currentUserField) {
        ownedBy.push(user.id);
      } else if (data[field]) {
        ownedBy.push(data[field]);
      }
    });

    data[options.field] = ownedBy;
    debug(Model.modelName, 'set owner', ownedBy);
    return next();
  });

  Model.observe('access', (ctx, next) => {
    const user = lodash.get(ctx, 'options.user');
    if (!user) return next();

    const { Role } = Model.app.models;
    if (user.roles.indexOf(Role.ADMIN) > -1) {
      return next();
    }
    lodash.set(ctx, `query.where.${options.field}`, user.id);
    return next();
  });

  // Model.on('attached', () => {
  //   const { ACL } = Model.app.models;
  //   ACL.create([
  //     {
  //       model: Model.modelName,
  //       accessType: 'EXECUTE',
  //       property: 'create',
  //       principalType: 'ROLE',
  //       principalId: `create${Model.modelName}`,
  //       permission: 'ALLOW',
  //     },
  //     {
  //       model: Model.modelName,
  //       accessType: 'EXECUTE',
  //       property: 'upsert',
  //       principalType: 'ROLE',
  //       principalId: `create${Model.modelName}`,
  //       permission: 'ALLOW',
  //     },
  //     {
  //       model: Model.modelName,
  //       accessType: 'EXECUTE',
  //       property: 'create',
  //       principalType: 'ROLE',
  //       principalId: '$everyone',
  //       permission: 'DENY',
  //     },
  //     {
  //       model: Model.modelName,
  //       accessType: 'EXECUTE',
  //       property: 'upsert',
  //       principalType: 'ROLE',
  //       principalId: '$everyone',
  //       permission: 'DENY',
  //     },
  //     {
  //       model: Model.modelName,
  //       accessType: 'READ',
  //       principalType: 'ROLE',
  //       principalId: '$owner',
  //       permission: 'ALLOW',
  //     },
  //     {
  //       model: Model.modelName,
  //       accessType: 'WRITE',
  //       principalType: 'ROLE',
  //       principalId: '$owner',
  //       permission: 'ALLOW',
  //     },
  //   ]);
  // });
};
