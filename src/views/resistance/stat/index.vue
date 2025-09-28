<template>
  <div class="resistance-stat">
    <!-- 时间选择器和阈值设置 -->
    <div class="time-selector">
      <el-date-picker
        v-model="selectedMonth"
        type="month"
        placeholder="选择月份"
        format="YYYY-MM"
        value-format="YYYY-MM"
        @change="handleMonthChange"
        :clearable="false"
      />
      <div class="threshold-input">
        <label>原始值的绝对值></label>
        <el-input-number
          v-model="originalThreshold"
          :min="0"
          :step="10"
          placeholder="输入阈值"
          style="width: 140px;"
          @change="handleThresholdChange"
        />
        <span class="unit">N为蠕变机位</span>
      </div>
        <!-- 统计结果 -->
        <div class="statistics-info" v-if="tableData.length > 0">
          <span class="stat-item">
            共 <strong>{{ totalMachines }}</strong> 个机位
          </span>
          <span class="stat-item">
            蠕变 <strong class="exceed-count">{{ exceedMachines }}</strong> 个机位
          </span>
          <span class="stat-item">
            蠕变率 <strong class="exceed-percentage">{{ exceedPercentage }}%</strong>
          </span>
        </div>
        <el-button 
          type="primary" 
          :icon="Download" 
          @click="exportToExcel"
          :disabled="tableData.length === 0"
        >
          导出Excel
        </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table
      :data="tableData"
      border
      stripe
      v-loading="loading"
      style="width: 100%"
      height="80vh"
      empty-text="暂无数据"
      :span-method="spanMethod"
    >
      <el-table-column prop="stationName" label="站点" min-width="120" />
      <el-table-column prop="switchName" label="转辙机" min-width="120" />
      <el-table-column label="开始静态保持力/原始值" min-width="200" align="center">
        <template #default="{ row }">
          <div class="value-pair">
            <span class="resistance-value">{{ row.startResistance }}N</span>
            <span class="separator">/</span>
            <span 
              class="original-value" 
              :class="{ 'exceed-threshold': isExceedThreshold(row.startOriginal) }"
            >
              {{ row.startOriginal }}N
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="结束静态保持力/原始值" min-width="200" align="center">
        <template #default="{ row }">
          <div class="value-pair">
            <span class="resistance-value">{{ row.endResistance }}N</span>
            <span class="separator">/</span>
            <span 
              class="original-value" 
              :class="{ 'exceed-threshold': isExceedThreshold(row.endOriginal) }"
            >
              {{ row.endOriginal }}N
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="time" label="时间" min-width="150" />
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Download } from '@element-plus/icons-vue';
import { useStationStore } from '@/store/modules/station';
import { requestDBData } from '@/api/db';
import { requestResistanceDetail } from '@/api/resistance';
import { requestGapZzjList } from '@/api/mo';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const stationStore = useStationStore();

// 响应式数据
const loading = ref(false);
const selectedMonth = ref(dayjs().format('YYYY-MM'));
const tableData = ref([]);
const originalThreshold = ref(10000); // 原始值阈值，默认1000N

// 获取所有站点
const allStations = computed(() => stationStore.getAllStations);

// 统计信息计算属性
const totalMachines = computed(() => tableData.value.length);

const exceedMachines = computed(() => {
  return tableData.value.filter(row => {
    const startExceed = isExceedThreshold(row.startOriginal);
    const endExceed = isExceedThreshold(row.endOriginal);
    return startExceed || endExceed;
  }).length;
});

const exceedPercentage = computed(() => {
  if (totalMachines.value === 0) return 0;
  return ((exceedMachines.value / totalMachines.value) * 100).toFixed(1);
});

// 处理月份变化
const handleMonthChange = () => {
  loadData();
};

// 处理阈值变化
const handleThresholdChange = () => {
  // 阈值变化时不需要重新加载数据，只需要重新渲染表格
  // 因为标红功能是通过计算属性实现的
};

