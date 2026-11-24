/* eslint class-methods-use-this: 1 */
/* eslint-env es6 */

import './validator.less';

class Validator {
  constructor($parse, errorMessages, errorEnMessages, $rootScope) {
    this.$rootScope = $rootScope;
    this.$parse = $parse;
    this.errorMessages = errorMessages;
    this.errorEngMessages = errorEnMessages;

    this.restrict = 'A';
  }

  compile(el) {
    const formName = el.closest('form').attr('name') || el.attr('validator');
    if (!formName) {
      throw new Error('Validator require form name');
    }

    const inputEl = el[0].querySelector('[name]');
    const inputNgEl = angular.element(inputEl);
    let inputName = inputNgEl.attr('name');
    if (!inputName || inputName.indexOf('__input') === 0) {
      inputName = `__input${Math.round(Math.random() * 10e9)}`;
      inputNgEl.attr('name', inputName);
    }

    let labelContent = el.attr('data-label');
    if (!labelContent) {
      const labelEl = el[0].querySelector('label');
      const labelNgEl = angular.element(labelEl);
      labelContent = labelNgEl.text();
    }

    let nextEl = inputNgEl.closest('[data-message-holder]');
    if (!nextEl.length) {
      nextEl = inputNgEl;
    }

    const required = inputNgEl.attr('required') || inputNgEl.attr('ng-required');
    if (required) {
      nextEl.after(`<label class="validation-error-label required">${(this.$rootScope && this.$rootScope.isLang && this.$rootScope.isLang === 'VN') ? this.errorMessages.required.format(labelContent) : this.errorEngMessages.required.format(labelContent)}</label>`);
    }
    const min = inputNgEl.attr('min');
    if (min) {
      nextEl.after(`<label class="validation-error-label min">${(this.$rootScope && this.$rootScope.isLang && this.$rootScope.isLang === 'VN') ? this.errorMessages.min.format(labelContent, min) : this.errorEngMessages.min.format(labelContent, min)}</label>`);
    }
    const max = inputNgEl.attr('max');
    if (max) {
      nextEl.after(`<label class="validation-error-label max">${(this.$rootScope && this.$rootScope.isLang && this.$rootScope.isLang === 'VN') ? this.errorMessages.max.format(labelContent, max) : this.errorEngMessages.max.format(labelContent, max)}</label>`);
    }
    if (min || max) {
      nextEl.after(`<label class="validation-error-label number">${(this.$rootScope && this.$rootScope.isLang && this.$rootScope.isLang === 'VN') ? this.errorMessages.number.format(labelContent) : this.errorEngMessages.number.format(labelContent)}</label>`);
    }
    const minlength = inputNgEl.attr('ng-minlength');
    if (minlength) {
      nextEl.after(`<label class="validation-error-label minlength">${(this.$rootScope && this.$rootScope.isLang && this.$rootScope.isLang === 'VN') ? this.errorMessages.minlength.format(labelContent, minlength) : this.errorEngMessages.minlength.format(labelContent, minlength)}</label>`);
    }
    const maxlength = inputNgEl.attr('ng-maxlength');
    if (maxlength) {
      nextEl.after(`<label class="validation-error-label maxlength">${(this.$rootScope && this.$rootScope.isLang && this.$rootScope.isLang === 'VN') ? this.errorMessages.maxlength.format(labelContent, maxlength) : this.errorEngMessages.maxlength.format(labelContent, maxlength)}</label>`);
    }
    const inputType = inputNgEl.attr('type');
    if (inputType === 'email') {
      nextEl.after(`<label class="validation-error-label email">${(this.$rootScope && this.$rootScope.isLang && this.$rootScope.isLang === 'VN') ? this.errorMessages.email.format(labelContent) : this.errorEngMessages.email.format(labelContent)}</label>`);
    }
    if (inputType === 'url') {
      nextEl.after(`<label class="validation-error-label url">${(this.$rootScope && this.$rootScope.isLang && this.$rootScope.isLang === 'VN') ? this.errorMessages.url.format(labelContent) : this.errorEngMessages.url.format(labelContent)}</label>`);
    }
    const pattern = inputNgEl.attr('ng-pattern');
    if (pattern) {
      nextEl.after(`<label class="validation-error-label pattern">${(this.$rootScope && this.$rootScope.isLang && this.$rootScope.isLang === 'VN') ? this.errorMessages.pattern.format(labelContent) : this.errorEngMessages.pattern.format(labelContent)}</label>`);
    }
    const matched = inputNgEl.attr('matched') || inputNgEl.attr('data-matched');
    if (matched) {
      nextEl.after(`<label class="validation-error-label matched" >${labelContent} ${(this.$rootScope && this.$rootScope.isLang && this.$rootScope.isLang === 'VN') ? 'không phù hợp' : 'is not matched'}</label>`);
    }
    const date = inputNgEl.attr('validator-date');
    if (date) {
      if (inputNgEl.attr('date-before')) {
        nextEl.after(`<label class="validation-error-label dateBefore" >${this.errorMessages.dateBefore.format(labelContent, date)}</label>`);
      }
      if (inputNgEl.attr('date-after')) {
        nextEl.after(`<label class="validation-error-label dateAfter" >${this.errorMessages.dateAfter.format(labelContent, date)}</label>`);
      }
    }
    const time = inputNgEl.attr('validator-time');
    if (time) {
      if (inputNgEl.attr('time-before')) {
        nextEl.after(`<label class="validation-error-label timeBefore" >${this.errorMessages.timeBefore.format(labelContent, time)}</label>`);
      }
      if (inputNgEl.attr('time-after')) {
        nextEl.after(`<label class="validation-error-label timeAfter" >${this.errorMessages.timeAfter.format(labelContent, time)}</label>`);
      }
    }

    return this.link.bind(this);
  }

