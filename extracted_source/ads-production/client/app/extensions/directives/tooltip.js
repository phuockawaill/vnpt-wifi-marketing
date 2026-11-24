class Tooltip {
  constructor() {
    this.restrict = 'A';
  }

  link(scope, el, attrs) {
    $(el).tooltip({ container: 'body', title: attrs.title });
  }

  static factory() {
    'ngInject';

    Tooltip.instance = new Tooltip();
    return Tooltip.instance;
  }
}

export default angular
  .module('app.directive.tooltip', [])
  .directive('tooltip', Tooltip.factory);
