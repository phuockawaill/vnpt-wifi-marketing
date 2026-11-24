/* global WebuiPopovers:true */
require('webui-popover/dist/jquery.webui-popover.js');
require('webui-popover/dist/jquery.webui-popover.css');

class Popover {
  constructor() {
    this.defaultOptions = {
      placement: 'auto',
      container: 'body',
      trigger: 'click',
      delay: {
        show: null,
        hide: null,
      },
    };
    this.scope = {
      popover: '=?',
    };
  }

  link(scope, element) {
    const ele = element[0];
    const options = angular.extend({}, this.defaultOptions, scope.popover);
    WebuiPopovers.create(ele, options);

    scope.$watch('popover.content', (content) => {
      WebuiPopovers.updateContent(ele, content);
    });
  }

  static factory() {
    Popover.instance = new Popover();
    return Popover.instance;
  }
}

export default angular
  .module('app.directive.popover', [])
  .directive('popover', Popover.factory);
