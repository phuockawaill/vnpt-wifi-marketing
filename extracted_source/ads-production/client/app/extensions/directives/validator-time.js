class ValidatorTime {
  constructor($parse) {
    this.$parse = $parse;

    this.restrict = 'A';
    this.require = 'ngModel';
  }

  link(scope, el, attrs, ngModel) {
    import('moment')
      .then((moment) => {
        const getValidateData = () => {
          const result = {};
          if (attrs.timeBefore) {
            result.timeBefore = this.$parse(attrs.timeBefore)(scope);
          }
          if (attrs.timeAfter) {
            result.timeAfter = this.$parse(attrs.timeAfter)(scope);
          }
          return result;
        };

        const validate = (value = ngModel.$modelValue) => {
          const { timeBefore, timeAfter } = getValidateData();
          if (value) {
            if (timeBefore) {
              ngModel.$setValidity('timeBefore', moment(value).isBefore(moment(timeBefore)));
            } else {
              ngModel.$setValidity('timeBefore', true);
            }
            if (timeAfter) {
              ngModel.$setValidity('timeAfter', moment(value).isAfter(moment(timeAfter)));
            } else {
              ngModel.$setValidity('timeAfter', true);
            }
          } else {
            ngModel.$setValidity('timeBefore', true);
            ngModel.$setValidity('timeAfter', true);
          }
          return value;
        };

        if (attrs.timeBefore) {
          scope.$watch(attrs.timeBefore, () => validate());
        }
        if (attrs.timeAfter) {
          scope.$watch(attrs.timeAfter, () => validate());
        }

        // //For DOM -> model validation
        ngModel.$validators.date = validate;

        // //For model -> DOM validation
        // ngModel.$formatters.unshift(validate);
      });
  }

  static factory($parse) {
    'ngInject';

    ValidatorTime.instance = new ValidatorTime($parse);
    return ValidatorTime.instance;
  }
}

export default angular
  .module('app.directive.validator-time', [])
  .directive('validatorTime', ValidatorTime.factory);
