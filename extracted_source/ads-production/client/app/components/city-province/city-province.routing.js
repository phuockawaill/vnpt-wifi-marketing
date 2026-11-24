import angular from 'angular';

function routes($stateProvider) {
  'ngInject';

  $stateProvider
    .state('admin.city-province', {
      url: '/city-province',
      templateProvider: $templateCache => Promise.all([
        import(/* webpackChunkName: "city-province-template" */ './city-province.pug'),
        import(/* webpackChunkName: "city-province-template" */ './city-province-fm.pug'),
        import(/* webpackChunkName: "city-province-template" */ './city-province-fm-action.pug'),
      ]).spread((template, fmTemplate, fmActionTemplate) => {
        $templateCache.put('city-province/city-province-fm', fmTemplate);
        $templateCache.put('city-province/city-province-fm-action', fmActionTemplate);
        return template;
      }),
      controller: 'CityProvinceCtrl as vm',
      resolve: {
        loadCtrl: $ocLazyLoad => Promise
          .all([
            import('../../extensions/init/ag-grid'),
            import('../../extensions/directives/select2'),
            import(/* webpackChunkName: "city-province" */ './city-province.controller'),
          ])
          .spread((agGrid, select2, module) => {
            $ocLazyLoad.load({ name: module.name });
            return module.controller;
          }),
        cities: (SelectOption) => {
          let query = { where: { type: 'city' } };
          return SelectOption.find({ filter: query }).$promise
        },
        currentUser: AuthResolver => AuthResolver.getCurrentUser(),
      },
    });
}

export default angular
  .module('app.city-province.routing', [])
  .config(routes);
