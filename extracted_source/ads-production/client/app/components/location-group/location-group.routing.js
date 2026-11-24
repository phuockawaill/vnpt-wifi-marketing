import angular from 'angular';
import moment from 'moment';

function routes($stateProvider) {
  'ngInject';

  $stateProvider
    .state('admin.location-group', {
      url: '/location-group',
      templateProvider: $templateCache => Promise.all([
        import(/* webpackChunkName: "location-group-template" */ './location-group-fm.pug'),
        import(/* webpackChunkName: "location-group-template" */ './locations-for-group-fm.pug'),
        import(/* webpackChunkName: "location-group-template" */ './location-group-fm-url.pug'),
        import(/* webpackChunkName: "location-group-template" */ './location-group.pug'),
      ]).spread((fmTemplate, fmLocationTemplate, fmUrlTemplate, template) => {
        $templateCache.put('location-group/location-group-fm', fmTemplate);
        $templateCache.put('location-group/locations-for-group-fm', fmLocationTemplate);
        $templateCache.put('location-group/location-group-fm-url', fmUrlTemplate);
        return template;
      }),
      params: { quickLocationGroup: false, created: moment().valueOf(), quickLocationGroupObj: {}, guidance: false, endedguidance: false },
      controller: 'LocationGroupCtrl as vm',
      resolve: {
        loadCtrl: $ocLazyLoad => Promise
          .all([
            import('../../extensions/init/ag-grid'),
            import('../../extensions/directives/select2'),
            import(/* webpackChunkName: "location-group" */ './location-group.controller'),
          ])
          .spread((agGrid, select2, module) => {
            $ocLazyLoad.load({ name: module.name });
            return module.controller;
          }),
        locations: function (Location, User, currentUser) {
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
        currentUser: AuthResolver => AuthResolver.getCurrentUser(),
      },
    });
}

export default angular
  .module('app.location-group.routing', [])
  .config(routes);
