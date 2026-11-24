import Promise from 'bluebird';

const debug = require('debug')('app:seed:authentication');
const error = require('debug')('err:seed:authentication');

export default function (app) {
  const models = app.models;
  const authenticationInfo = require('./authentication.json');

  return Promise
    .all([
      Promise.map(authenticationInfo.profiles, profile => models.Profile
        .create(profile)
        .catch(error)),
      Promise.map(authenticationInfo.users, user => models.user
        .create(user)
        .catch(error)),
      Promise.map(authenticationInfo.menuTrees, menu => models.MenuTree
        .create(menu)
        .catch(error)),
    ])
    .then(([profiles, users, menuTrees]) => {
      debug('Profiles', profiles);
      debug('Users', users);
      debug('MenuTrees', menuTrees);

      return Promise
        .all([
          Promise
            .map(users, (user, index) => user
              .updateAttributes({
                profileId: profiles[index].id,
                profileName: profiles[index].name,
              })
              .catch(error)),
          Promise
            .map(profiles, (profile, index) => profile
              .updateAttributes({
                menuTreeId: menuTrees[index].id,
                menuTreeName: menuTrees[index].name,
              })
              .catch(error)),
        ]);
    })
    .then(() => models.role.create(authenticationInfo.roles))
    .then((roles) => {
      debug('Roles', roles);

      return Promise.map(authenticationInfo.roleProfileMappings, map => Promise
        .all([
          models.Profile
            .findOne({ where: { name: map.profileName } })
            .catch(error),
          models.role
            .findOne({ where: { name: map.roleName } })
            .catch(error),
        ])
        .then(([profile, role]) => models.RoleProfileMapping.create({
          roleId: role.id,
          roleName: role.name,
          profileId: profile.id,
          profileName: profile.name,
        }).catch(error)),
      );
    })
    .then((roleMappings) => {
      debug('Role Mappings', roleMappings);
    })
    .catch(error);
}
