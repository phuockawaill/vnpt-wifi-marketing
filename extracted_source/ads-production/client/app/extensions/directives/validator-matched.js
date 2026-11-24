class ValidatorMatched {
  constructor($timeout) {
    this.$timeout = $timeout;

    this.restrict = 'A';
    this.require = '^form';
  }

  link(scope, el, attrs, formCtrl) {
    const inputName = attrs.name;
    const matchName = attrs.matched;
    if (!formCtrl[matchName]) {
      throw new Error(`Not found any input with name ${matchName}`);
    }

    const formEl = el.closest('form');
    const matchEl = formEl[0].querySelector(`[name="${matchName}"]`);
    const matchNgEl = angular.element(matchEl);

    const ngModel = formCtrl[inputName];
    const validate = (value) => {
      if (value) {
        ngModel.$setValidity('matched', value === matchNgEl.val());
      } else {
        ngModel.$setValidity('matched', true);
      }
      return value;
    };

    el.add(matchNgEl).on('keyup', () => {
      this.$timeout(() => {
        validate(ngModel.$modelValue);
      });
    });

    // //For DOM -> model validation
    ngModel.$parsers.unshift(validate);

    // //For model -> DOM validation
    ngModel.$formatters.unshift(validate);
  }

  static factory($timeout) {
    'ngInject';

    ValidatorMatched.instance = new ValidatorMatched($timeout);
    return ValidatorMatched.instance;
  }
}

export default angular
  .module('app.directive.validator-matched', [])
  .directive('matched', ValidatorMatched.factory);
