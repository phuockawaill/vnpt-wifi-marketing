const chartOptions = {
  chart: {
    type     : 'bar',
    marginTop: 0,
    height   : 300,
  },
  legend: {
    layout       : 'vertical',
    align        : 'right',
    verticalAlign: 'top',
  },
  plotOptions: {
    bar: {
      dataLabels: {
        enabled: true,
      },
      groupPadding: 0.1,
      pointWidth  : 30,
      pointPadding: 0,
      tooltip     : {
        headerFormat: '',
      },
    },
  },
};

export default chartOptions;
