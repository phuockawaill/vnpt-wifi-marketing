import angular from 'angular';

function routes($stateProvider) {
  'ngInject';

  $stateProvider
    .state('admin.license', {
      url: '/license',
      templateProvider: $templateCache => Promise.all([
        import(/* webpackChunkName: "license-admin" */ './license-admin.pug'),
        import(/* webpackChunkName: "license-history" */ './license-history.pug'),
        import(/* webpackChunkName: "license-fm" */ './license-fm.pug'),
        import(/* webpackChunkName: "license-fm" */ './license-approve.pug'),
        import(/* webpackChunkName: "license" */ './license.pug'),
      ]).spread((templateAdmin, templateHistory, fmTemplate, fmApprove, template) => {
        $templateCache.put('license/license-admin', templateAdmin);
        $templateCache.put('license/license-history', templateHistory);
        $templateCache.put('license/license-fm', fmTemplate);
        $templateCache.put('license/license-approve', fmApprove);
        return template;
      }),
      controller: 'LicenseCtrl as vm',
      resolve: {
        loadCtrl: $ocLazyLoad => Promise
          .all([
            import(/* webpackChunkName: "license" */ './license.controller'),
            import('../../extensions/init/ag-grid'),
            import('../../extensions/directives/select2'),
          ])
          .spread((module) => {
            $ocLazyLoad.load({ name: module.name });
            return module.controller;
          }),
        licenses: function (License, currentUser, User) {
          let query = { order: 'createdAt DESC' };
          if (currentUser.profileName === 'admin') {
            return User.find().$promise
              .then((users) => License.find({ filter: Object.assign({}, query, { where: { "userId": { "inq": users.map(usr => usr.id) } } }) }).$promise)
          } else {
            if (currentUser.profileName !== 'superadmin') {
              query.where = { "userId": currentUser.id };
            }
            return License.find({ filter: query }).$promise;
          }
        },
        currentUser: AuthResolver => AuthResolver.getCurrentUser(),
        accounts: (User) => User.find().$promise,
      },
    });
}

export default angular
  .module('app.license.routing', [])
  .config(routes);
