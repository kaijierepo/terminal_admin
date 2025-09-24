<template>
  <div class="alarm-table-container">
    <!-- 筛选条件区域 -->
    <div class="filter-section">
      <!-- 第一行筛选条件 -->
      <div class="filter-row">
        <el-select
          v-model="filters.workshop"
          placeholder="全部车间"
          clearable
          size="small"
        >
          <el-option
            v-for="workshop in workshopOptions"
            :key="workshop.value"
            :label="workshop.label"
            :value="workshop.value"
          />
        </el-select>
        <el-select
          v-model="filters.station"
          placeholder="所有站点"
          clearable
          size="small"
        >
          <el-option
            v-for="station in stationOptions"
            :key="station.value"
            :label="station.label"
            :value="station.value"
          />
        </el-select>

        <el-select
          v-model="filters.device"
          placeholder="所有设备"
          clearable
          size="small"
        >
          <el-option
            v-for="device in deviceOptions"
            :key="device.value"
            :label="device.label"
            :value="device.value"
          />
        </el-select>

        <el-select
          v-model="filters.alarmType"
          placeholder="所有报警类型"
          clearable
          size="small"
        >
          <el-option
            v-for="type in alarmTypeOptions"
            :key="type.value"
            :label="type.label"
            :value="type.value"
          />
        </el-select>

        <el-select
          v-model="filters.collection"
          placeholder="全部采集..."
          clearable
          size="small"
        >
          <el-option
            v-for="collection in collectionOptions"
            :key="collection.value"
            :label="collection.label"
            :value="collection.value"
          />
        </el-select>

        <el-select v-model="filters.isRecover" placeholder="全部" size="small">
          <el-option label="全部" value="" />
          <el-option label="恢复" value="recover" />
          <el-option label="未恢复" value="unrecover" />
        </el-select>

        <el-select v-model="filters.alarmLevel" placeholder="全部" size="small">
          <el-option label="全部" value="" />
          <el-option label="告警" value="告警" />
          <el-option label="预警" value="预警" />
        </el-select>
      </div>

      <!-- 第二行筛选条件 -->
      <div class="filter-row">
        <el-input
          v-model="filters.keyword"
          placeholder="筛选 (空格隔开,自由组合条件)"
          clearable
          size="small"
          class="keyword-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <div class="date-filter">
          <span class="date-label">筛选日期:</span>
          <el-date-picker
            v-model="filters.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            size="small"
            class="date-picker"
          />
        </div>

        <el-checkbox v-model="filters.disableVoiceAlarm" size="small">
          取消天窗内语音报警
        </el-checkbox>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        size="small"
        :data="alarmData"
        stripe
        border
        height="600"
        v-loading="loading"
        :row-class-name="getRowClassName"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column prop="number" label="编号" width="80" align="center" />

        <el-table-column prop="stationName" label="站点名称" width="120" />

        <el-table-column prop="tag" label="设备" width="100" />

        <el-table-column prop="alarmType" label="报警类型" width="120" />

        <el-table-column prop="acqType" label="采集方式" width="100" />

        <el-table-column
          prop="dirType"
          label="定反位"
          width="80"
          align="center"
        />

        <el-table-column prop="desc" label="报警描述" min-width="150" />

        <el-table-column
          prop="temperature"
          label="温度/24h最小/最大"
          width="180"
          align="center"
        >
        </el-table-column>

        <el-table-column prop="time" label="报警时间" width="160" />

        <el-table-column label="恢复状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.restoeTime ? 'success' : 'danger'">
              {{ row.restoeTime ? "已恢复" : "未恢复" }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="restoreVal" label="报警恢复值" width="120" />

        <el-table-column
          prop="restoreTemperature"
          label="温度/24h最小/最大"
          width="180"
          align="center"
        >
        </el-table-column>

        <el-table-column
          prop="restoeTime"
          label="恢复时间"
          width="180"
          align="center"
        >
        </el-table-column>
      </el-table>
    </div>

    <!-- 底部状态和操作按钮 -->
    <div class="footer-section">
      <div class="status-info">
        <span>当前告警条数{{ alarmCount }}条,预警条数{{ warningCount }}条</span>
      </div>

      <div class="action-buttons">
        <el-button type="primary" size="small" @click="showHistoryAlarms">
          历史报警
        </el-button>
        <el-button type="warning" size="small" @click="testVoiceAlarm">
          测试语音报警
        </el-button>
        <el-button size="small" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button
          type="success"
          size="small"
          :disabled="selectedRows.length === 0"
          @click="batchConfirm"
        >
          批量确认
        </el-button>
        <el-button type="info" size="small" @click="exportData">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button type="warning" size="small" @click="muteAlarm">
          消音
        </el-button>
        <el-button type="danger" size="small" @click="closePage">
          关闭
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Refresh, Download } from "@element-plus/icons-vue";
import dayjs from "dayjs";

