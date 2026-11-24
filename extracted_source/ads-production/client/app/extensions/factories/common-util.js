// import _sumBy from 'lodash/sumBy';
import _cloneDeep from 'lodash/cloneDeep';
import _merge from 'lodash/merge';

class CommonUtil {
  constructor($interpolate, $templateCache, Messages) {
    this.$interpolate = $interpolate;
    this.$templateCache = $templateCache;

    // Default data
    this._defaultChartColors = [
      '#70A532', '#FBC02D', '#E98F2E', '#715146', '#3583CA', '#37A9B7', '#178D81', '#279566', '#D6494B', '#E53B75', '#6D45BC', '#465BD4',
      '#BAD896', '#F8E59B', '#F6BE80', '#B98E7E', '#A2CAEE', '#9AE1E9', '#79D1C9', '#7DD3AE', '#FA9898', '#FB8DB4', '#BBA7E4', '#9DAAF3',
    ];
    this._defaultChartOptions = {
      common: {
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
        colors: this._defaultChartColors,
        tooltip: {
          shared: true,
          useHTML: true,
          headerFormat: '<span style="font-size: 13px">{point.key}</span><br/>',
          pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.percentage:.1f}%)<br/>',
        },
        lang: {
          noData: Messages.chartNoData,
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
      },
      actionReport: {
        chart: {
          type: 'column',
        },
        plotOptions: {
          column: {
            borderWidth: 0,
            dataLabels: {
              enabled: false,
            },
          },
          spline: {
            lineWidth: 2,
            marker: {
              enabled: false,
            },
          },
          areaspline: {
            fillOpacity: 0.9,
            lineColor: '#ffffff',
            lineWidth: 1,
            marker: {
              enabled: false,
            },
          },
        },
        yAxis: [
          {
            title: { text: 'Action' },
          },
          {
            title: { text: 'CTR' },
            labels: {
              format: '{value} %',
            },
            opposite: true,
          },
        ],
      },
      pie: {
        chart: { type: 'pie' },
        legend: {
          align: 'center',
          verticalAlign: 'bottom',
          layout: 'horizontal',
        },
        noData: {
          position: {
            align: 'center',
            verticalAlign: 'middle',
            y: 25,
          },
        },
        plotOptions: {
          pie: {
            size: '100%',
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
              enabled: false,
            },
            showInLegend: true,
          },
        },
        tooltip: {
          shared: false,
          headerFormat: '<span style="font-size: 13px">{series.name}</span><br/>',
          pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.percentage:.1f}%</b> ({point.y})',
        },
      },
      columnArea: {
        chart: {
          type: 'column',
        },
        plotOptions: {
          column: {
            borderWidth: 0,
            dataLabels: {
              enabled: false,
            },
            stacking: null,
          },
          areaspline: {
            stacking: null,
            fillOpacity: 0.9,
            lineColor: '#ffffff',
            lineWidth: 1,
            marker: {
              enabled: false,
            },
          },
        },
      },
    };

    this.defaultGridOptions = {
      height: 150,
      rowHeight: 38,
      enableColResize: true,
      enableColumnMenu: false,
      enableColumnResizing: true,

      // Faster grid
      flatEntityAccess: true,
      fastWatch: true,

      // Selection
      multiSelect: false,
      enableRowSelection: true,
      enableRowHeaderSelection: false,
      enableFullRowSelection: true,
      noUnselect: true,

      // Paging & sorting
      enableSorting: true,
      enableFiltering: true,
      paginationPageSizes: [10, 25, 50, 100],
      paginationPageSize: 10,
      paginationCurrentPage: 1,
      useExternalPagination: true,
      useExternalSorting: true,
    };

    this._defaultRzsliderConfigs = {
      min: 30,
      options: {
        floor: 30,
        step: 10,
        ceil: 100,
        showSelectionBar: true,
        getSelectionBarColor: (value) => {
          if (value <= 30)
            return 'red';
          if (value <= 50)
            return 'orange';
          if (value <= 70)
            return 'yellow';
          return '#2AE02A';
        },
        getPointerColor: (value) => {
          if (value <= 30)
            return 'red';
          if (value <= 50)
            return 'orange';
          if (value <= 70)
            return 'yellow';
          return '#2AE02A';
        },
        translate: (value) => {
          switch (value) {
            case 30:
              return `<b>Min:</b> ${value}%`;
            case 100:
              return `<b>Max:</b> ${value}%`;
            default:
              return `${value}%`;
          }
        }
      }
    };
  }

  defaultChartOptions(chartType) {
    let options = _cloneDeep(this._defaultChartOptions.common);
    if (chartType && chartType in this._defaultChartOptions) {
      options = _merge(options, this._defaultChartOptions[chartType]);
    }

    return options;
  }

  static factory($interpolate, $templateCache, Messages) {
    'ngInject';

    CommonUtil.instance = new CommonUtil($interpolate, $templateCache, Messages);
    return CommonUtil.instance;
  }
}

export default angular
  .module('app.factory.common-util', [])
  .factory('CommonUtil', CommonUtil.factory);
