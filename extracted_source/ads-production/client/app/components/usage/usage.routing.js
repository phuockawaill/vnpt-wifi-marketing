function routes($urlRouterProvider, $stateProvider) {
  'ngInject';

  $stateProvider
    .state('report.usage', {
      url: '/usage',
      templateProvider: $templateCache => Promise.all([
        import(/* webpackChunkName: "usage-template" */ './usage-sidebar.pug'),
        import(/* webpackChunkName: "usage-template" */ './usage-main.pug'),
        import(/* webpackChunkName: "usage-template" */ './usage.pug')
      ]).spread((sideTemplate, mainTemplate, template) => {
        $templateCache.put('usage/usage-sidebar', sideTemplate);
        $templateCache.put('usage/usage-main', mainTemplate);
        return template;
      }),
      controller: 'UsageCtrl as vm',
      resolve: {
        currentUser: AuthResolver => AuthResolver.getCurrentUser(),
        loadCtrl: $ocLazyLoad => Promise
          .all([
            import('./usage.controller'),
            import('../../extensions/init/ag-grid'),
            import('../../extensions/directives/date-range-picker'),
            import('../../extensions/directives/select2'),
            import('../../extensions/directives/highchart/index')
          ])
          .spread((module) => {
            $ocLazyLoad.load({ name: module.name });
            return module.controller;
          }),
        lib: () => Promise
          .all([import('moment')])
          .spread(moment => ({ moment })),
        campaigns: (currentUser, User, Campaign) => {
            let query = {};
            if (currentUser.profileName === 'admin') {
                return User.find().$promise
                .then(users => Campaign.find({ filter: { where: { createdBy: { inq: users.map(usr => usr.id).concat(currentUser.id) } } } }).$promise);
            } else {
                if (currentUser.profileName !== 'superadmin') {
                    query = { where: { or: [
                        { createdBy: currentUser.id },
                        { brandId: currentUser.id },
                        { brands: currentUser.id }
                    ] } };
                }
                return Campaign.find({ filter: query }).$promise;
            }
        },
        banners: (Banner) => Banner.find().$promise,
        locations: (Location) => Location.find().$promise,
        genderCats: CommonData => CommonData.genderCategories(true),
        ageCats: CommonData => CommonData.ageCategories(true),
        incomeCats: CommonData => CommonData.incomeCategories(true),
        deviceCats: CommonData => CommonData.deviceCategories(true),
        osCats: CommonData => CommonData.osCategories(true),
        websiteCats: CommonData => CommonData.websiteCategories(true),
        shares: (PublisherShare, currentUser) => PublisherShare.find({ filter: { where: { userId: currentUser.id } } }).$promise
      }
    });
}

export default angular
  .module('app.usage.routing', [])
  .config(routes);