const props = defineProps({
  alarmData: {
    type: Array,
    default: () => [],
  },
  stationTree: {
    type: Array,
    default: () => [],
  },
});

// 响应式数据
const loading = ref(false);
const selectedRows = ref([]);

// 筛选条件
const filters = reactive({
  workshop: "",
  station: "",
  device: "",
  alarmType: "",
  collection: "",
  isRecover: "",
  alarmLevel: "",
  keyword: "",
  dateRange: [],
  disableVoiceAlarm: false,
});

// 选项数据 - 车间选项使用动态数据
const workshopOptions = computed(() => {
  const options = [{ label: "全部车间", value: "" }];

  // 添加从站点树提取的车间
  stationList.value.forEach((workshop) => {
    options.push({
      label: `${workshop.label}`,
      value: workshop.value,
    });
  });

  return options;
});

// 根据选择的车间筛选对应的站点
const stationOptions = computed(() => {
  const stations = [{ label: "所有站点", value: "" }];

  // 如果没有选择车间，显示所有站点
  if (!filters.workshop) {
    props.stationTree.forEach((line) => {
      if (line.children && Array.isArray(line.children)) {
        line.children.forEach((workshop) => {
          if (workshop.children && Array.isArray(workshop.children)) {
            workshop.children.forEach((station) => {
              stations.push({
                label: `${station.name}`,
                value: station.id,
                station: station,
              });
            });
          }
        });
      }
    });
  } else {
    // 如果选择了车间，只显示该车间的站点
    props.stationTree.forEach((line) => {
      if (line.children && Array.isArray(line.children)) {
        line.children.forEach((workshop) => {
          // 找到匹配的车间
          if (workshop.id === filters.workshop) {
            if (workshop.children && Array.isArray(workshop.children)) {
              workshop.children.forEach((station) => {
                stations.push({
                  label: `${station.name}`,
                  value: station.id,
                  station: station,
                });
              });
            }
          }
        });
      }
    });
  }

  console.log("当前车间筛选:", filters.workshop);
  console.log("筛选出的站点:", stations);
  return stations;
});

// 监听车间选择变化，自动清空站点选择
watch(
  () => filters.workshop,
  (newWorkshop, oldWorkshop) => {
    if (newWorkshop !== oldWorkshop) {
      filters.station = ""; // 清空站点选择
      console.log("车间选择改变，已清空站点选择");
    }
  }
);

const deviceOptions = ref([
  { label: "所有设备", value: "" },
  { label: "设备A", value: "device_a" },
  { label: "设备B", value: "device_b" },
  { label: "设备C", value: "device_c" },
]);

const alarmTypeOptions = ref([
  { label: "所有报警类型", value: "" },
  { label: "告警", value: "告警" },
  { label: "预警", value: "预警" },
]);

const collectionOptions = ref([
  { label: "全部采集", value: "" },
  { label: "周期采集", value: "周期" },
  { label: "扳动采集", value: "扳动" },
  { label: "过车采集", value: "过车" },
]);

