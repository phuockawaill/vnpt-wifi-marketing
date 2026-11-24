/**
 * Created by HocSoiCa on 9/14/2016.
 */
class CountTo {
  constructor($interval) {
    this.$interval = $interval;

    this.scope = {
      options: '=countTo', currentValue: '=countToValue'
    };

    this.defaultOptions = {
      from: 0,               // the number the element should start at
      speed: 2000,           // how long it should take to count between the target numbers
      refreshInterval: 50,  // how often the element should be updated
      decimals: 0,           // the number of decimal places to show
    };
  }

  link(scope, el, attrs) {
    if (!attrs.type) {
      attrs.type = '';
    }
    scope.$watch('currentValue', (newValue) => {
      if (newValue !== undefined) {
        const options = angular.extend({}, this.defaultOptions, scope.options);
        options.to = newValue;

        let value = options.from;
        const loops = Math.ceil(options.speed / options.refreshInterval);
        let loopCount = 0;
        const increment = (options.to - options.from) / loops;

        const interval = this.$interval(() => {
          value += increment;
          loopCount++;
          if (loopCount >= loops) {
            this.$interval.cancel(interval);
            value = options.to;
          }
          const formatedValue = Number(value).toFixed(options.decimals).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          el[0].innerHTML = formatedValue + attrs.type;
        }, options.refreshInterval);
      } else {
        el[0].innerHTML = `0${attrs.type}`;
      }
    });
  }

  static factory($interval) {
    'ngInject';

    CountTo.instance = new CountTo($interval);
    return CountTo.instance;
  }
}

export default angular
  .module('app.directive.countTo', [])
  .directive('countTo', CountTo.factory);
