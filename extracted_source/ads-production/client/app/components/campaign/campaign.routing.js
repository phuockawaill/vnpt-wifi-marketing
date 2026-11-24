import moment from 'moment';

function routes($stateProvider) {
  'ngInject';

  $stateProvider.state('admin.campaign', {
    url: '/campaign',
    templateProvider: $templateCache =>
      Promise.all([
        import(/* webpackChunkName: "campaign-tpl" */ './campaign-fm.pug'),
        import(/* webpackChunkName: "campaign-tpl" */ './campaign-fm-banner.pug'),
        import(/* webpackChunkName: "campaign-tpl" */ './campaign-fm-kpi.pug'),
        import(/* webpackChunkName: "campaign-tpl" */ './campaign-fm-location.pug'),
        import(/* webpackChunkName: "campaign-tpl" */ './campaign-fm-advanced.pug'),
        import(/* webpackChunkName: "campaign-tpl" */ './campaign-list-banner.pug'),
        import(/* webpackChunkName: "campaign-tpl" */ './campaign-banner-preview.pug'),
        import(/* webpackChunkName: "campaign-tpl" */ './campaign.pug'),
      ]).spread((fmTemplate, fmBannerTemplate, fmKpiTemplate, fmLocationTemplate, fmAdvTemplate, fmLsBanner, fmBannerPre, template) => {
        $templateCache.put('campaign/campaign-fm', fmTemplate);
        $templateCache.put('campaign/campaign-fm-banner', fmBannerTemplate);
        $templateCache.put('campaign/campaign-fm-kpi', fmKpiTemplate);
        $templateCache.put('campaign/campaign-fm-location', fmLocationTemplate);
        $templateCache.put('campaign/campaign-fm-adv', fmAdvTemplate);
        $templateCache.put('campaign/campaign-list-banner', fmLsBanner);
        $templateCache.put('campaign/campaign-banner-preview', fmBannerPre);
        return template;
      }),
    params: { created: moment().valueOf(), guidance: false },
    controller: 'CampaignCtrl as vm',
    resolve: {
      currentUser: AuthResolver => AuthResolver.getCurrentUser(),
      lib: () => Promise.all([import('moment')]).spread(moment => ({ moment })),
      loadCtrl: $ocLazyLoad =>
        Promise.all([
          import('./campaign.controller'),
          import('../../extensions/init/ag-grid'),
          import('../../extensions/directives/select2'),
          import('../../extensions/directives/date-range-picker'),
          import('../../extensions/directives/tooltip'),
        ]).spread((module) => {
          $ocLazyLoad.load({ name: module.name });
          return module.controller;
        }),
      campaigns: (currentUser, User, Campaign) => {
        let query = {};
        if (currentUser.profileName === 'admin') {
          return User.find().$promise
            .then(users => Campaign.find({ filter: { where: { createdBy: { inq: users.map(usr => usr.id).concat(currentUser.id) } } } }).$promise)
        } else {
          if (currentUser.profileName !== 'superadmin') {
            query = { where: { createdBy: currentUser.id } };
          }
          return Campaign.find({ filter: query }).$promise;
        }
      },
      banners: (currentUser, User, Banner) => {
        let query = { fields: { id: 1, name: 1 } };
        if (currentUser.profileName === 'admin') {
          return User.find().$promise
            .then(users => Banner.find({ filter: Object.assign({}, query, { where: { createdBy: { inq: users.map(usr => usr.id).concat(currentUser.id) } } }) }).$promise)
        } else {
          if (currentUser.profileName !== 'superadmin') {
            query = Object.assign({}, query, { where: { createdBy: currentUser.id } });
          }
          return Banner.find({ filter: query }).$promise;
        }
      },
      locations: (currentUser, User, Location) => {
        let query = {
          fields: {
            id: 1,
            name: 1,
            cityId: 1,
            cityName: 1,
            categoryId: 1,
            categoryName: 1,
          },
        };
        if (currentUser.profileName === 'admin') {
          return User.find().$promise
            .then(users => Location.find({ filter: Object.assign({}, query, { where: { createdBy: { inq: users.map(usr => usr.id).concat(currentUser.id) } } }) }).$promise);
        } else {
          if (currentUser.profileName !== 'superadmin') {
            query = Object.assign({}, query, { where: { createdBy: currentUser.id } });
          }
          return Location.find({ filter: query }).$promise;
        }
      },
      brands: (currentUser, User, Brand) => {
        let query = {};
        if (currentUser.profileName === 'admin') {
          return User.find().$promise
            .then(users => Brand.find({ filter: { where: { createdBy: { inq: users.map(usr => usr.id).concat(currentUser.id) } } } }).$promise)
        } else {
          if (currentUser.profileName !== 'superadmin') {
            query = { where: { createdBy: currentUser.id } };
          }
          return Brand.find({ filter: query }).$promise
        }
      },

      ages: (currentUser, CommonData) => CommonData.ageCategories(),
      genders: (currentUser, CommonData) => CommonData.genderCategories(),
      devices: (currentUser, CommonData) => CommonData.deviceCategories(),
      oses: (currentUser, CommonData) => CommonData.osCategories(),
      incomes: (currentUser, CommonData) => CommonData.incomeCategories(),
      websiteCats: CommonData => CommonData.websiteCategories(),
      shares: (PublisherShare, currentUser) => PublisherShare.find({ filter: { where: { userId: currentUser.id } } }).$promise
    },
  });
}

export default angular.module('campaign.routing', []).config(routes);
