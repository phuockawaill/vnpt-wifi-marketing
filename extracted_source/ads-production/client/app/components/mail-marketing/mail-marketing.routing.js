import angular from 'angular';

function routes($stateProvider) {
  'ngInject';

  $stateProvider
    .state('admin.mailMarketing', {
      url: '/mail-marketing',
      templateProvider: $templateCache => Promise.all([
        import(/* webpackChunkName: "mail-marketing-template" */ './mail-marketing.pug'),
      ]).spread((template) => {
        return template;
      }),
      params: {},
      controller: 'MailMarketingCtrl as vm',
      resolve: {
        loadCtrl: $ocLazyLoad => Promise
          .all([
            import(/* webpackChunkName: "mail-marketing" */ './mail-marketing.controller'),
          ])
          .spread((module) => {
            $ocLazyLoad.load({ name: module.name });
            return module.controller;
          }),
        currentUser: AuthResolver => AuthResolver.getCurrentUser(),
      },
    });
}

export default angular
  .module('app.mail-marketing.routing', [])
  .config(routes);