// 从站点树结构中提取所有车间（第二层节点）
const stationList = computed(() => {
  const workshops = [];

  // 遍历所有线路（第一层）
  props.stationTree.forEach((line) => {
    // 获取每个线路下的车间（第二层）
    if (line.children && Array.isArray(line.children)) {
      line.children.forEach((workshop) => {
        workshops.push({
          label: workshop.name,
          value: workshop.id,
          lineName: line.name, // 保留线路信息
          workshop: workshop,
        });
      });
    }
  });

  console.log("提取的车间列表:", workshops);
  return workshops;
});

// 响应式报警数据
const alarmData = computed(() => {
  console.log("AlarmtTable 接收到新数据:", props.alarmData, filters.alarmLevel);

  // 过滤恢复状态
  const isRecover = (item, type) => {
    if (type === "recover") {
      return item.restoeTime ? true : false;
    } else if (type === "unrecover") {
      return item.restoeTime ? false : true;
    }
    return true;
  };

  // 过滤采集类型
  const isCollection = (item, type) => {
    if (type === "周期") {
      return item.acqType.indexOf("周期") !== -1;
    } else if (type === "扳动") {
      return item.acqType.indexOf("扳动") !== -1;
    } else if (type === "过车") {
      return item.acqType.indexOf("过车") !== -1;
    }
    return true;
  };

  // 看是否在目标时间段内
  const isInTimeRange = (item, timeRange) => {
    if (Array.isArray(timeRange) && timeRange.length === 2) {
      const itemTime = dayjs(item.time);
      const startTime = dayjs(timeRange[0]);
      const endTime = dayjs(timeRange[1]);
      return itemTime.isAfter(startTime) && itemTime.isBefore(endTime);
    }

    return true;
  };

  // 过滤站点
  const isStation = (item, station) => {
    // 如果选择了具体站点，直接匹配
    if (filters.station) {
      const match = item.stationName === station;
      console.log(`站点筛选: ${item.stationName} === ${station} = ${match}`);
      return match;
    }
    
    // 如果选择了车间但没有选择具体站点，判断站点是否属于该车间
    if (filters.workshop) {
      // 从站点树中找到该车间下的所有站点
      const workshopStations = [];
      props.stationTree.forEach(line => {
        if (line.children && Array.isArray(line.children)) {
          line.children.forEach(workshop => {
            if (workshop.id === filters.workshop) {
              if (workshop.children && Array.isArray(workshop.children)) {
                workshop.children.forEach(station => {
                  workshopStations.push(station.name);
                });
              }
            }
          });
        }
      });
      
      // 判断当前告警数据的站点是否在该车间的站点列表中
      const match = workshopStations.includes(item.stationName);
      console.log(`车间筛选: 车间ID=${filters.workshop}, 车间站点=${workshopStations}, 当前站点=${item.stationName}, 匹配=${match}`);
      return match;
    }
    
    // 如果既没有选择车间也没有选择站点，显示所有
    console.log('无车间和站点筛选，显示所有');
    return true;
  };

  const result = props.alarmData
    .filter(
      (item) =>
        item.alarmType.includes(filters.alarmLevel) &&
        isRecover(item, filters.isRecover) &&
        isCollection(item, filters.collection) &&
        isInTimeRange(item, filters.dateRange) && 
        isStation(item, filters.station)
    )
    .map((item, index) => ({ ...item, number: index + 1 }));

  console.log("筛选后结果数量:", result.length);
  return result;
});

// 计算属性
const alarmCount = computed(() => alarmData.value.length);
const warningCount = computed(
  () => alarmData.value.filter((item) => item.alarmType.includes("预警")).length
);

// 方法
const handleSelectionChange = (selection) => {
  selectedRows.value = selection;
};

