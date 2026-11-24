import angular from 'angular';

function routes($stateProvider) {
  'ngInject';

  $stateProvider
    .state('register.forgot-pass', {
      url: '/forgot-pass',
      template: require('./forgot-pass.pug'),
      controller: 'ForgotPassCtrl as vm',
      resolve: {
        loadCtrl: $ocLazyLoad => Promise
          .all([
            import('./forgot-pass.controller'),
          ])
          .spread((module) => {
            $ocLazyLoad.load({ name: module.name });
            return module.controller;
          })
      }
    });
}

export default angular
  .module('app.forgot-pass.routing', [])
  .config(routes);