// 判断原始值是否超过阈值
const isExceedThreshold = (value) => {
  if (value === '-' || value === null || value === undefined) return false;
  const numValue = parseFloat(value);
  return !isNaN(numValue) && Math.abs(numValue) > originalThreshold.value;
};

// 合并单元格方法
const spanMethod = ({ row, column, rowIndex, columnIndex }) => {
  // 只对第一列（站点名称）进行合并
  if (columnIndex === 0) {
    const currentStation = row.stationName;
    let rowspan = 1;
    
    // 向下查找相同站点名称的行数
    for (let i = rowIndex + 1; i < tableData.value.length; i++) {
      if (tableData.value[i].stationName === currentStation) {
        rowspan++;
      } else {
        break;
      }
    }
    
    // 如果是第一行或者与前一行站点名称不同，则显示合并
    if (rowIndex === 0 || tableData.value[rowIndex - 1].stationName !== currentStation) {
      return {
        rowspan: rowspan,
        colspan: 1
      };
    } else {
      // 如果与前一行站点名称相同，则隐藏
      return {
        rowspan: 0,
        colspan: 0
      };
    }
  }
  
  return {
    rowspan: 1,
    colspan: 1
  };
};

// 加载数据
const loadData = async () => {
  if (!selectedMonth.value) {
    ElMessage.warning('请选择月份');
    return;
  }

  loading.value = true;
  tableData.value = [];

  try {
    const promises = allStations.value.map(async (station) => {
      try {
        // 1. 获取转辙机列表
        const zzjResponse = await requestGapZzjList(station.ip, { withDev: true });
        
        if (!zzjResponse?.result?.length) {
          return null;
        }

        const results = [];
        
        // 2. 遍历转辙机列表
        for (const zzj of zzjResponse?.result) {
          try {
            // 3. 拼接tag并获取数据库数据
            const dbResponse = await requestDBData(station.ip, {
              tag: `${zzj.tag}.转换阻力`,
              time: selectedMonth.value
            });
            
            if (!dbResponse?.result?.length) {
              results.push({
                stationName: station.stationName,
                switchName: zzj.name,
                startResistance: '-',
                endResistance: '-',
                startOriginal: '-',
                endOriginal: '-',
                time: '-'
              });
              continue;
            }

            // 4. 获取最新的数据信息
            const { time, move_direct } = dbResponse.result[0];
            if (!time) continue;

            try {
              // 5. 获取阻力详细数据
              const resistanceResponse = await requestResistanceDetail(station.ip, {
                name: zzj.name,
                move_direct: parseInt(move_direct),
                time_range: time
              });
              if (resistanceResponse?.data?.curve_data) {
                const curveData = resistanceResponse.data.curve_data;
                
                // 找到阻力曲线和原始曲线
                const resistanceCurve = curveData.find(curve => curve.name === '阻力曲线');
                const originalCurve = curveData.find(curve => curve.name === '原始曲线');
                
                if (resistanceCurve?.data && originalCurve?.data) {
                  const resistanceData = resistanceCurve.data;
                  const originalData = originalCurve.data;
                  
                  // 获取首尾值
                  const startResistance = resistanceData[0] || 0;
                  const endResistance = resistanceData[resistanceData.length - 1] || 0;
                  const startOriginal = originalData[0] || 0;
                  const endOriginal = originalData[originalData.length - 1] || 0;

                  results.push({
                    stationName: station.stationName,
                    switchName: zzj.name,
                    startResistance: startResistance.toFixed(0) || '-',
                    endResistance: endResistance.toFixed(0) || '-',
                    startOriginal: startOriginal.toFixed(0) || '-',
                    endOriginal: endOriginal.toFixed(0) || '-',
                    time: time || '-'
                  });
                }
              }
            } catch (error) {
              console.error(`获取 ${station.stationName} ${zzj.name} 阻力数据失败:`, error);
            }
          } catch (error) {
            console.error(`获取 ${station.stationName} ${zzj.name} 数据库数据失败:`, error);
          }
        }

        return results;
      } catch (error) {
        console.error(`获取 ${station.stationName} 转辙机列表失败:`, error);
        return null;
      }
    });

    const allResults = await Promise.all(promises);
    
    // 合并所有结果
    tableData.value = allResults
      .filter(result => result && result.length > 0)
      .flat();

    if (tableData.value.length === 0) {
      ElMessage.info('该月份暂无数据');
    } else {
      ElMessage.success(`成功加载 ${tableData.value.length} 条数据`);
    }
  } catch (error) {
    console.error('加载数据失败:', error);
    ElMessage.error('加载数据失败');
  } finally {
    loading.value = false;
  }
};

