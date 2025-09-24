
export const stackedAreaChartData = {
  title: {
    text: 'Stacked Area Chart'
  },
  legend: {
    data: ['Email', 'Union Ads', 'Video Ads', 'Direct', 'Search Engine'],
    bottom: '0'
  },
  xAxis: [
    {
      type: 'category',
      boundaryGap: false,
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    }
  ],
  series: [
    {
      name: 'Email',
      type: 'line',
      stack: 'Total',
      areaStyle: {},
      emphasis: {
        focus: 'series'
      },
      data: [120, 132, 101, 134, 90, 230, 210]
    },
    {
      name: 'Union Ads',
      type: 'line',
      stack: 'Total',
      areaStyle: {},
      emphasis: {
        focus: 'series'
      },
      data: [220, 182, 191, 234, 290, 330, 310]
    },
    {
      name: 'Video Ads',
      type: 'line',
      stack: 'Total',
      areaStyle: {},
      emphasis: {
        focus: 'series'
      },
      data: [150, 232, 201, 154, 190, 330, 410]
    },
    {
      name: 'Direct',
      type: 'line',
      stack: 'Total',
      areaStyle: {},
      emphasis: {
        focus: 'series'
      },
      data: [320, 332, 301, 334, 390, 330, 320]
    },
    {
      name: 'Search Engine',
      type: 'line',
      stack: 'Total',
      label: {
        show: true,
        position: 'top'
      },
      areaStyle: {},
      emphasis: {
        focus: 'series'
      },
      data: [820, 932, 901, 934, 1290, 1330, 1320]
    }
  ]
};

export const pieChartData =  {
  title: {
    text: 'PieChart'
  },
  series: [
    {
      name: 'Access From',
      type: 'pie',
      data: [
        { value: 1048, name: 'Search Engine' },
        { value: 735, name: 'Direct' },
        { value: 580, name: 'Email' },
        { value: 484, name: 'Union Ads' },
        { value: 300, name: 'Video Ads' }
      ]
    }
  ]
};

export const mixChartData = {
  'rate': [
    {
      'date': 1672502400,
      'value': 0.054323
    },
    {
      'date': 1672588800,
      'value': -0.071344
    },
    {
      'date': 1672675200,
      'value': -0.059364
    },
    {
      'date': 1672761600,
      'value': -0.233051
    },
    {
      'date': 1672848000,
      'value': 0.119581
    },
    {
      'date': 1672934400,
      'value': -0.054082
    },
    {
      'date': 1673020800,
      'value': -0.019802
    },
    {
      'date': 1673107200,
      'value': -0.181241
    },
    {
      'date': 1673193600,
      'value': -0.236685
    },
    {
      'date': 1673280000,
      'value': 0.112196
    },
    {
      'date': 1673366400,
      'value': 0.80031
    },
    {
      'date': 1673452800,
      'value': -0.466915
    },
    {
      'date': 1673539200,
      'value': -0.108133
    },
    {
      'date': 1673625600,
      'value': 0.141577
    },
    {
      'date': 1673712000,
      'value': 0.12338
    },
    {
      'date': 1673798400,
      'value': -0.416647
    },
    {
      'date': 1673884800,
      'value': -0.052151
    },
    {
      'date': 1673971200,
      'value': -0.042062
    },
    {
      'date': 1674057600,
      'value': 0.222004
    },
    {
      'date': 1674144000,
      'value': -0.067414
    },
    {
      'date': 1674230400,
      'value': -0.289051
    },
    {
      'date': 1674316800,
      'value': -0.050116
    },
    {
      'date': 1674403200,
      'value': 0.506377
    },
    {
      'date': 1674489600,
      'value': 0.256359
    },
    {
      'date': 1674576000,
      'value': -0.173531
    },
    {
      'date': 1674662400,
      'value': 0.217857
    },
    {
      'date': 1674748800,
      'value': -0.165496
    },
    {
      'date': 1674835200,
      'value': 0.040605
    },
    {
      'date': 1674921600,
      'value': 0.188272
    },
    {
      'date': 1675008000,
      'value': -0.182316
    },
    {
      'date': 1675094400,
      'value': -0.097774
    }
  ],
  'amount': [
    {
      'date': 1672502400,
      'value': 15606129.42
    },
    {
      'date': 1672588800,
      'value': 14492726.3
    },
    {
      'date': 1672675200,
      'value': 13632385.39
    },
    {
      'date': 1672761600,
      'value': 10455347.92
    },
    {
      'date': 1672848000,
      'value': 11705610.02
    },
    {
      'date': 1672934400,
      'value': 11072548.08
    },
    {
      'date': 1673020800,
      'value': 10853288.03
    },
    {
      'date': 1673107200,
      'value': 8886229.76
    },
    {
      'date': 1673193600,
      'value': 6782988.46
    },
    {
      'date': 1673280000,
      'value': 7544013.12
    },
    {
      'date': 1673366400,
      'value': 13581564.26
    },
    {
      'date': 1673452800,
      'value': 7240133.87
    },
    {
      'date': 1673539200,
      'value': 6457238.82
    },
    {
      'date': 1673625600,
      'value': 7371433.71
    },
    {
      'date': 1673712000,
      'value': 8280924.5
    },
    {
      'date': 1673798400,
      'value': 4830704.79
    },
    {
      'date': 1673884800,
      'value': 4578779.94
    },
    {
      'date': 1673971200,
      'value': 4386189.28
    },
    {
      'date': 1674057600,
      'value': 5359941.05
    },
    {
      'date': 1674144000,
      'value': 4998604.02
    },
    {
      'date': 1674230400,
      'value': 3553752.5
    },
    {
      'date': 1674316800,
      'value': 3375651.8
    },
    {
      'date': 1674403200,
      'value': 5085003.49
    },
    {
      'date': 1674489600,
      'value': 6388589.88
    },
    {
      'date': 1674576000,
      'value': 5279970.58
    },
    {
      'date': 1674662400,
      'value': 6430247.38
    },
    {
      'date': 1674748800,
      'value': 5366069.39
    },
    {
      'date': 1674835200,
      'value': 5583959.4
    },
    {
      'date': 1674921600,
      'value': 6635260.34
    },
    {
      'date': 1675008000,
      'value': 5425543.52
    },
    {
      'date': 1675094400,
      'value': 4895068.32
    }
  ],
}
