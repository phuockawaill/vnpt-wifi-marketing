function routes($urlRouterProvider, $stateProvider) {
  'ngInject';

  $urlRouterProvider.otherwise('/report/dashboard');
  $stateProvider
    .state('report.dashboard', {
      url: '/dashboard',
      templateProvider: $templateCache => Promise.all([
        import(/* webpackChunkName: "dashboard-template" */ './dashboard-sidebar.pug'),
        import(/* webpackChunkName: "dashboard-template" */ './dashboard-main.pug'),
        import(/* webpackChunkName: "dashboard-template" */ './dashboard.pug')
      ]).spread((sideTemplate, mainTemplate, template) => {
        $templateCache.put('dashboard/dashboard-sidebar', sideTemplate);
        $templateCache.put('dashboard/dashboard-main', mainTemplate);
        return template;
      }),
      controller: 'DashboardCtrl as vm',
      resolve: {
        currentUser: AuthResolver => AuthResolver.getCurrentUser(),
        loadCtrl: $ocLazyLoad => Promise
          .all([
            import('./dashboard.controller'),
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
  .module('app.dashboard.routing', [])
  .config(routes);
