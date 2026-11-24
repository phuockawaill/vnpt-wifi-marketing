/* eslint class-methods-use-this: 1 */
/* eslint-env es6 */

class ContentLoading {
  constructor($templateCache) {
    this.$templateCache = $templateCache;

    this.restrict = 'A';
    this.scope = {
      showLoading: '=contentLoading',
    };
  }

  compile(el) {
    const ngEl = angular.element(el);

    const template = this.$templateCache.get('template/content-loading.template.jade');
    ngEl.append(template);

    return this.link.bind(this);
  }

  link(scope) {
    scope.$watch(scope.showLoading, (newVal) => {
      console.log('show loading', newVal);
    });
  }

  static factory($templateCache) {
    'ngInject';

    ContentLoading.instance = new ContentLoading($templateCache);
    return ContentLoading.instance;
  }
}

export default angular
  .module('app.directive.content-loading', [])
  .directive('contentLoading', ContentLoading.factory);
