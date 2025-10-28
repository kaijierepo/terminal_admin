<template>
  <div class="resistance-stat">
    <!-- 时间选择器和阈值设置 -->
    <div class="time-selector flex" style="align-items: center;">
      <el-date-picker
        v-model="dateRange"
        type="datetimerange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        @change="handleDateRangeChange"
        :clearable="false"
        style="width: 400px; flex-grow: 0;"
      />
      <span class="tip">过滤天窗时间：</span>
      <el-time-picker
        v-model="startTime"
        format="HH:mm"
        value-format="HH:mm"
        placeholder="开始时间"
        style="width: 100px; flex-grow: 0;"
      />
      <span class="time-separator tip">至</span>
      <el-time-picker
        v-model="endTime"
        format="HH:mm"
        value-format="HH:mm"
        placeholder="结束时间"
        style="width: 100px; flex-grow: 0;"
      />
      <el-button 
        type="primary" 
        @click="loadData"
        :disabled="tableData.length === 0"
      >
        查询
      </el-button>
      <el-button 
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
      class="mt-2"
      v-loading="loading"
      height="80vh"
      empty-text="暂无数据"
      :span-method="spanMethod"
    >
      <el-table-column prop="stationName" label="站点" min-width="120" />
      <el-table-column prop="switchName" label="转辙机" min-width="120" />
      <el-table-column prop="total" label="扳动总次数" />
      <el-table-column prop="reverse" label="定到反" />
      <el-table-column prop="fixed" label="反到定" />
      <el-table-column prop="unknown" label="未识别">
        <template #default="scope">
          {{ scope.row.unknown }}
          <el-icon @click="handleUnknownClick(scope.row)" v-if="scope.row.unknown != '-' && scope.row.unknownList && scope.row.unknownList.length > 0"><View /></el-icon>
        </template>
      </el-table-column>
      <el-table-column prop="filterSkylight" label="过滤天窗未识别" />
      <el-table-column prop="actual" label="实际未识别" />
      <el-table-column prop="percent" label="百分比" />
    </el-table>

    <!-- 未识别数据弹窗 -->
    <el-dialog
      v-model="unknownDialogVisible"
      :title="`${currentUnknownRow?.stationName || ''} - ${currentUnknownRow?.switchName || ''} - 未识别数据详情`"
      width="80%"
      :before-close="handleDialogClose"
    >
      <div class="unknown-dialog-container">
        <!-- 左侧时间列表 -->
        <div class="time-list-panel">
          <el-table
            :data="filteredUnknownList"
            border
            stripe
            class="time-list-table"
            @row-click="handleTimeItemClick"
            height="100%"
          >
            <el-table-column prop="time" label="时间" />
          </el-table>
        </div>
        <!-- 右侧图表区域 -->
        <div class="chart-panel">
          <div class="chart-content">
            <div v-if="!selectedUnknownItem" class="chart-placeholder">
              请选择左侧的时间项查看电流曲线
            </div>
            <div v-else class="chart-wrapper">
              <Echarts :options="chartOptions" :height="'100%'" />
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Download, View } from '@element-plus/icons-vue';
import { useStationStore } from '@/store/modules/station';
import { requestEPCurrentList, requestEPCurrentCurve } from '@/api/action';
import { requestGapZzjList } from '@/api/mo';
import { formatToDateTimeRange } from '@/utils/dateUtil';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
// 导入Echarts组件
import Echarts from '@/components/Echarts/index.vue';

const stationStore = useStationStore();

// 响应式数据
const loading = ref(false);
// 设置默认日期范围为当天
// const dateRange = ref([dayjs().format('YYYY-MM-DD 00:00:00'), dayjs().add(1, 'day').format('YYYY-MM-DD 00:00:00')]);
const dateRange = ref(['2025-10-15 00:00:00', '2025-10-15 23:59:59']);
const startTime = ref('23:40'); // 开始时间
const endTime = ref('04:00'); // 结束时间
const tableData = ref([]);

