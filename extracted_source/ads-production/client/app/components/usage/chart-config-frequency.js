const chartOptions = {
  chart: {
    type     : 'column',
    marginTop: 0,
    height   : 320,
  },
  plotOptions: {
    column: {
      dataLabels: {
        enabled: true,
      },
      groupPadding: 1,
      pointWidth  : 30,
      pointPadding: 0,
      tooltip     : {
        headerFormat: '',
      }
    },
  },
  yAxis: [
    {
      title            : { text: 'Visit' },
      type             : 'logarithmic',
      minorTickInterval: 10,
    },
  ],
  xAxis: {
      categories: ['1', '2-5', '6-10', '10+'],
  },
};

export default chartOptions;
