const Promise = require('bluebird');

module.exports = (RoleProfileMapping) => {
  RoleProfileMapping.observe('after save', (ctx, next) => {
    if (ctx.instance && ctx.isNewInstance) {
      const models = RoleProfileMapping.app.models;

      models.user
        .find({
          where: { profileId: ctx.instance.profileId },
          fields: { id: 1 },
        })
        .then(users =>
          Promise.map(users, user =>
            models.roleMapping.create({
              principalType: models.roleMapping.USER,
              principalId: user.id,
              roleId: ctx.instance.roleName,
            }),
          ),
        )
        .then(() => next())
        .catch(() => next());
    } else {
      next();
    }
  });

  RoleProfileMapping.observe('after delete', (ctx, next) => {
    if (ctx.instance) {
      const models = RoleProfileMapping.app.models;

      models.user
        .find({
          where: { profileId: ctx.instance.profileId },
          fields: { id: 1 },
        })
        .then((users) => {
          const userIds = users.map(user => user.id);
          return models.roleMapping.destroyAll({
            principalType: models.roleMapping.USER,
            principalId: { inq: userIds },
            roleId: ctx.instance.roleName,
          });
        })
        .then(() => next())
        .catch(() => {
          next();
        });
    } else {
      next();
    }
  });
};
