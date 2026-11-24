import angular from 'angular';
import bsn from 'bootstrap.native';

class Modal {
  constructor() {
    this.scope = {
      options: '=?modal',
    };
    this.restrict = 'A';
  }

  link(scope, ele) {
    const instance = new bsn.Modal(ele[0], scope.options);
    if (typeof scope.options.onInitialized === 'function') {
      scope.options.onInitialized(instance);
    }
  }

  static factory() {
    'ngInject';

    return new Modal();
  }
}

export default angular
  .module('app.directive.bootstrap.modal', [])
  .directive('modal', Modal.factory);
