export default angular
  .module('app.routing', [
    require('./components/login/login.routing').name,
    require('./components/register/register.routing').name,
    require('./components/forgot-pass/forgot-pass.routing').name,
    require('./components/monetize-out/monetize-out.routing').name,
    require('./components/dashboard/dashboard.routing').name,
    require('./components/crm/crm.routing').name,
    require('./components/usage/usage.routing').name,
    require('./components/account/account.routing').name,
    require('./components/banner/banner.routing').name,
    require('./components/location/location.routing').name,
    require('./components/location-group/location-group.routing').name,
    require('./components/campaign/campaign.routing').name,
    require('./components/license/license.routing').name,
    require('./components/voucher/voucher.routing').name,
    require('./components/website-category/category.routing').name,
    require('./components/city-province/city-province.routing').name,
    require('./components/mail-marketing/mail-marketing.routing').name,
  ])
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider
      .state('report', {
        name: 'report',
        url: '/report',
        abstract: true,
        template: '<ui-view></ui-view>',
      })
      .state('admin', {
        url: '/admin',
        abstract: true,
        template: '<ui-view></ui-view>',
      })
      .state('register', {
        url: '/register',
        abstract: true,
        template: '<ui-view></ui-view>',
      });
  });

