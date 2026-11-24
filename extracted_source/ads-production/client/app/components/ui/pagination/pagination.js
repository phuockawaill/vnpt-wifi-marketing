const pagerTemplate = require('./pager.pug');

class PaginationPager {
  constructor() {
    this.require = '^pagination';
    this.template = pagerTemplate;
  }

  link(scope, ele, attrs, ctrl) {
    console.log('link child');
    scope.totalPages = ctrl.getTotalPages();

    scope.currentPage = ctrl.getCurrentPage();
    scope.previousPage = scope.currentPage - 1;
    if (scope.previousPage < 1) {
      scope.previousPage = false;
    }
    scope.nextPage = scope.currentPage + 1;
    if (scope.nextPage > scope.totalPages) {
      scope.nextPage = false;
    }
  }

  static factory() {
    return new PaginationPager();
  }
}

class Pagination {
  constructor() {
    const self = this;
    this.scope = {
      options: '=pagination',
    };
    this.controller = function controllerFn() {
      console.log('init controller');
      const options = Object.assign({
        pageSizes: [20, 50, 100],
        currentPageSize: 20,
        totalPages: 0,
        currentPage: 0,
      }, self.options);

      if (options.totalPages && !options.currentPage) {
        options.currentPage = 1;
      }
      console.log(options);

      this.getPageSizes = () => options.pageSizes;
      this.getCurrentPageSize = () => options.currentPageSize;
      this.getTotalPages = () => options.totalPages;
      this.getCurrentPage = () => options.currentPage;
    };
    this.controllerAs = 'pag';
  }

  link(scope) {
    console.log('link');
    this.options = scope.options;
    // console.log(scope.options);
  }

  static factory() {
    return new Pagination();
  }
}

export default angular
  .module('app.directive.pagination', [])
  .directive('paginationPager', PaginationPager.factory)
  .directive('pagination', Pagination.factory);
