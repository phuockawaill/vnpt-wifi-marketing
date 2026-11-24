const { standardizeUsername } = require('../import/utils');

module.exports = (Brand) => {
  /**
   * Hiding all methods
   * */
  Brand.disableRemoteMethodByName('updateAll');
  Brand.disableRemoteMethodByName('createChangeStream');
  Brand.disableRemoteMethodByName('login');
  Brand.disableRemoteMethodByName('logout');
  Brand.disableRemoteMethodByName('reset');
  Brand.disableRemoteMethodByName('confirm');
  Brand.disableRemoteMethodByName('__count__accessTokens');
  Brand.disableRemoteMethodByName('__create__accessTokens');
  Brand.disableRemoteMethodByName('__delete__accessTokens');
  Brand.disableRemoteMethodByName('__destroyById__accessTokens');
  Brand.disableRemoteMethodByName('__findById__accessTokens');
  Brand.disableRemoteMethodByName('__get__accessTokens');
  Brand.disableRemoteMethodByName('__updateById__accessTokens');
  Brand.disableRemoteMethodByName('__get__owner');
  Brand.disableRemoteMethodByName('__get__resourceGroup');
  Brand.disableRemoteMethodByName('__get__profile');

  // Set profile to CLIENT by default
  // and don't allow to change
  Brand.observe('before save', (ctx, next) => {
    if (ctx.instance && ctx.isNewInstance) {
      const { Profile } = Brand.app.models;

      if (!ctx.instance.email || !ctx.instance.username) {
        const username = standardizeUsername(
          ctx.instance.username || ctx.instance.name,
        );
        ctx.instance.email = `${username}@please.change.this.com`;
        ctx.instance.username = ctx.instance.username || username;
      }

      Profile.findOne({ where: { name: Profile.BRAND } })
        .then((profile) => {
          ctx.instance.profileName = profile.name;
          ctx.instance.profileId = profile.id;
          next();
        })
        .catch((err) => {
          next(err);
        });
    } else if (ctx.instance) {
      delete ctx.instance.profileId;
      delete ctx.instance.profileName;
      next();
    } else if (ctx.data) {
      delete ctx.data.profileId;
      delete ctx.data.profileName;
      next();
    }
  });

  Brand.observe('access', (ctx, next) => {
    const { Profile } = Brand.app.models;
    if (!ctx.query.where) {
      ctx.query.where = {};
    }
    ctx.query.where.profileName = Profile.BRAND;
    next();
  });
};
