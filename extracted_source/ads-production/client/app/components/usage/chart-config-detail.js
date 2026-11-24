const chartOptions = {
  chart: {
    type     : 'spline',
    marginTop: 20,
    height   : 300,
  },
  tooltip: {
    split: true,
  },
  plotOptions: {
    spline: {
      borderWidth: 0,
      dataLabels : {
        enabled: false,
      },
      stacking: null,
    },
    areaspline: {
      stacking   : null,
      fillOpacity: 0.9,
      lineColor  : '#ffffff',
      lineWidth  : 1,
      marker     : {
        enabled: false,
      },
    },
  },
};

export default chartOptions;
