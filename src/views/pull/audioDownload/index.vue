<template>
  <div class="audio-download-container">
    <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="转辙机">
            <ZzjSelector
              v-model="selectedZzj"
              placeholder="请选择转辙机"
              @change="handleZzjChange"
              with-dev="GAP"
              :default-select-first="true"
            />
          </el-form-item>
        </el-col>
      
      <el-col :span="6">
        <MonthDaySelector
          v-model="monthDayValue"
          :tag="selectedZzj"
          @change="handleMonthDayChange"
        />
      </el-col>
      
       <el-col :span="6">
         <el-form-item>
           <el-button 
             @click="refreshData"
             :loading="loading"
             :disabled="!selectedZzj || !monthDayValue.day"
           >
             刷新数据
           </el-button>
           <el-button 
             type="warning" 
             @click="downloadAudio"
             :loading="downloadLoading"
             :disabled="selectedRows.length === 0"
           >
             下载音频 ({{ selectedRows.length }})
           </el-button>
         </el-form-item>
       </el-col>
    </el-row>
  
    <div class="table-section">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        empty-text="暂无数据"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          type="selection"
          width="55"
          align="center"
          :selectable="(row) => row.hasFile"
        />
        <el-table-column
          prop="time"
          label="时间"
          align="center"
        />
        <el-table-column
          prop="tag"
          label="标签"
          show-overflow-tooltip
        />
        <el-table-column
          label="转换方向"
        >
          <template #default="{ row }">
            <div>{{ row.data_attr?.value || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column
          label="是否存在音频"
          width="150"
          align="center"
        >
          <template #default="{ row }">
            <el-tag 
              :type="row.hasFile ? 'success' : 'danger'"
              size="small"
            >
              {{ row.hasFile ? '存在' : '不存在' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { requestDBData } from '@/api/db'
import { requestFilesDownload } from '@/api/file'
import { handleZipDownload } from '@/utils/file'
import { useStationStore } from '@/store/modules/station'
import ZzjSelector from '@/components/ZzjSelector/index.vue'
import MonthDaySelector from '@/components/MonthDaySelector/index.vue'
import dayjs from 'dayjs'

// 响应式数据
const selectedZzj = ref('')
const monthDayValue = ref({ month: dayjs().format('YYYY-MM'), day: '' })
const tableData = ref([])
const loading = ref(false)
const selectedRows = ref([])
const downloadLoading = ref(false)

const stationStore = useStationStore();

const selectedStation = computed(() => {
  return stationStore.getSelectedStation;
});

// 转辙机选择变化
const handleZzjChange = (value, selectedZzjObj) => {
  console.log('选中的转辙机:', value, selectedZzjObj)
  selectedZzj.value = value
  // 清空月份日期选择
  monthDayValue.value = { month: dayjs().format('YYYY-MM'), day: '' }
}

// 月份日期选择变化
const handleMonthDayChange = async (value) => {
  console.log('选中的月份日期:', value)
  monthDayValue.value = value
  
  // 如果有选中的转辙机和日期，则加载数据
  if (selectedZzj.value && value.day) {
    await loadData()
  } else {
    tableData.value = []
  }
}

// 加载数据
const loadData = async () => {
  if (!selectedZzj.value || !monthDayValue.value.day) {
    return
  }
  
  try {
    loading.value = true
    const response = await requestDBData(selectedStation.value.ip, {
      tag: `${selectedZzj.value}.扳动录像`,
      time: monthDayValue.value.day
    })
    
    if (response?.result?.length) {
      // 处理表格数据，添加目录路径和文件名
      tableData.value = response.result.map(row => {
        const timeObj = dayjs(row.time)
        const timePart = timeObj.format('HHmmss')
        const fileName = `${timePart}.avi_mv.mp3`
        
        // 构建目录路径
        const tagParts = row.tag.split('.')
        const stationTag = tagParts[0] // 如：41#
        const zzjTag = tagParts[1] // 如：41#C
        const monthStr = dayjs(monthDayValue.value.month).format('YYYYMM')
        const dayStr = dayjs(monthDayValue.value.day).format('DD')
        const dir = `db/${monthStr}/${dayStr}/${encodeURIComponent(stationTag)}/${encodeURIComponent(zzjTag)}/扳动录像/`
        
        const fileUrl = `http://${selectedStation.value.ip}:81/${dir}${fileName}`
        return {
          ...row,
          fileName,
          dir,
          fileUrl,
          hasFile: false // 初始状态，后续会检查
        }
      })
      
      // 检查文件是否存在
      await checkFilesExist()
    } else {
      tableData.value = []
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
    tableData.value = []
  } finally {
    loading.value = false
  }
}

// 检查文件是否存在
const checkFilesExist = async () => {
  const checkPromises = tableData.value.map(async (row, index) => {
    try {
      const response = await fetch(row.fileUrl)
      tableData.value[index].hasFile = response.ok
    } catch (error) {
      console.warn(`检查文件失败: ${row.fileUrl}`, error)
      tableData.value[index].hasFile = false
    }
  })
  
  await Promise.all(checkPromises)
}

// 刷新数据
const refreshData = () => {
  if (selectedZzj.value && monthDayValue.value.day) {
    loadData()
    ElMessage.success('刷新成功')
  }
}

// 处理表格选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}


// 下载音频
const downloadAudio = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要下载的音频')
    return
  }

  // 检查是否有文件存在
  const availableFiles = selectedRows.value.filter(row => row.hasFile)
  if (availableFiles.length === 0) {
    ElMessage.warning('选中的音频文件都不存在，无法下载')
    return
  }

  if (availableFiles.length < selectedRows.value.length) {
    ElMessage.warning(`只有 ${availableFiles.length} 个文件存在，将下载可用的文件`)
  }

  try {
    downloadLoading.value = true
    
    // 使用表格数据中已处理好的字段
    const items = availableFiles.map(row => row.fileName)
    const dir = availableFiles[0].dir // 使用第一个文件的目录

    const requestData = {
      dir,
      items
    }

    console.log('下载请求参数:', requestData)

    const response = await requestFilesDownload(selectedStation.value.ip, requestData)
    
    if (response) {
      // 生成文件名
      const zzjName = selectedZzj.value.split('.').pop() || 'audio'
      const fileName = `扳动音频文件_${selectedStation.value.stationName}_${zzjName}_${monthDayValue.value.day}.zip`
      
      // 处理zip包下载
      const result = await handleZipDownload(response, availableFiles.length, fileName)
      
      if (result.success) {
        ElMessage.success(result.message)
      } else {
        ElMessage.error(result.message)
      }
    }
  } catch (error) {
    console.error('下载音频失败:', error)
    ElMessage.error('下载音频失败')
  } finally {
    downloadLoading.value = false
  }
}

</script>

<style scoped>
</style>
