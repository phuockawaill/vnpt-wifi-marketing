import angular from 'angular';

function routes($stateProvider) {
  'ngInject';

  $stateProvider
    .state('register.register-user', {
      url: '/register-user',
      template: require('./register.pug'),
      controller: 'RegisterCtrl as vm',
      resolve: {
        loadCtrl: $ocLazyLoad => Promise
          .all([
            import('../../extensions/directives/select2'),
            import('./register.controller'),
          ])
          .spread((select2, module) => {
            $ocLazyLoad.load({ name: module.name });
            return module.controller;
          }),
        cities: (SelectOption) => {
          let query = { where: { type: 'city' }, fields: { text: 1, value: 1, id: 1, options: 1 } };
          return SelectOption.getCommon({ filter: query }).$promise
            .then(response => {
              if (response && response.data) {
                return response.data;
              }
              return [];
            }).catch(error => error);
        },
        venuetypes: (User) => {
          return User.venueTypes().$promise
            .then(response => {
              if (response && response.data) {
                return response.data;
              }
              return [];
            }).catch(error => error);
        },
        registerType: () => 'publisher'
      }
    })
    .state('register.register-trial', {
      url: '/register-trial',
      template: require('./register.pug'),
      controller: 'RegisterCtrl as vm',
      resolve: {
        loadCtrl: $ocLazyLoad => Promise
          .all([
            import('../../extensions/directives/select2'),
            import('./register.controller'),
          ])
          .spread((select2, module) => {
            $ocLazyLoad.load({ name: module.name });
            return module.controller;
          }),
        cities: (SelectOption) => {
          let query = { where: { type: 'city' }, fields: { text: 1, value: 1, id: 1, options: 1 } };
          return SelectOption.getCommon({ filter: query }).$promise
            .then(response => {
              if (response && response.data) {
                return response.data;
              }
              return [];
            }).catch(error => error);
        },
        venuetypes: (User) => {
          return User.venueTypes().$promise
            .then(response => {
              if (response && response.data) {
                return response.data;
              }
              return [];
            }).catch(error => error);
        },
        registerType: () => 'client'
      }
    });
}

export default angular
  .module('app.register.routing', [])
  .config(routes);