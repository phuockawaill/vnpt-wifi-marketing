const chartOptions = {
  chart: {
    type        : 'pie',
    marginBottom: 80,
    marginTop   : 10,
    height      : 300,
  },
  legend: {
    align        : 'center',
    verticalAlign: 'bottom',
    layout       : 'horizontal',
  },
  noData: {
    position: {
      align        : 'center',
      verticalAlign: 'middle',
      y            : 25,
    },
  },
  plotOptions: {
    pie: {
      size            : '100%',
      allowPointSelect: true,
      cursor          : 'pointer',
      dataLabels      : {
        enabled         : true,
        format          : '<p style="white-space: pre-wrap">{point.name}</p> <br/> <b>{point.percentage:.1f}%</b> ({point.y})',
        connectorPadding: 0,
        distance        : 5,
      },
      showInLegend: true,
    },
  },
  tooltip: {
    shared      : false,
    headerFormat: '<span style="font-size: 13px">{series.name}</span><br/>',
    pointFormat : '<span style="color:{point.color}">{point.name}</span>: <b>{point.percentage:.1f}%</b> ({point.y})',
  },
};

export default chartOptions;
