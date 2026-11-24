import angular from 'angular';

function routes($stateProvider) {
  'ngInject';

  $stateProvider
    .state('report.crm', {
      url: '/crm',
      templateProvider: $templateCache => Promise.all([
        import(/* webpackChunkName: "crm-template" */ './crm-sidebar.pug'),
        import(/* webpackChunkName: "crm-template" */ './crm-main.pug'),
        import(/* webpackChunkName: "crm-template" */ './crm-fm-category.pug'),
        import(/* webpackChunkName: "crm-template" */ './crm-location-moving.pug'),
        import(/* webpackChunkName: "crm-template" */ './crm.pug'),
    ]).spread((sideTemplate, mainTemplate, fmCategory, fmLocationMv, template) => {
        $templateCache.put('crm/crm-sidebar', sideTemplate);
        $templateCache.put('crm/crm-fm-category', fmCategory);
        $templateCache.put('crm/crm-location-moving', fmLocationMv);
        $templateCache.put('crm/crm-main', mainTemplate);
        return template;
      }),
      controller: 'CrmCtrl as vm',
      resolve: {
        currentUser: AuthResolver => AuthResolver.getCurrentUser(),
        loadCtrl: $ocLazyLoad => Promise
          .all([
            import('./crm.controller'),
            import('../../extensions/init/ag-grid'),
            import('../../extensions/directives/select2'),
            import('../../extensions/directives/date-range-picker'),
            import('../../extensions/directives/highchart/index'),
          ])
          .spread((module) => {
            $ocLazyLoad.load({ name: module.name });
            return module.controller;
          }),
        lib: () => Promise
          .all([
            import('moment'),
          ])
          .spread(moment => ({
            moment,
          })),

        campaigns: (currentUser, User, Campaign) => {
            let query = { fields: { id: 1, name: 1, locations: 1, customFields: 1 } };
            if (currentUser.profileName === 'admin') {
                return User.find().$promise
                .then((users)=>Campaign.find({filter: Object.assign({}, query, {where: {"createdBy": {"inq": users.map(usr=>usr.id).concat(currentUser.id)}}})}).$promise)
            } else {
                if (currentUser.profileName !== 'superadmin') {
                    query = Object.assign({}, query, {where: {"or": [
                        {"createdBy": currentUser.id},
                        {"brandId": currentUser.id},
                        {"brands": currentUser.id}
                    ]}});
                }
                return Campaign.find({ filter: query }).$promise
            }
        },

        locations: (Location) => {
            return Location.find({filter: {where:{}}}).$promise;
        },

        ages: (currentUser, CommonData) => CommonData.ageCategories(),
        genders: (currentUser, CommonData) => CommonData.genderCategories(),
        devices: (currentUser, CommonData) => CommonData.deviceCategories(),
        oses: (currentUser, CommonData) => CommonData.osCategories(),
        incomes: (currentUser, CommonData) => CommonData.incomeCategories(),
        websiteCats: CommonData => CommonData.websiteCategories(true),
      },
    });
}

export default angular
  .module('app.crm.routing', [])
  .config(routes);