// 导出Excel功能
const exportToExcel = () => {
  if (tableData.value.length === 0) {
    ElMessage.warning('暂无数据可导出');
    return;
  }

  try {
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    
    // 准备数据
    const exportData = tableData.value.map((row, index) => {
      return {
        '序号': index + 1,
        '站点': row.stationName,
        '转辙机': row.switchName,
        '开始静态保持力': row.startResistance,
        '开始原始值': row.startOriginal,
        '结束静态保持力': row.endResistance,
        '结束原始值': row.endOriginal,
        '时间': row.time,
      };
    });

    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // 设置列宽
    const colWidths = [
      { wch: 8 },   // 序号
      { wch: 15 },  // 站点
      { wch: 15 },  // 转辙机
      { wch: 18 },  // 开始静态保持力
      { wch: 18 },  // 开始原始值
      { wch: 18 },  // 结束静态保持力
      { wch: 18 },  // 结束原始值
      { wch: 20 },  // 时间
    ];
    ws['!cols'] = colWidths;


    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '静态保持力统计');

    // 生成文件名
    const fileName = `静态保持力统计_${selectedMonth.value}_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
    
    // 导出文件
    XLSX.writeFile(wb, fileName);
    
    ElMessage.success(`Excel文件已导出：${fileName}`);
  } catch (error) {
    console.error('导出Excel失败:', error);
    ElMessage.error('导出Excel失败');
  }
};

// 页面加载时获取数据
onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.resistance-stat {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.time-selector {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  
  .el-date-editor {
    width: 200px;
  }
  
  .threshold-input {
    display: flex;
    align-items: center;
    gap: 8px;
    
    label {
      font-size: 14px;
      color: #606266;
      font-weight: 500;
    }
    
    .el-input-number {
      width: 120px;
    }
    
    .unit {
      font-size: 14px;
      color: #909399;
    }
  }
  
  .el-button {
    margin-left: 20px;
  }
}

.statistics-info {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-left: 20px;
  
  .stat-item {
    font-size: 14px;
    color: #495057;
    
    strong {
      color: #212529;
      font-weight: 600;
    }
    
    .exceed-count {
      color: #dc3545;
      font-weight: 700;
    }
    
    .exceed-percentage {
      color: #dc3545;
      font-weight: 700;
    }
  }
}

.value-pair {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  
  .resistance-value {
    color: #409eff;
    font-weight: 600;
  }
  
  .separator {
    color: #909399;
    font-weight: 500;
  }
  
  .original-value {
    color: #67c23a;
    font-weight: 500;
    
    &.exceed-threshold {
      color: #f56c6c;
      font-weight: 600;
      background-color: #fef0f0;
      padding: 2px 4px;
      border-radius: 3px;
    }
  }
}

.el-table {
  .el-table__header {
    th {
      background-color: #f5f7fa;
      color: #303133;
      font-weight: 600;
    }
  }
  
  .el-table__row {
    &:hover {
      background-color: #f5f7fa;
    }
  }
}

// 空状态样式
:deep(.el-table__empty-block) {
  .el-table__empty-text {
    color: #909399;
    font-size: 14px;
  }
}

// 加载状态样式
:deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.8);
}
</style>
