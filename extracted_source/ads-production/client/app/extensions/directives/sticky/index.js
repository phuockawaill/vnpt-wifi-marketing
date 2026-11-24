/* global Stickyfill */

import Stickyfill from 'stickyfilljs';
import './sticky.less';

class Sticky {
  constructor() {
    this.restrict = 'AC';
  }

  link(scope, ngEle) {
    const ele = ngEle[0];
    ele.classList.add('sticky');

    Stickyfill.add(ele);
  }

  static factory() {
    Sticky.instance = new Sticky();
    return Sticky.instance;
  }
}

export default angular
  .module('app.directive.sticky', [])
  .directive('sticky', Sticky.factory);
