import extend from 'lodash/extend';
import dragula from 'dragula';
// import 'dragula/dist/dragula.css';

class Dragula {
  constructor($timeout) {
    this.$timeout = $timeout;
    this.scope = {
      options: '=?dragula',
    };
  }

  link(scope, ele) {
    this.defaultOptions = {
      revertOnSpill: true,
    };

    const options = extend({ }, this.defaultOptions, scope.options);
    const drake = dragula(options);
    drake.containers.push(ele[0]);

    if (typeof options.onDrop === 'function') {
      drake.on('drop', options.onDrop);
    }
  }

  static factory($timeout) {
    'ngInject';

    return new Dragula($timeout);
  }
}

export default angular
  .module('app.directive.dragula', [])
  .directive('dragula', Dragula.factory);
