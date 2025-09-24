<template>
  <el-select
    v-model="selectedValue"
    :placeholder="placeholder"
    :loading="loading"
    :disabled="disabled"
    :clearable="clearable"
    @change="handleChange"
    :style="{ width: width }"
  >
    <el-option
      v-for="item in zzjList"
      :key="item.tag"
      :label="item.name"
      :value="item.tag"
    />
  </el-select>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { requestGapZzjList } from '@/api/mo'
import { useStationStore } from '@/store/modules/station'

// Props定义
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '请选择转辙机'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: false
  },
  width: {
    type: String,
    default: '100%'
  },
  withDev: {
    type: String,
    default: 'GAP'
  },
  autoLoad: {
    type: Boolean,
    default: true
  },
  defaultSelectFirst: {
    type: Boolean,
    default: true
  }
})

// Emits定义
const emit = defineEmits(['update:modelValue', 'change', 'loaded'])

// 响应式数据
const zzjList = ref([])
const loading = ref(false)
const selectedValue = ref(props.modelValue)

// Store
const stationStore = useStationStore()
const selectedStation = computed(() => {
  return stationStore.getSelectedStation
})

// 获取转辙机列表
const loadZzjList = async () => {
  if (!selectedStation.value?.ip) {
    console.warn('未选择站点，无法加载转辙机列表')
    return
  }

  try {
    loading.value = true
    const response = await requestGapZzjList(selectedStation.value.ip, { 
      withDev: props.withDev 
    })
    
    if (response && response.result) {
      zzjList.value = response.result
      
      // 如果启用默认选择第一个且当前没有选中值
      if (props.defaultSelectFirst && zzjList.value.length > 0) {
        selectedValue.value = zzjList.value[0].tag
        emit('update:modelValue', selectedValue.value)
        emit('change', selectedValue.value, zzjList.value[0])
      }
      
      emit('loaded', zzjList.value)
    } else {
      zzjList.value = []
    }
  } catch (error) {
    console.error('获取转辙机列表失败:', error)
    ElMessage.error('获取转辙机列表失败')
    zzjList.value = []
  } finally {
    loading.value = false
  }
}

// 处理选择变化
const handleChange = (value) => {
  selectedValue.value = value
  emit('update:modelValue', value)
  
  // 找到选中的转辙机对象
  const selectedZzj = zzjList.value.find(item => item.tag === value)
  emit('change', value, selectedZzj)
}

// 监听modelValue变化
watch(() => props.modelValue, (newVal) => {
  selectedValue.value = newVal
})

// 监听站点变化，重新加载数据
watch(selectedStation, (newStation) => {
  if (newStation?.ip && props.autoLoad) {
    loadZzjList()
  }
}, { deep: true })

// 暴露方法给父组件
const refresh = () => {
  loadZzjList()
}

const getSelectedZzj = () => {
  return zzjList.value.find(item => item.tag === selectedValue.value)
}

const getZzjList = () => {
  return zzjList.value
}

// 暴露方法
defineExpose({
  refresh,
  getSelectedZzj,
  getZzjList
})

// 组件挂载时加载数据
onMounted(() => {
  if (props.autoLoad) {
    loadZzjList()
  }
})
</script>

<style scoped>
/* 组件样式 */
</style>
