<script setup>
import { onMounted, ref, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import { debounce, merge } from 'lodash-es';

const props = defineProps({
  options: Object, // ECharts 配置项
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '400px'
  }
});

const $emit = defineEmits(['click', 'mouseover', 'mouseout'])

const commonOptions = {
  // 直角坐标系网格
  grid: {
    top: '20%',
    left: '80',
    right: '65',
    bottom: '15%',
  },
  tooltip: {
    trigger: 'axis',
    textStyle: {
      color: 'rgba(255, 255, 255, 0.8)',
    },
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 0,
  },
  // 工具栏
  toolbox: {
    feature: {
      dataView: { show: true, readOnly: false },
      saveAsImage: { show: true }
    }
  },
  legend: {
    bottom: '0',
    itemWidth: 16,
    itemHeight: 4,
    itemGap: 20,
  },
}

const lineOrBarOpts = {
  yAxis: [
    {
      type: 'value'
    }
  ],
  xAxis: [
    {
      type: 'category',
      axisLine: {
        onZero: false
      },
      splitLine: {
        show: false,
      },
      data: []
    }
  ]
}

const pieOpts = {
  tooltip: {
    trigger: 'item'
  },
  series: [
    {
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      padAngle: 5,
      itemStyle: {
        borderRadius: 10
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 40,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
    }
  ]
}

const echartRef = ref(null);

let echartInstance;

const resizeHandler = debounce(() => {
  echartInstance?.resize()
}, 100)

const setOptions = () => {
  let sub = {};
  const series = props.options?.series;
  switch (series.type || series[0]?.type) {
    case 'pie':
      sub = pieOpts;
      break;
    case 'radar':
      break;
    default:
      sub = lineOrBarOpts;
      break;
  }
  return merge({}, commonOptions, sub, props.options);
}

onMounted(() => {
  initializeChart();
  window.addEventListener('resize', resizeHandler)
});

watch(
  () => props.options,
  (newVal, oldVal) => {
    // 当 options 发生变化时，更新图表
    const finalOptions = setOptions();
    console.log('finalOptions', finalOptions)
    echartInstance.setOption(finalOptions, true);
  }
);
async function initializeChart() {
  await nextTick(); // 等待组件渲染完成
  const finalOptions = setOptions();
  console.log('finalOptions', finalOptions)
  echartInstance = echarts.init(echartRef.value);
  echartInstance.setOption(finalOptions, true);
  
  echartInstance.on('click', (params) => {
    $emit('click', params)
  });
  echartInstance.on('mouseover', (params) => {
    $emit('mouseover', params)
  });
  echartInstance.on('mouseout', (params) => {
    $emit('mouseout', params)
  });
}

const dispatchAction = (options) => {
  echartInstance?.dispatchAction(options);
}

// 组件卸载时销毁 ECharts 实例
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeHandler)
  echartInstance?.dispose();
});

defineExpose({
  dispatchAction
})

</script>

<template>
  <div ref="echartRef" class="echart"></div>
</template>

<style>
.echart {
  width: v-bind(width);
  height: v-bind(height);
}
</style>