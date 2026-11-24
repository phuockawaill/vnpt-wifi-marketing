import angular from 'angular';

class ChartConfig {
  constructor() {
    this.scope = {
      params: '=chartConfig',
    };
    this.template = require('./chart-config.pug');
  }

  link(scope) {
    scope.setChartType = (type) => {
      scope.params.type = type;
      scope.params.instance.update({
        chart: { type },
      });
    };
    scope.toggleChartPercentage = () => {
      const percentage              = !scope.params.percentage;
            scope.params.percentage = percentage;
      scope.params.instance.update({
        plotOptions: {
          column    : { stacking: percentage ? 'percent' : null },
          areaspline: { stacking: percentage ? 'percent' : null },
        },
      });
    };
  }

  static factory() {
    return new ChartConfig();
  }
}

export default angular
  .module('app.dashboard.chart-config', [])
  .directive('chartConfig', ChartConfig.factory);
