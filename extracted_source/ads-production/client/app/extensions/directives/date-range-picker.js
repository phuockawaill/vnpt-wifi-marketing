import DateRange from 'bootstrap-daterangepicker';
import 'assets/styles/custom/daterange.less';

class DatePicker {
  constructor(mode = 'single', $timeout) {
    this.mode = mode;
    this.$timeout = $timeout;

    this.restrict = 'AE';
    if (mode === 'single') {
      this.scope = {
        datePicker: '=?',
        dateChanged: '=?',
      };
      this.require = 'ngModel';
    } else {
      this.scope = {
        dateRangePicker: '=?',
        dateChanged: '=?',
        dateFrom: '=?',
        dateTo: '=?',
        dateFromTo: '=?',
        langPick: '=?',
        pickRange: '=?'
      };
    }
  }

  link(scope, ele, attrs, ngModel) {
    ele = $(ele);
    ele.prop('readonly', true);

    return import('moment').then((moment) => {
      const _sToDay = () => moment().startOf('day');
      const _eToDay = () => moment().endOf('day');

      const sToDay = _sToDay();
      const eToDay = _eToDay();
      this.defaultOptions = {
        autoApply: false,
        linkedCalendars: false,
        opens: 'right',
        locale: { format: 'MMM DD, YYYY HH:mm' },
        showDropdowns: true,
      };

      if (this.mode === 'single') {
        Object.assign(this.defaultOptions, {
          singleDatePicker: true,
          // timePicker: true,
          timePicker24Hour: true,
          timePickerSeconds: false,
          autoUpdateInput: false,
          locale: { format: 'MMM DD, YYYY HH:mm' },
        });
      } else {
        if (scope.pickRange) {
          Object.assign(this.defaultOptions, {
            autoApply: true,
            ranges: scope.langPick === 'VN' ?
            {
              '30 ngày gần nhất': [_sToDay().subtract(29, 'days'), eToDay],
              'Tháng này': [
                _sToDay().startOf('month'),
                _eToDay().endOf('month')
              ],
              'Tháng trước': [
                _sToDay().subtract(1, 'month').startOf('month'),
                _eToDay().subtract(1, 'month').endOf('month')
              ],
              '3 tháng gần nhất': [
                _sToDay().subtract(3, 'month').startOf('month'),
                _eToDay().endOf('month')
              ]
            }
            :
            {
              'Last 30 Days': [_sToDay().subtract(29, 'days'), eToDay],
              'This Month': [
                _sToDay().startOf('month'),
                _eToDay().endOf('month')
              ],
              'Last Month': [
                _sToDay().subtract(1, 'month').startOf('month'),
                _eToDay().subtract(1, 'month').endOf('month')
              ],
              'Last 3 Months': [
                _sToDay().subtract(3, 'month').startOf('month'),
                _eToDay().endOf('month')
              ]
            },
            locale: {
              format: scope.langPick === 'VN' ? 'DD/MM/YYYY' : 'MMM DD, YYYY',
              customRangeLabel: scope.langPick === 'VN' ? 'Tuỳ chỉnh' : 'Custom Range'
            }
          });
        } else {
          Object.assign(this.defaultOptions, {
            autoApply: true,
            ranges: scope.langPick === 'VN' ?
            {
              'Hôm nay': [sToDay, eToDay],
              'Hôm qua': [
                _sToDay().subtract(1, 'days'),
                _eToDay().subtract(1, 'days')
              ],
              '7 ngày gần nhất': [_sToDay().subtract(6, 'days'), eToDay],
              '14 ngày gần nhất': [_sToDay().subtract(13, 'days'), eToDay],
              '30 ngày gần nhất': [_sToDay().subtract(29, 'days'), eToDay],
              'Tháng này': [
                _sToDay().startOf('month'),
                _eToDay().endOf('month')
              ],
              'Tháng trước': [
                _sToDay().subtract(1, 'month').startOf('month'),
                _eToDay().subtract(1, 'month').endOf('month')
              ],
              '3 tháng gần nhất': [
                _sToDay().subtract(3, 'month').startOf('month'),
                _eToDay().endOf('month')
              ]
            }
            :
            {
              Today: [sToDay, eToDay],
              Yesterday: [
                _sToDay().subtract(1, 'days'),
                _eToDay().subtract(1, 'days')
              ],
              'Last 7 Days': [_sToDay().subtract(6, 'days'), eToDay],
              'Last 14 Days': [_sToDay().subtract(13, 'days'), eToDay],
              'Last 30 Days': [_sToDay().subtract(29, 'days'), eToDay],
              'This Month': [
                _sToDay().startOf('month'),
                _eToDay().endOf('month')
              ],
              'Last Month': [
                _sToDay().subtract(1, 'month').startOf('month'),
                _eToDay().subtract(1, 'month').endOf('month')
              ],
              'Last 3 Months': [
                _sToDay().subtract(3, 'month').startOf('month'),
                _eToDay().endOf('month')
              ]
            },
            locale: {
              format: scope.langPick === 'VN' ? 'DD/MM/YYYY' : 'MMM DD, YYYY',
              customRangeLabel: scope.langPick === 'VN' ? 'Tuỳ chỉnh' : 'Custom Range'
            }
          });
        }
      }

      // let picker;
      const options = { ...this.defaultOptions, ...scope.dateRangePicker };
      if (ngModel && ngModel.$modelValue) {
        options.startDate = ngModel.$modelValue;
      }
      if (scope.dateFrom) {
        options.startDate = scope.dateFrom;
      }
      if (scope.dateTo) {
        options.endDate = scope.dateTo;
      }

      const onApply = (start, end) => {
        this.$timeout(() => {
          if (ngModel) {
            ngModel.$setViewValue(start.format(options.locale.format));
            ngModel.$setDirty(false);
            ngModel.$render();
          } else {
            scope.dateFrom = start.toISOString();
            scope.dateTo = end.toISOString();
            scope.dateFromTo = [scope.dateFrom, scope.dateTo];
          }
        });
      };
      const picker = new DateRange(ele, options, onApply);
      picker.element.on('apply.daterangepicker', () => {
        if (typeof scope.dateChanged === 'function') {
          this.$timeout(scope.dateChanged, 0);
        }
      });

      const resetDay = () => {
        picker.setStartDate(sToDay);
        picker.setEndDate(sToDay);
        onApply(sToDay, sToDay);
      };

      if (ngModel) {
        ngModel.$parsers.unshift(
          value =>
            value && moment(value, options.locale.format).toISOString(),
        );
        ngModel.$formatters.unshift((value) => {
          if (value) {
            const mValue = moment(value);
            picker.setStartDate(mValue);
            return mValue.format(options.locale.format);
          }
          return resetDay();
        });

        this.$timeout(resetDay);
      } else if (scope.dateFrom || scope.dateTo) {
        if (scope.dateFrom) picker.setStartDate(moment(scope.dateFrom));
        if (scope.dateTo) picker.setEndDate(moment(scope.dateTo));
      } else {
        // this.$timeout(resetDay);
      }
    });
  }

  static factory($timeout) {
    'ngInject';

    DatePicker.instance = new DatePicker('single', $timeout);
    return DatePicker.instance;
  }
}

class DateRangePicker extends DatePicker {
  constructor($timeout) {
    super('range', $timeout);
  }

  static factory($timeout) {
    'ngInject';

    DateRangePicker.instance = new DateRangePicker($timeout);
    return DateRangePicker.instance;
  }
}

export default angular
  .module('app.directive.dateRangePicker', [])
  .directive('datePicker', DatePicker.factory)
  .directive('dateRangePicker', DateRangePicker.factory);
