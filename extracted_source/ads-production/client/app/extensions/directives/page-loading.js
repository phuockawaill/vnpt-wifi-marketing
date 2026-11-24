class PageLoading {
  constructor($rootScope) {
    this.$rootScope = $rootScope;

    this.restrict = 'AE';
    this.template = `<div ng-show='visible' class='progress-wrapper'><div class='loading-progress'><div class='indeterminate'>${''}</div></div></div>`;
  }

  link(scope) {
    const showLoading = () => {
      scope.visible = true;
    };
    const hideLoading = () => {
      scope.visible = false;
    };

    scope.visible = false;
    this.$rootScope.$on('$stateChangeStart', showLoading);
    this.$rootScope.$on('$stateNotFound', hideLoading);
    this.$rootScope.$on('$viewContentLoaded', hideLoading);
  }

  static factory($rootScope) {
    'ngInject';

    PageLoading.instance = new PageLoading($rootScope);
    return PageLoading.instance;
  }
}

export default angular
  .module('app.directive.page-loading', [])
  .directive('pageLoading', PageLoading.factory);
