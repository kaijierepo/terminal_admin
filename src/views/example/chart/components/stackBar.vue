<script setup>
import Echart from '@/components/Echarts/index.vue';
import { formatToDate } from '@/utils/dateUtil';

const option = ref();
const rawData = [
  {
    'positive_count': 190,
    'negative_count': 67,
    'neutral_count': 127,
    'date': 1672502400
  },
  {
    'positive_count': 197,
    'negative_count': 73,
    'neutral_count': 135,
    'date': 1672588800
  },
  {
    'positive_count': 242,
    'negative_count': 104,
    'neutral_count': 147,
    'date': 1672675200
  }
]

const loadOption = () => {
  const chartConf = [
    { name: 'Direct', value: 'positive_count', color: '#5AD8A6' },
    { name: 'Email', value: 'neutral_count', color: '#FAC858' },
    { name: 'Video', value: 'negative_count', color: '#FF726A' }
  ]
  const date = rawData.map(v => formatToDate(v.date));
  const legend = chartConf.map(v => v.name);
  const series = chartConf.map(item => {
    return {
      type: 'bar',
      name: item.name,
      barMaxWidth: 16,
      barCategoryGap: '10',
      stack: 'Ad',
      itemStyle: {
        color: item.color
      },
      emphasis: {
        focus: 'series'
      },
      data: rawData.map(v => v[item.value])
    }
  })
  option.value = {
    title: {
      text: '柱状堆叠图'
    },
    legend: {
      data: legend
    },
    xAxis: [{
      data: date,
    }],
    series,
    tooltip: {
      axisPointer: {
        type: 'shadow'
      }
    }
  }
}

loadOption();

</script>

<template>
  <div>
    <Echart :options="option" height="300px"></Echart>
  </div>
</template>