  link(scope, ele) {
    const inputEl = ele[0].querySelector('[name]');
    const inputNgEl = angular.element(inputEl);
    if (!inputEl) {
      throw new Error('Element has no child input elements with a \'name\' attribute');
    }
    const ngModel = inputNgEl.controller('ngModel');
    if (!ngModel) {
      throw new Error('ngModel is required');
    }

    const errors = ['required', 'min', 'max', 'minlength', 'maxlength', 'number', 'email', 'url', 'pattern', 'matched', 'dateBefore', 'dateAfter', 'timeBefore', 'timeAfter'];
    const toggleErrorClasses = () => {
      if (ngModel.$invalid && !ngModel.$pristine) {
        errors.forEach(error => ele.toggleClass(error, !!ngModel.$error[error]));
      } else if (ngModel.$pristine) {
        errors.forEach(error => ele.toggleClass(error, false));
      }
    };
    const toggleClasses = (invalid) => {
      ele.toggleClass('has-error', invalid);
      ele.toggleClass('has-success', !invalid);
    };
    scope.$watch(() => ngModel.$invalid, (invalid) => {
      toggleClasses(invalid, ngModel.$pristine);
      toggleErrorClasses();
    });
    scope.$watch(() => ngModel.$pristine, () => {
      // if (pristine) {
      //   ngModel.$modelValue = undefined;
      // }
      // toggleClasses(ngModel.$invalid, pristine);
      toggleErrorClasses();
    });
    scope.$watch(() => Object.keys(ngModel.$error).length, () => {
      toggleErrorClasses();
    });
  }

  static factory($parse, validator, $rootScope) {
    'ngInject';

    Validator.instance = new Validator($parse, validator.getErrorMessages(), validator.getErrorEnMessages(), $rootScope);
    return Validator.instance;
  }
}

function ValidatorProvider() {
  let errorMessages = {
    required: '{0} là điều kiện bắt buộc',
    min: '{0} phải lớn hơn hoặc bằng {1}',
    max: '{0} phải bé hơn hoặc bằng {1}',
    minlength: '{0} phải có tối thiểu {1} kí tự',
    maxlength: '{0} chỉ có thể có tối đa {1} kí tự',
    number: '{0} phải là một số hợp lệ',
    email: '{0} phải là địa chỉ email hợp lệ',
    url: '{0} phải là URL hợp lệ',
    pattern: '{0} không hợp lệ',
    matched: '{0} không phù hợp',
    dateBefore: '{0} must before {1}',
    dateAfter: '{0} must after {1}',
    timeBefore: '{0} must before {1}',
    timeAfter: '{0} must after {1}',
  };

  let errorEngMessages = {
    required: '{0} is required',
    min: '{0} must be greater than or equal {1}',
    max: '{0} must be less than or equal {1}',
    minlength: '{0} must has minimum of {1} characters',
    maxlength: '{0} can only has maximum of {1} characters',
    number: '{0} must be a valid number',
    email: '{0} must be a valid email address',
    url: '{0} must be a valid URL',
    pattern: '{0} is invalid',
    matched: '{0} is not matched',
    dateBefore: '{0} must before {1}',
    dateAfter: '{0} must after {1}',
    timeBefore: '{0} must before {1}',
    timeAfter: '{0} must after {1}',
  };

  this.setErrorEnMessages = (_errorMessages) => {
    if (_errorMessages && typeof _errorMessages === 'object') {
      errorEngMessages = angular.extend(errorEngMessages, _errorMessages);
    }
  };

  this.getErrorEnMessages = () => errorEngMessages;

  this.setErrorMessages = (_errorMessages) => {
    if (_errorMessages && typeof _errorMessages === 'object') {
      errorMessages = angular.extend(errorMessages, _errorMessages);
    }
  };

  this.getErrorMessages = () => errorMessages;

  this.$get = () => this;
}

export default angular
  .module('app.directive.validator', [])
  .provider('validator', ValidatorProvider)
  .directive('validator', Validator.factory);
