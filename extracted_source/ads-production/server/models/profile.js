module.exports = (Profile) => {
  Profile.SUPERADMIN = 'superadmin';
  Profile.ADMIN = 'admin';
  Profile.ADVERTISER = 'advertiser';
  Profile.PUBLISHER = 'publisher';
  Profile.CLIENT = 'client';
  Profile.BRAND = 'brand';
  Profile.UNAUTHENTICATED = 'unauthenticated';
  Profile.SYSTEM = 'system';

  /**
   * Hiding all methods
   * */
  Profile.disableRemoteMethodByName('create');
  Profile.disableRemoteMethodByName('upsert');
  Profile.disableRemoteMethodByName('updateAll');
  Profile.disableRemoteMethodByName('updateAttributes');
  Profile.disableRemoteMethodByName('deleteById');
  Profile.disableRemoteMethodByName('count');
  Profile.disableRemoteMethodByName('exists');
  Profile.disableRemoteMethodByName('createChangeStream');
};
