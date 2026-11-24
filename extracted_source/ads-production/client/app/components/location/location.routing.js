import angular from 'angular';
import moment from 'moment';

function routes($stateProvider) {
  'ngInject';

  $stateProvider
    .state('admin.location', {
      url: '/location',
      templateProvider: $templateCache => Promise.all([
        import(/* webpackChunkName: "location-template" */ './location.pug'),
        import(/* webpackChunkName: "location-template" */ './location-fm.pug'),
        import(/* webpackChunkName: "location-template" */ './location-fm-code.pug'),
        import(/* webpackChunkName: "location-template" */ './location-fm-url.pug'),
        import(/* webpackChunkName: "location-template" */ './location-fm-campaign.pug'),
        import(/* webpackChunkName: "location-template" */ './location-fm-ap.pug'),
        import(/* webpackChunkName: "location-template" */ './ap-fm.pug'),
        import(/* webpackChunkName: "location-template" */ './location-move.pug'),
        import(/* webpackChunkName: "location-template" */ './location-fm-import.pug'),
      ]).spread((template, fmTemplate, fmCodeTemplate, fmUrlTemplate, fmCampaignTemplate, fmApTemplate, apFmTemplate, moveTemplate, fmImport) => {
        $templateCache.put('location/location-fm', fmTemplate);
        $templateCache.put('location/location-fm-code', fmCodeTemplate);
        $templateCache.put('location/location-fm-url', fmUrlTemplate);
        $templateCache.put('location/location-fm-campaign', fmCampaignTemplate);
        $templateCache.put('location/location-fm-ap', fmApTemplate);
        $templateCache.put('location/ap-fm', apFmTemplate);
        $templateCache.put('location/location-move', moveTemplate);        
        $templateCache.put('location/location-fm-import', fmImport);
        return template;
      }),
      params: { guidance: false, created: moment().valueOf() },
      controller: 'LocationCtrl as vm',
      resolve: {
        loadCtrl: $ocLazyLoad => Promise
          .all([
            import('../../extensions/init/ag-grid'),
            import('../../extensions/directives/dragula'),
            import('../../extensions/directives/select2'),
            import(/* webpackChunkName: "location" */ './location.controller'),
          ])
          .spread((agGrid, dragula, select2, module) => {
            $ocLazyLoad.load({ name: module.name });
            return module.controller;
          }),
        locations: (Location, User, currentUser) => {
          let query = {};
          if (currentUser.profileName === 'admin') {
            return User.find().$promise
              .then((users) => Location.find({ filter: { where: { "createdBy": { "inq": users.map(usr => usr.id).concat(currentUser.id) } } } }).$promise)
          } else {
            if (currentUser.profileName !== 'superadmin') {
              query = { where: { "createdBy": currentUser.id } };
            }
            return Location.find({ filter: query }).$promise
          }
        },
        locationGroups: (SelectOption, User, currentUser) => {
          let query = { where: { type: 'location_category' } };
          if (currentUser.profileName === 'admin') {
            return User.find().$promise
              .then((users) => SelectOption.find({
                filter: {
                  where: Object.assign({}, query.where, { "createdBy": { inq: users.map(usr => usr.id).concat(currentUser.id) } })
                }
              }).$promise)
          } else {
            if (currentUser.profileName !== 'superadmin') {
              query.where = Object.assign({}, query.where, { "createdBy": currentUser.id });
            }
            return SelectOption.find({ filter: query }).$promise
          }
        },
        campaigns: (currentUser, User, Campaign) => {
          let query = {};
          if (currentUser.profileName === 'admin') {
            return User.find().$promise
              .then((users) => Campaign.find({ filter: { where: { "createdBy": { "inq": users.map(usr => usr.id).concat(currentUser.id) } } } }).$promise)
          } else {
            if (currentUser.profileName !== 'superadmin') {
              query = { where: { "createdBy": currentUser.id } };
            }
            return Campaign.find({ filter: query }).$promise
          }
        },
        currentUser: AuthResolver => AuthResolver.getCurrentUser(),
      },
    });
}

export default angular
  .module('app.location.routing', [])
  .config(routes);