// 根据告警类型设置行样式
const getRowClassName = ({ row, rowIndex }) => {
  console.log("行数据:", row);
  console.log("alarmType值:", row.alarmType);
  console.log("行索引:", rowIndex);

  // 测试：为前两行强制应用样式
  //   if (rowIndex === 0) {
  //     console.log('应用告警样式到第一行');
  //     return 'alarm-row'
  //   } else if (rowIndex === 1) {
  //     console.log('应用预警样式到第二行');
  //     return 'warning-row'
  //   }

  if (row.alarmType.indexOf("告警") !== -1) {
    console.log("应用告警样式");
    return "alarm-row";
  } else if (row.alarmType.indexOf("预警") !== -1) {
    console.log("应用预警样式");
    return "warning-row";
  }
  return "";
};

const getRecoveryStatusType = (status) => {
  switch (status) {
    case "已恢复":
      return "success";
    case "未恢复":
      return "danger";
    default:
      return "info";
  }
};

const showHistoryAlarms = () => {
  ElMessage.info("打开历史报警页面");
};

const testVoiceAlarm = () => {
  ElMessage.success("语音报警测试成功");
};

const refreshData = async () => {
  loading.value = true;
  try {
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ElMessage.success("数据刷新成功");
  } catch (error) {
    ElMessage.error("数据刷新失败");
  } finally {
    loading.value = false;
  }
};

const batchConfirm = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请选择要确认的报警项");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要批量确认选中的 ${selectedRows.value.length} 条报警信息吗？`,
      "批量确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    // 模拟确认操作
    ElMessage.success(`成功确认 ${selectedRows.value.length} 条报警信息`);
    selectedRows.value = [];
  } catch {
    ElMessage.info("已取消确认");
  }
};

const exportData = () => {
  ElMessage.success("数据导出成功");
};

const muteAlarm = () => {
  ElMessage.info("已消音");
};

const closePage = () => {
  ElMessage.info("关闭页面");
};

// 生命周期
onMounted(() => {
  // 初始化数据
  console.log("报警表格组件已加载");
});
</script>

<style scoped lang="scss">
.alarm-table-container {
  background: #fff;
  min-height: 600px;
}

// 告警行样式 - 红色文字
:deep(.alarm-row) {
  color: #f56c6c !important;

  td {
    color: #f56c6c !important;
  }

  .el-checkbox__label {
    color: #f56c6c !important;
  }
}

// 预警行样式 - 黄色文字
:deep(.warning-row) {
  color: #e6a23c !important;

  td {
    color: #e6a23c !important;
  }

  .el-checkbox__label {
    color: #e6a23c !important;
  }
}

.page-header {
  margin-bottom: 20px;

  h2 {
    margin: 0;
    color: #303133;
    font-size: 20px;
    font-weight: 600;
  }
}

.filter-section {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;

  .filter-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }

    .el-select {
      width: 140px;
    }

    .keyword-input {
      width: 300px;
    }

    .date-filter {
      display: flex;
      align-items: center;
      gap: 8px;

      .date-label {
        color: #606266;
        font-size: 14px;
        white-space: nowrap;
      }

      .date-picker {
        width: 350px;
      }
    }
  }
}

.table-section {
  margin-bottom: 20px;

  .temperature-info {
    text-align: center;

    .current-temp {
      font-weight: 600;
      color: #303133;
      margin-bottom: 4px;
    }

    .temp-range {
      font-size: 12px;
      color: #909399;
    }
  }
}

.footer-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid #e4e7ed;

  .status-info {
    color: #606266;
    font-size: 14px;
  }

  .action-buttons {
    display: flex;
    gap: 8px;

    .el-button {
      margin: 0;
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .filter-section .filter-row {
    flex-wrap: wrap;

    .el-select {
      width: 120px;
    }

    .keyword-input {
      width: 250px;
    }

    .date-filter .date-picker {
      width: 300px;
    }
  }

  .footer-section {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;

    .action-buttons {
      justify-content: center;
      flex-wrap: wrap;
    }
  }
}

@media (max-width: 768px) {
  .alarm-table-container {
    padding: 12px;
  }

  .filter-section {
    padding: 12px;

    .filter-row {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;

      .el-select,
      .keyword-input,
      .date-filter .date-picker {
        width: 100%;
      }
    }
  }

  .table-section {
    overflow-x: auto;
  }

  .action-buttons {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}
</style>
