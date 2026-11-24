/* eslint class-methods-use-this: 1 */
/* eslint-env es6 */

class SelectPicker {
  constructor() {
    this.scope = {};
  }

  // Directive link function
  link(scope, element) {
    require.ensure([], () => {
      require('bootstrap-select');
      require('bootstrap-select/dist/css/bootstrap-select.css');

      const selectPicker = $(element).selectpicker();
      scope.$on('$destroy', () => {
        selectPicker.remove();
      });
    });
  }

  static factory() {
    SelectPicker.instance = new SelectPicker();
    return SelectPicker.instance;
  }
}

export default angular
  .module('app.directive.select-picker', [])
  .directive('selectPicker', SelectPicker.factory);