// 未识别数据弹窗相关
const unknownDialogVisible = ref(false);
const currentUnknownRow = ref(null);
const filteredUnknownList = ref([]);
const selectedUnknownItem = ref(null);
const chartOptions = ref({}); // 图表配置选项

// 获取所有站点
const allStations = computed(() => stationStore.getAllStations);

// 处理日期范围变化
const handleDateRangeChange = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    loadData();
  }
};

// 处理未识别点击事件
const handleUnknownClick = (row) => {
  if (row.unknownList && row.unknownList.length > 0) {
    currentUnknownRow.value = row;
    // 过滤未识别数据列表
    filteredUnknownList.value = row.unknownList.map(item => ({
      time: item.time,
      move_direct: item.move_direct || '-',
      p: item.p || '-' // 假设数据中有电流值p字段
    }));
    selectedUnknownItem.value = null; // 重置选中项
    chartOptions.value = {}; // 重置图表选项
    unknownDialogVisible.value = true;
  }
};

// 处理时间项点击
const handleTimeItemClick = async (row) => {
  if (!currentUnknownRow.value) return;
  
  selectedUnknownItem.value = row;
  
  try {
    // 调用电流曲线接口获取数据
    const response = await requestEPCurrentCurve(currentUnknownRow.value.ip, {
      tag: `${currentUnknownRow.value.tag}`,
      time: row.time
    });
    
    if (response?.result && response.result.length > 0) {
      // 处理多条曲线数据
      updateChartOptions(response.result);
    }
  } catch (error) {
    console.error('获取电流曲线数据失败:', error);
    ElMessage.error('获取电流曲线数据失败');
  }
};

