import _merge from 'lodash/merge';
import _get from 'lodash/get';
import _sum from 'lodash/sum';
import _forEach from 'lodash/forEach';

import angular from 'angular';
import HighCharts from 'highcharts';
import noData from './no-data-to-display';

noData(HighCharts);

const defaultChartColors = [
  '#70A532',
  '#FBC02D',
  '#E98F2E',
  '#715146',
  '#3583CA',
  '#37A9B7',
  '#178D81',
  '#279566',
  '#D6494B',
  '#E53B75',
  '#6D45BC',
  '#465BD4',
  '#BAD896',
  '#F8E59B',
  '#F6BE80',
  '#B98E7E',
  '#A2CAEE',
  '#9AE1E9',
  '#79D1C9',
  '#7DD3AE',
  '#FA9898',
  '#FB8DB4',
  '#BBA7E4',
  '#9DAAF3',
];

const defaultChartOptions = {
  chart: {
    backgroundColor: '#FFFFFF',
    style: {
      fontFamily: "'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    },
  },
  exporting: { enabled: true },
  credits: { enabled: false },
  title: {
    text: '',
    align: 'center',
    verticalAlign: 'top',
    style: {
      fontWeight: 'bold',
      fontSize: '13px',
      color: '#526069',
    },
    floating: true,
  },
  colors: defaultChartColors,
  tooltip: {
    shared: true,
    useHTML: true,
    headerFormat: '<span style="font-size: 13px">{point.key}</span><br/>',
    pointFormat:
      '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>',
  },
  lang: {
    noData: 'NO DATA TO DISPLAY',
  },
  noData: {
    style: {
      fontWeight: 'bold',
      fontSize: '13px',
      color: '#526069',
    },
    position: {
      align: 'center',
      verticalAlign: 'middle',
    },
  },
  legend: {
    enabled: true,
    floating: false,
    align: 'center',
    layout: 'horizontal',
    verticalAlign: 'bottom',
    backgroundColor: '#ffffff',
    borderWidth: 0,
    symbolHeight: 12,
    symbolWidth: 12,
    symbolRadius: 6,
    shadow: false,
    itemStyle: {
      fontWeight: '400',
    },
  },
};

class HighChart {
  constructor() {
    this.scope = {
      options: '=highchart',
    };
  }

  link(scope, ele) {
    let instance;

    const updateOptions = (overideOptions) => {
      instance.update(overideOptions);
    };
    const showNoData = () => {
      instance.showNoData('NO DATA TO DISPLAY');
    };
    const destroy = () => {
      instance.destroy();
    };

    const updateData = (data = []) => {
      const categories = [];
      const seriesData = {};

      const { type, name, series = {}, dynamic } = scope.options;

      Object.keys(series).forEach(seriName => (seriesData[seriName] = []));
      data.forEach((category) => {
        if (typeof category.name === 'number') {
          const date = new Date(category.name);
          let dd = date.getDate();
          dd = dd < 10 ? `0${dd}` : dd;

          let mm = date.getMonth() + 1;
          mm = mm < 10 ? `0${mm}` : mm;

          categories.push(`${dd}/${mm}`);
        } else {
          categories.push(category.name);
        }

        // Set 0 by default
        Object.keys(series).forEach(seri => seriesData[seri].push(0));

        // Replace value
        _get(category, 'detail', []).forEach((item) => {
          if (!dynamic && !seriesData[item.name]) return;
          item.name = item.name || 'Unknown';
          if (dynamic && !seriesData[item.name]) {
            seriesData[item.name] = [0];
          }

          seriesData[item.name].pop();
          seriesData[item.name].push(item.y);
        });
      });

      if (dynamic) {
        Object.keys(seriesData).forEach((seri) => {
          series[seri] = { name: seri };
        });
      }

      // Remove old series
      while (instance.series.length) {
        instance.series[0].remove(false);
      }

      // Recreate series
      if (type === 'pie' || type === 'bar') {
        Object.keys(seriesData).forEach((seri) => {
          seriesData[seri] = _sum(seriesData[seri]);
        });

        if (type === 'pie') {
          instance.addSeries(
            {
              name,
              data: Object.keys(series).map(seri => ({
                name: series[seri].name,
                y: seriesData[seri],
              })),
            },
            false,
          );
        } else {
          instance.update(
            {
              chart: { height: Object.keys(series).length * 40 + 120 },
            },
            false,
          );
          instance.xAxis[0].update({ categories: Object.keys(series) }, false);

          Object.keys(series).forEach((seri, index) => {
            const seriOption = {
              data: [{ x: index, y: seriesData[seri] }],
              name: seri,
            };
            instance.addSeries(seriOption, false);
          });
        }
      } else {
        instance.xAxis[0].update({ categories }, false);
        _forEach(series, (option, seri) => {
          const seriOption = { data: seriesData[seri], ...option };
          instance.addSeries(seriOption, false);
        });
      }
      instance.redraw();
    };

    const load = () => {
      if (typeof scope.options.onInitialized === 'function') {
        scope.options.onInitialized({
          instance,
          updateData,
          updateOptions,
          showNoData,
          destroy
        });
      }
    };

    const chartOptions = _merge(
      { chart: { events: { load } } },
      defaultChartOptions,
      scope.options.chartOptions,
    );

    instance = HighCharts.chart(ele[0], chartOptions);
  }

  static factory() {
    return new HighChart();
  }
}

export default angular
  .module('app.directive.highchart', [])
  .directive('highchart', HighChart.factory);
