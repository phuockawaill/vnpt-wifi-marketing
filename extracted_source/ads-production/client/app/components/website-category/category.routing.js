import angular from 'angular';

function routes($stateProvider) {
  'ngInject';

  $stateProvider
    .state('admin.websiteCategory', {
      url: '/website-category',
      templateProvider: $templateCache => Promise.all([
        import(/* webpackChunkName: "category-template" */ './category-fm.pug'),
        import(/* webpackChunkName: "category-template" */ './category.pug'),
    ]).spread((fmTemplate, template) => {
        $templateCache.put('website-category/category-fm', fmTemplate);
        return template;
      }),
      controller: 'CategoryCtrl as vm',
      resolve: {
        loadCtrl: $ocLazyLoad => Promise
          .all([
            import('../../extensions/init/ag-grid'),
            import(/* webpackChunkName: "category" */ './category.controller'),
          ])
          .spread((agGrid, module) => {
            $ocLazyLoad.load({ name: module.name });
            return module.controller;
          }),
        categories: (SelectOption, currentUser) => {
            let query = { where: { type: 'website_category' }};
            // if(currentUser.profileName !== 'superadmin'){
            //     query.where = Object.assign({}, query.where, {"createdBy": currentUser.id});
            // }
            return SelectOption.find({ filter: query }).$promise;
        },
        currentUser: AuthResolver => AuthResolver.getCurrentUser(),
      },
    });
}

export default angular
  .module('app.website-category.routing', [])
  .config(routes);