// 更新图表选项
const updateChartOptions = (curveDataList) => {
  if (!curveDataList || curveDataList.length === 0) {
    chartOptions.value = {};
    return;
  }
  
  // 获取第一条数据作为基准计算x轴
  const firstCurve = curveDataList[0].curve;
  const { interval, pt } = firstCurve;
  const xAxisData = pt.map((_, index) => (index * interval) / 1000); // 转换为秒
  console.log(xAxisData)
  // 准备多条曲线的数据
  const series = curveDataList.map((item, index) => {
    // 从tag中提取曲线名称，例如从"W118#.W118#J2.电参数.Ia"中提取"Ia"
    const tagParts = item.tag.split('.');
    const curveName = tagParts[tagParts.length - 1] || `曲线${index + 1}`;
    
    // 使用不同的颜色表示不同的曲线
    const colors = ['#409eff', '#67c23a', '#e6a23c'];
    const curveColor = colors[index % colors.length];
    
    return {
      name: curveName,
      data: item.curve.pt,
      type: 'line',
      smooth: true,
      lineStyle: {
        color: curveColor
      },
      itemStyle: {
        color: curveColor
      }
    };
  });
  
  // 设置图表选项
  chartOptions.value = {
    title: {
      text: `电流曲线图 - ${selectedUnknownItem.value.time}`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        let result = `时间: ${params[0].axisValue}s<br/>`;
        params.forEach(param => {
          result += `${param.marker}${param.seriesName}: ${param.value}A<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: series.map(s => s.name),
      top: '10%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      name: '时间 (s)',
      nameLocation: 'middle',
      nameGap: 30
    },
    yAxis: {
      type: 'value',
      name: '电流值 (A)',
      nameLocation: 'middle',
      nameGap: 50
    },
    series: series
  };
};

// 处理弹窗关闭
const handleDialogClose = () => {
  unknownDialogVisible.value = false;
  currentUnknownRow.value = null;
  filteredUnknownList.value = [];
  selectedUnknownItem.value = null;
  chartOptions.value = {}; // 清空图表选项
};

// 判断时间是否在排除范围内
const isTimeInRange = (timeStr, startRange, endRange) => {
  if (!startRange || !endRange) {
    return false;
  }
  
  const [startHour, startMinute] = startRange.split(':').map(Number);
  const [endHour, endMinute] = endRange.split(':').map(Number);
  const currentTime = dayjs(timeStr);
  const currentHour = currentTime.hour();
  const currentMinute = currentTime.minute();
  
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  const startTimeMinutes = startHour * 60 + startMinute;
  const endTimeMinutes = endHour * 60 + endMinute;
  
  // 处理跨天的情况
  if (startTimeMinutes > endTimeMinutes) {
    return currentTotalMinutes >= startTimeMinutes || currentTotalMinutes <= endTimeMinutes;
  }
  
  return currentTotalMinutes >= startTimeMinutes && currentTotalMinutes <= endTimeMinutes;
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
  if (!dateRange.value || dateRange.value.length !== 2) {
    ElMessage.warning('请选择日期范围');
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
            // 获取阻力详细数据
            const listResponse = await requestEPCurrentList(station.ip, {
              tag: [`${zzj.tag}.电参数.p`],
              time: formatToDateTimeRange(dateRange.value)
            });
            
            const allData = listResponse?.result || [];
            let reverseCount = 0;
            let fixedCount = 0;
            let unknownCount = 0;
            let skylightUnknownCount = 0;
            let unknownList = []
            
            allData.forEach(item => {
              if (item.move_direct === 0) {
                reverseCount++;
              } else if (item.move_direct === 1) {
                fixedCount++;
              } else {
                unknownCount++;
                unknownList.push(item)
                if (isTimeInRange(item.time, startTime.value, endTime.value)) {
                  console.log(item.time, startTime.value, endTime.value)
                  skylightUnknownCount++;
                }
              }
            });
            
            const totalCount = allData.length;
            const filterSkylightCount = unknownCount - skylightUnknownCount;
            
            const actualUnknown = filterSkylightCount;
            const percent = totalCount > 0 ? ((actualUnknown / totalCount) * 100).toFixed(2) : '0.00';
            
            results.push({
              stationName: station.stationName,
              ip: station.ip,
              switchName: zzj.name,
              tag: zzj.tag,
              total: totalCount || '-',
              reverse: reverseCount || '-',
              fixed: fixedCount || '-',
              unknown: unknownCount || '-',
              filterSkylight: filterSkylightCount,
              actual: actualUnknown || '-',
              percent: percent + '%',
              unknownList
            });
          } catch (error) {
            console.error(`获取 ${station.stationName} ${zzj.name} 电参数-电流数据失败:`, error);
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
      ElMessage.info('该日期范围暂无数据');
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
        '总次数': row.total,
        '定到反': row.reverse,
        '反到定': row.fixed,
        '未识别': row.unknown,
        '过滤天窗未识别': row.filterSkylight,
        '实际未识别': row.actual,
        '占比': row.percent,
      };
    });

    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(exportData);

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '动作曲线-电流扳动统计');

    // 生成文件名
    const fileName = `动作曲线-电流扳动统计_${dateRange.value[0]}_to_${dateRange.value[1]}_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
    
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
/* 未识别数据弹窗样式 */
.unknown-dialog-container {
  display: flex;
  gap: 20px;
  width: 100%;
  height: 600px;
}

.time-list-panel {
  width: 220px;
  border-right: 1px solid #dcdfe6;
}

.chart-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.time-list-table {
  height: 100%;
}

.time-list-table .el-table__row {
  cursor: pointer;
}

.time-list-table .el-table__row:hover {
  background-color: #f5f7fa;
}

.chart-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chart-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.chart-wrapper {
  flex: 1;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 4px;
  min-height: 400px;
}

/* 确保弹窗在窗口大小变化时正确调整 */
.el-dialog__body {
  padding: 20px;
}

/* 优化表格样式 */
.time-list-table .el-table__header-wrapper {
  background-color: #f5f7fa;
}

.time-list-table .el-table__header th {
  font-weight: 500;
  color: #303133;
}

.time-list-table .el-table__body tr.current-row {
  background-color: #ecf5ff;
}

.time-list-table .el-table__body tr.hover-row.current-row {
  background-color: #ecf5ff;
}
</style>
