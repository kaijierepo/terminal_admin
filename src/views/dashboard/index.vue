<script setup>
import Echart from '@/components/Echarts/index.vue';
import { stackedAreaChartData, pieChartData, mixChartData } from './charts-data.js';
import { formatNumberWithUnit } from '@/utils/index.js';
import { formatToDate } from '@/utils/dateUtil.js'
const loading = ref(true);

const mixOption = ref(null);
const loadMixOptions = () => {
  const amountYAxisName = '销售额';
  const rateYAxisName = '增长率';
  const dateData = mixChartData['amount'].map(v => formatToDate(v.date, 'MM/DD'));

  const rateData = mixChartData['rate'].map(v => (v.value * 100).toFixed(2));
  const rateMax = Math.ceil(Math.max(...rateData) * 1.1);
  const rateMin = Math.ceil(Math.min(...rateData) * 1.1);

  const amountData = mixChartData['amount'].map(v => v.value);
  const amountMax = Math.ceil(Math.max(...amountData) * 1.1);
  const amountMinNum = Math.ceil(Math.min(...amountData)) * 0.9;
  const amountMin = rateMin > 0 ? amountMinNum : -(amountMax / (rateMax / Math.abs(rateMin)));

  mixOption.value = {
    title: {
      text: 'Mixed Line and Bar'
    },
    legend: {
      data: [amountYAxisName, rateYAxisName]
    },
    xAxis: [
      {
        data: dateData
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: amountYAxisName,
        min: amountMin,
        max: amountMax,
        interval: Math.ceil((amountMax - amountMin) / 5),
        axisLabel: {
          formatter: (v) => formatNumberWithUnit(v)
        }
      },
      {
        type: 'value',
        name: rateYAxisName,
        min: rateMin,
        max: rateMax,
        interval: Math.ceil((rateMax - rateMin) / 5),
        axisLabel: {
          formatter: '{value}%'
        }
      }
    ],
    series: [
      {
        name: amountYAxisName,
        type: 'bar',
        tooltip: {
          valueFormatter: (v) => formatNumberWithUnit(v)
        },
        data: amountData
      },
      {
        name: rateYAxisName,
        type: 'line',
        yAxisIndex: 1,
        tooltip: {
          valueFormatter: (v) => `${v}%`
        },
        data: rateData
      }
    ]
  }
}

setTimeout(() => {
  loadMixOptions();
  loading.value = false;
}, 500);
</script>

<template>
  <div class="page-dashboard">
    <DataSummary></DataSummary>
    <ElRow :gutter="20">
      <ElCol :span="8">
        <ElCard shadow="never">
          <ElSkeleton :loading="loading" :rows="10">
            <Echart :options="pieChartData"></Echart>
          </ElSkeleton>
        </ElCard>
      </ElCol>
      <ElCol :span="16">
        <ElCard shadow="never">
          <ElSkeleton :loading="loading" :rows="10">
            <Echart :options="stackedAreaChartData"></Echart>
          </ElSkeleton>
        </ElCard>
      </ElCol>
    </ElRow>
    <ElRow :gutter="20">
      <ElCol :span="24">
        <ElCard shadow="never" class="mt-3">
          <ElSkeleton :loading="loading" :rows="10">
            <Echart :options="mixOption"></Echart>
          </ElSkeleton>
        </ElCard>
      </ElCol>
    </ElRow>
  </div>
</template>

<style scoped lang="scss">
.page-dashboard {
  background-color: #f1f1f1;
}
</style>