class ValidatorDate {
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
          if (attrs.dateBefore) {
            result.dateBefore = this.$parse(attrs.dateBefore)(scope);
          }
          if (attrs.dateAfter) {
            result.dateAfter = this.$parse(attrs.dateAfter)(scope);
          }
          return result;
        };

        const validate = (value = ngModel.$modelValue) => {
          const { dateBefore, dateAfter } = getValidateData();
          if (value) {
            if (dateBefore) {
              ngModel.$setValidity('dateBefore', moment(value).isBefore(moment(dateBefore)));
            } else {
              ngModel.$setValidity('dateBefore', true);
            }
            if (dateAfter) {
              ngModel.$setValidity('dateAfter', moment(value).isAfter(moment(dateAfter)));
            } else {
              ngModel.$setValidity('dateAfter', true);
            }
          } else {
            ngModel.$setValidity('dateBefore', true);
            ngModel.$setValidity('dateAfter', true);
          }
          return value;
        };

        if (attrs.dateBefore) {
          scope.$watch(attrs.dateBefore, () => validate());
        }
        if (attrs.dateAfter) {
          scope.$watch(attrs.dateAfter, () => validate());
        }

        // //For DOM -> model validation
        ngModel.$validators.date = validate;

        // //For model -> DOM validation
        // ngModel.$formatters.unshift(validate);
      });
  }

  static factory($parse) {
    'ngInject';

    ValidatorDate.instance = new ValidatorDate($parse);
    return ValidatorDate.instance;
  }
}

export default angular
  .module('app.directive.validator-date', [])
  .directive('validatorDate', ValidatorDate.factory);
