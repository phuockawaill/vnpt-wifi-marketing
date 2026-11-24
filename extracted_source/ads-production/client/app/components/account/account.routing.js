import angular from 'angular';
import moment from 'moment';

function routes($stateProvider) {
  'ngInject';

  $stateProvider
    .state('admin.account', {
      url: '/account',
      templateProvider: $templateCache => Promise.all([
        import(/* webpackChunkName: "account-template" */ './account-fm.pug'),
        import(/* webpackChunkName: "account-template" */ './account.pug'),
      ]).spread((fmTemplate, template) => {
        $templateCache.put('account/account-fm', fmTemplate);
        return template;
      }),
      params: { created: moment().valueOf(), guidance: false },
      controller: 'AccountCtrl as vm',
      resolve: {
        loadCtrl: $ocLazyLoad => Promise
          .all([
            import('../../extensions/init/ag-grid'),
            import(/* webpackChunkName: "account" */ './account.controller'),
          ])
          .spread((agGrid, module) => {
            $ocLazyLoad.load({ name: module.name });
            return module.controller;
          }),
        accounts: (User) => User.find().$promise,
        campaigns: (currentUser, User, Campaign) => {
          let query = {};
          if (currentUser.profileName === 'admin') {
            return User.find().$promise
              .then((users) => Campaign.find({
                filter: {
                  where: {
                    "or": [
                      { "createdBy": currentUser.id },
                      ...users.map(usr => ({ "createdBy": usr.id }))
                    ]
                  }
                }
              }).$promise)
          } else {
            if (currentUser.profileName !== 'superadmin') {
              query = { where: { "createdBy": currentUser.id } };
            }
            return Campaign.find({ filter: query }).$promise
          }
        },
        profiles: (Profile, currentUser) => Profile.find().$promise,
        currentUser: AuthResolver => AuthResolver.getCurrentUser()
      }
    });
}

export default angular
  .module('app.account.routing', [])
  .config(routes);
