<template>
  <el-select
    v-model="selectedStation"
    placeholder="选择站点"
    filterable
    class="station-selector"
    :style="{ width: width }"
    @change="handleStationChange"
  >
    <el-option
      v-for="station in stationList"
      :key="station.ip"
      :label="`${station.stationName} (${station.ip})`"
      :value="station.ip"
    />
  </el-select>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { useStationStore } from '@/store/modules/station';

// 定义组件属性
const props = defineProps({
  // 选择器宽度
  width: {
    type: String,
    default: '200px'
  },
  // 是否自动选择第一个站点
  autoSelectFirst: {
    type: Boolean,
    default: true
  },
  // 默认选中的站点IP
  defaultValue: {
    type: String,
    default: ''
  }
});

// 定义组件事件
const emit = defineEmits(['change', 'select']);

// 站点 store
const stationStore = useStationStore();

// 当前选中的站点（从 store 获取）
const selectedStation = computed({
  get: () => stationStore.getSelectedStationIp,
  set: (value) => stationStore.setSelectedStation(value)
});

// 站点列表
const stationList = computed(() => stationStore.getAllStations);

// 处理站点选择变化
const handleStationChange = (value) => {
  // 更新 store 中的选中状态
  stationStore.setSelectedStation(value);
};

// 监听站点列表变化，自动选择第一个站点
watch(stationList, (newList) => {
  if (newList.length > 0 && !stationStore.getSelectedStationIp && props.autoSelectFirst) {
    stationStore.autoSelectFirstStation();
  }
}, { immediate: true });

// 监听默认值变化
watch(() => props.defaultValue, (newValue) => {
  if (newValue && newValue !== stationStore.getSelectedStationIp) {
    stationStore.setSelectedStation(newValue);
  }
});
</script>

<style scoped lang="scss">
.station-selector {
  :deep(.el-input__wrapper) {
    border-radius: 6px;
    box-shadow: 0 0 0 1px #dcdfe6 inset;
    transition: all 0.3s;
    
    &:hover {
      box-shadow: 0 0 0 1px #c0c4cc inset;
    }
    
    &.is-focus {
      box-shadow: 0 0 0 1px #409eff inset;
    }
  }
  
  :deep(.el-input__inner) {
    font-size: 14px;
    color: #606266;
  }
  
  :deep(.el-select__placeholder) {
    color: #c0c4cc;
  }
}
</style>
