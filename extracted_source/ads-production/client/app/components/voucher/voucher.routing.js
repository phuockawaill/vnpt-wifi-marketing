import angular from 'angular';

function routes($stateProvider) {
  'ngInject';
  $stateProvider
    .state('admin.voucher', {
      url: '/voucher',
      templateProvider: $templateCache => Promise.all([
          import(/* webpackChunkName: "location-group-template" */ './voucher-fm.pug'),
          import(/* webpackChunkName: "location-group-template" */ './voucher-detail.pug'),
          import(/* webpackChunkName: "voucher" */ './voucher.pug'),
    ]).spread((fmTemplate, detailTemplate, template) => {
        $templateCache.put('voucher/voucher-fm', fmTemplate);
        $templateCache.put('voucher/voucher-detail', detailTemplate);
        return template;
      }),
      controller: 'VoucherCtrl as vm',
      resolve: {
        loadCtrl: $ocLazyLoad => Promise
          .all([
              import('./voucher.controller'),
              import('../../extensions/init/ag-grid'),
              import('../../extensions/directives/select2'),
              import('../../extensions/directives/date-range-picker'),
              import('../../extensions/directives/highchart/index'),
          ])
          .spread((module) => {
            $ocLazyLoad.load({ name: module.name });
            return module.controller;
          }),
        locations: (Location) => Location.find().$promise,
        vouchers: (Voucher, currentUser) => {
            let query = {};
            if(currentUser.profileName !== 'superadmin'){
                query = {where: {"createdBy": currentUser.id, order: 'createdAt DESC'}};
            }
            return Voucher.find({filter: query}).$promise;
        },
        currentUser: AuthResolver => AuthResolver.getCurrentUser()
      }
    });
}

export default angular
  .module('app.voucher.routing', [])
  .config(routes);
