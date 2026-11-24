const chartOptions = {
  chart: {
    type  : 'column',
    height: 300
  },
  // tooltip: {
  //   pointFormatter() {
  //     let value = this.y.format(0);
  //     if (this.series.name === 'CTR') value = `${this.y.format(1)}%`;
  //     if (this.series.name === 'Impression Line') return '';
  //     if (this.series.name === 'Click Line') return '';
  //     return `<span style="color:${this.color}">\u25CF</span> ${this.series.name}: <b>${value}</b><br/>`;
  //   }
  // },
  plotOptions: {
    column: {
      borderWidth: 0,
      dataLabels : {
        enabled: true,
        style: {
          fontSize: '16px'
        }
      }
    },
    spline: {
      lineWidth: 2,
      marker   : { enabled: false }
    },
    areaspline: {
      fillOpacity: 0.9,
      lineColor  : '#ffffff',
      lineWidth  : 1,
      marker     : { enabled: false }
    }
  },
  legend: {
    enabled: false
  },
  yAxis: { title: { text: 'Minutes' } },
  xAxis: { title: { text: 'Time Connect' } }
  // [
    // {
    //   title : { text: 'CTR' },
    //   labels: {
    //     format: '{value} %'
    //   },
    //   opposite: true,
    //   min: 0,
    //   max: 100
    // }
  // ]
};

export default chartOptions;
