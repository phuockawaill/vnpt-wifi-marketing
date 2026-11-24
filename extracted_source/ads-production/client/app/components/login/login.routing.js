function routes($stateProvider) {
  'ngInject';

  $stateProvider
    .state('login', {
      url: '/login',
      template: require('./login.pug'),
      controller: 'LoginCtrl as vm',
    });
}

export default angular
  .module('app.login.routing', [
    require('./login.controller').name,
  ])
  .config(routes);
