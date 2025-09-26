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
          v-model.trim="filters.keyword"
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

        <!-- <el-checkbox v-model="filters.disableVoiceAlarm" size="small">
          取消天窗内语音报警
        </el-checkbox> -->
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        size="small"
        :data="alarmData"
        stripe
        border
        height="400"
        v-loading="loading"
        @row-click="handleRowClick"
        :row-class-name="getRowClassName"
        @selection-change="handleSelectionChange"
        :lazy="true"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column type="selection" width="30" />

        <el-table-column prop="number" label="编号" width="50" align="center" />

        <el-table-column prop="stationName" label="站点名称" width="120" show-overflow-tooltip />

        <el-table-column prop="tag" label="设备" width="150" show-overflow-tooltip />

        <el-table-column label="报警类型" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getAlarmTypeDisplay(row) }}
          </template>
        </el-table-column>

        <el-table-column prop="acqtype" label="采集方式" width="100" show-overflow-tooltip />

        <el-table-column
          prop="objstatus"
          label="定反位"
          width="80"
          align="center"
          show-overflow-tooltip
        />

        <el-table-column prop="desc" label="报警描述" min-width="150" show-overflow-tooltip />

        <!-- <el-table-column
          prop="temperature"
          label="温度/24h最小/最大"
          width="180"
          align="center"
        >
        </el-table-column> -->

        <el-table-column prop="time" label="报警时间" width="160" />

        <el-table-column label="恢复状态" width="100" align="center" >
          <template #default="{ row }">
            <el-tag :type="row.isRecover ? 'success' : 'danger'">
              {{ row.isRecover ? "已恢复" : "未恢复" }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- <el-table-column prop="restoreVal" label="报警恢复值" width="120" /> -->

        <!-- <el-table-column
          prop="restoreTemperature"
          label="温度/24h最小/最大"
          width="180"
          align="center"
        >
        </el-table-column> -->

        <el-table-column
          prop="restoeTime"
          label="恢复时间"
          width="180"
          align="center"
        >
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button
              type="text"
              size="small"
              @click.stop="handleAckAlarm(row, requestAckAlarm)"
            >
              确认
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页组件 -->
      <div class="pagination-section">
        <el-pagination
          size="small"
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalItems"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
          background
          class="pagination"
        />
      </div>
    </div>

    <!-- 底部状态和操作按钮 -->
    <div class="footer-section">
      <div class="status-info">
        <!-- <span>总告警条数{{ alarmCount }}条,预警条数{{ warningCount }}条 (当前页显示{{ alarmData.length }}条)</span>
        <span v-if="renderTime > 0" class="performance-info">
          渲染耗时: {{ renderTime.toFixed(2) }}ms
        </span> -->
      </div>

      <div class="action-buttons">
        <!-- <el-button type="primary" size="small" @click="showHistoryAlarms">
          历史报警
        </el-button> -->
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
        <!-- <el-button type="info" size="small" @click="exportData">
          <el-icon><Download /></el-icon>
          导出
        </el-button> -->
        <el-button type="warning" size="small" @click="muteAlarm">
          消音
        </el-button>
        <el-button type="danger" size="small" @click="closePage">
          关闭
        </el-button>
      </div>
    </div>

    <el-dialog
      v-model="ackDialogVisible"
      title="确认报警"
      width="400px"
      :append-to-body="true"
      :z-index="3000"
      class="ack-dialog"
    >
      <div class="ack-dialog-content">
        <div class="alarm-info-section">
          <h4 class="section-title">报警信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">报警设备:</span>
              <span class="info-value">{{ ackRow?.tag }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">报警时间:</span>
              <span class="info-value">{{ ackRow?.time }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">报警类型:</span>
              <span class="info-value alarm-type">{{ ackRow?.type }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">报警描述:</span>
              <span class="info-value">{{ ackRow?.desc }}</span>
            </div>
            <!-- <div class="info-item" v-if="ackRow?.restoreVal">
              <span class="info-label">报警恢复值:</span>
              <span class="info-value">{{ ackRow?.restoreVal }}</span>
            </div> -->
            <div class="info-item" v-if="ackRow?.recoverTime">
              <span class="info-label">报警恢复时间:</span>
              <span class="info-value">{{ ackRow?.recoverTime }}</span>
            </div>
          </div>
        </div>

        <div class="confirm-section">
          <h4 class="section-title">确认信息</h4>
          <el-input
            type="textarea"
            v-model="ackInfo"
            placeholder="请输入确认信息（可选）"
            :rows="3"
            maxlength="200"
            show-word-limit
            class="confirm-textarea"
          />
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="ackDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmAck">确认报警</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 设备监控对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="90vw"
      height="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
      :before-close="closeDialog"
      class="device-monitor-dialog"
    >
      <div class="iframe-container">
        <iframe
          v-if="dialogUrl"
          :src="dialogUrl"
          frameborder="0"
          class="device-iframe"
        ></iframe>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Refresh, Download } from "@element-plus/icons-vue";
import dayjs from "dayjs";
import { useAlarmStore } from "@/store/modules/alarm";

const props = defineProps({
  alarmData: {
    type: Array,
    default: () => [],
  },
  stationTree: {
    type: Array,
    default: () => [],
  },
  requestAckAlarm: {
    type: Function,
    default: () => {},
  },
});

const emit = defineEmits(["close-page", "remove-confirmed-alarms"]);

// 响应式数据
const loading = ref(false);
const selectedRows = ref([]);

// 分页相关数据
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);

// 性能监控
const renderStartTime = ref(0);
const renderEndTime = ref(0);
const renderTime = computed(() => renderEndTime.value - renderStartTime.value);

// 初始化 alarmStore
const alarmStore = useAlarmStore();

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

// 对话框状态
const dialogVisible = ref(false);
const dialogUrl = ref("");
const dialogTitle = ref("");

// 报警确认信息
const ackDialogVisible = ref(false);
const ackRow = ref(null);
const ackInfo = ref("");

const handleRowClick = (row) => {
  if (row.url) {
    // 设置对话框标题（可配置）
    dialogTitle.value = `缺口历史记录 - ${row.stationName || "未知站点"}`;
    dialogUrl.value = row.url;
    dialogVisible.value = true;
  }
};

// 关闭对话框
const closeDialog = () => {
  dialogVisible.value = false;
  dialogUrl.value = "";
};

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

// 基于 alarmData 动态生成设备选项
const deviceOptions = computed(() => {
  const options = [{ label: "全部设备", value: "" }];

  if (props.alarmData && props.alarmData.length > 0) {
    // 获取所有唯一的 stationName + tag 组合
    const uniqueDevices = [
      ...new Set(
        props.alarmData
          .filter((item) => item.stationName && item.tag) // 过滤掉空值
          .map((item) => ({
            label: `${item.stationName}.${item.tag}`,
            value: `${item.stationName}.${item.tag}`,
            stationName: item.stationName,
            tag: item.tag,
          }))
      ),
    ];

    // 为每个唯一的设备组合创建选项
    uniqueDevices.forEach((device) => {
      options.push({
        label: device.label,
        value: device.value,
      });
    });
  }

  return options;
});

// 基于 alarmData 动态生成报警类型选项
const alarmTypeOptions = computed(() => {
  const options = [{ label: "全部", value: "" }];

  if (props.alarmData && props.alarmData.length > 0) {
    // 获取所有唯一的 alarmType
    const uniqueTypes = [
      ...new Set(props.alarmData.map((item) => item.type).filter(Boolean)),
    ];

    // 为每个唯一的 alarmType 创建选项
    uniqueTypes.forEach((type) => {
      options.push({
        label: type,
        value: type,
      });
    });
  }

  return options;
});

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

// 响应式报警数据（原始数据，用于分页前的筛选）
const filteredAlarmData = computed(() => {
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
      return item.acqtype.indexOf("周期") !== -1;
    } else if (type === "扳动") {
      return item.acqtype.indexOf("扳动") !== -1;
    } else if (type === "过车") {
      return item.acqtype.indexOf("过车") !== -1;
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
      props.stationTree.forEach((line) => {
        if (line.children && Array.isArray(line.children)) {
          line.children.forEach((workshop) => {
            if (workshop.id === filters.workshop) {
              if (workshop.children && Array.isArray(workshop.children)) {
                workshop.children.forEach((station) => {
                  workshopStations.push(station.name);
                });
              }
            }
          });
        }
      });

      // 判断当前告警数据的站点是否在该车间的站点列表中
      const match = workshopStations.includes(item.stationName);
      console.log(
        `车间筛选: 车间ID=${filters.workshop}, 车间站点=${workshopStations}, 当前站点=${item.stationName}, 匹配=${match}`
      );
      return match;
    }

    // 如果既没有选择车间也没有选择站点，显示所有
    console.log("无车间和站点筛选，显示所有");
    return true;
  };

  const isAlarmType = (item) => {
    return item.type.includes(filters.alarmType);
  };

  const isDevice = (item) => {
    if (!filters.device) return true;

    const deviceKey = `${item.stationName}.${item.tag}`;
    return deviceKey === filters.device;
  };

  // 扁平化树结构后查找
  const flattenStationTree = (nodes) => {
    if (!nodes || !Array.isArray(nodes)) return [];

    const result = [];
    for (const node of nodes) {
      // 如果是站点节点（有IP或port字段），添加到结果中
      if (node.ip || node.port) {
        result.push({
          name: node.name,
          ip: node.ip || null,
          port: node.port || 81,
        });
      }

      // 递归处理子节点
      if (node.children && Array.isArray(node.children)) {
        result.push(...flattenStationTree(node.children));
      }
    }
    return result;
  };

  // 创建站点信息映射表（缓存优化）
  const stationInfoMap = computed(() => {
    const flattened = flattenStationTree(props.stationTree);
    const map = new Map();
    flattened.forEach((station) => {
      map.set(station.name, {
        ip: station.ip,
        port: station.port,
      });
    });
    return map;
  });

  // 根据stationName获取对应的站点信息（ip和port）
  const getStationInfo = (stationName) => {
    if (!stationName || !props.stationTree) return { ip: null, port: 81 };

    // 使用缓存映射表快速查找
    return stationInfoMap.value.get(stationName) || { ip: null, port: 81 };
  };

  const isKeyword = (item) => {
    const keywords = filters.keyword.split(",");
    return keywords.some(
      (keyword) =>
        item.type.includes(keyword) ||
        item.desc.includes(keyword) ||
        item.tag.includes(keyword)
    );
  };

  const result = props.alarmData
    .filter(
      (item) =>
        item.type.includes(filters.alarmLevel) &&
        isRecover(item, filters.isRecover) &&
        isCollection(item, filters.collection) &&
        isInTimeRange(item, filters.dateRange) &&
        isStation(item, filters.station) &&
        isAlarmType(item) &&
        isDevice(item) &&
        isKeyword(item)
    )
    .slice()
    .sort((a, b) => {
      // 按时间降序排序（最新的在前）
      const timeA = dayjs(a.time).valueOf();
      const timeB = dayjs(b.time).valueOf();
      return timeB - timeA;
    })
    .map((item, index) => {
      const stationInfo = getStationInfo(item.stationName);
      const zzjTag = item.tag.split(".").pop();
      return {
        ...item,
        number: index + 1,
        ip: stationInfo.ip,
        port: stationInfo.port,
        ...(item.type.includes("缺口")
          ? {
              url: `http://${stationInfo.ip}:${
                stationInfo.port
              }/app/gapHistPic/index.html?ip=${stationInfo.ip}&staion=${
                item.stationName
              }&port=${stationInfo.port}&name=${zzjTag}&time=${Math.floor(
                dayjs(item.time).valueOf() / 1000
              )}&userlevel=3`,
            }
          : {}),
      };
    });

  console.log("筛选后结果数量:", result.length);
  return result;
});

// 分页后的数据（用于表格显示）
const alarmData = computed(() => {
  renderStartTime.value = performance.now();
  
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  
  // 更新总数据量
  totalItems.value = filteredAlarmData.value.length;
  
  const result = filteredAlarmData.value.slice(start, end);
  
  // 使用 nextTick 确保 DOM 更新后计算渲染时间
  nextTick(() => {
    renderEndTime.value = performance.now();
    if (renderTime.value > 100) {
      console.warn(`表格渲染耗时: ${renderTime.value.toFixed(2)}ms，数据量: ${result.length}`);
    }
  });
  
  return result;
});

// 计算属性
const alarmCount = computed(() => filteredAlarmData.value.length);
const warningCount = computed(
  () => filteredAlarmData.value.filter((item) => item.type.includes("预警")).length
);

// 获取带消音标记的报警类型显示
const getAlarmTypeDisplay = (alarm) => {
  const baseType = alarm.type || "";

  // 检查是否需要添加消音标记（基于voiceTimestamp）
  if (alarmStore.voiceTimestamp && alarm.time) {
    const alarmTime = dayjs(alarm.time).valueOf();
    if (alarmTime && alarmTime < alarmStore.voiceTimestamp) {
      return `${baseType}(消音)`;
    }
  }

  return baseType;
};

// 方法
const handleSelectionChange = (selection) => {
  selectedRows.value = selection;
};

// 报警确认方法
const handleAckAlarm = (row, requestAckAlarm) => {
  ackRow.value = row;
  ackDialogVisible.value = true;
};

// 确认报警处理
const confirmAck = async () => {
  if (!ackRow.value) return;

  try {
    // 这里调用确认报警的API
    if (props.requestAckAlarm) {
      // const { tag, time } = ackRow.value;
      console.log("ackRow.value", ackRow.value);
      await props.requestAckAlarm(ackRow.value.ip, {
        tag: ackRow.value.tag,
        ackInfo: ackInfo.value,
        time: ackRow.value.time,
        port: ackRow.value.port,
      });
    }

    // 关闭对话框
    ackDialogVisible.value = false;
    ackRow.value = null;
    ackInfo.value = "";

    emit("refresh-data");
    // 可以添加成功提示
    ElMessage.success("报警确认成功");
  } catch (error) {
    console.error("确认报警失败:", error);
    ElMessage.error("确认报警失败");
  }
};

// 根据告警类型设置行样式
const getRowClassName = ({ row, rowIndex }) => {
//   console.log("行数据:", row);
//   console.log("alarmType值:", row.type);
//   console.log("行索引:", rowIndex);

  // 测试：为前两行强制应用样式
  //   if (rowIndex === 0) {
  //     console.log('应用告警样式到第一行');
  //     return 'alarm-row'
  //   } else if (rowIndex === 1) {
  //     console.log('应用预警样式到第二行');
  //     return 'warning-row'
  //   }

  if (row.type.indexOf("告警") !== -1) {
    console.log("应用告警样式");
    return "alarm-row";
  } else if (row.type.indexOf("预警") !== -1) {
    console.log("应用预警样式");
    return "warning-row";
  }
  return "alarm-row";
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
  window.speechAPI.play(
    `现在是北京时间 ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`
  );
};

const refreshData = async () => {
  loading.value = true;
  emit("refresh-data");
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

    // 显示加载状态
    loading.value = true;
    
    // 先立即从本地数据中移除已确认的报警，提供快速响应
    const confirmedItems = [...selectedRows.value];
    const confirmedIds = new Set(confirmedItems.map(item => `${item.stationName}-${item.tag}-${item.time}`));
    
    // 通知父组件移除已确认的报警
    emit("remove-confirmed-alarms", confirmedItems);
    
    // 立即清空选择
    selectedRows.value = [];
    
    // 显示即时反馈
    ElMessage.success(`正在确认 ${confirmedItems.length} 条报警信息...`);
    
    // 创建所有确认请求的Promise数组（后台处理）
    const confirmPromises = confirmedItems.map(item => 
      props.requestAckAlarm(item.ip, {
        tag: item.tag,
        ackInfo: '',
        type: item.type,
        time: item.time,
        port: item.port,
      }).catch(error => {
        console.error(`确认报警失败 - ${item.tag}:`, error);
        return { success: false, error, item };
      })
    );

    // 后台处理确认请求，不阻塞用户界面
    Promise.allSettled(confirmPromises).then(results => {
      // 统计成功和失败的数量
      const successCount = results.filter(result => 
        result.status === 'fulfilled' && !result.value?.error
      ).length;
      const failCount = results.length - successCount;
      
      // 显示最终结果
      if (failCount === 0) {
        ElMessage.success(`成功确认 ${successCount} 条报警信息`);
      } else {
        ElMessage.warning(`确认完成：成功 ${successCount} 条，失败 ${failCount} 条`);
        // 如果有失败的，重新获取数据以确保数据一致性
        emit("refresh-data");
      }
    }).catch(error => {
      console.error('批量确认过程中发生错误:', error);
      ElMessage.error('批量确认过程中发生错误');
      // 发生错误时重新获取数据
      emit("refresh-data");
    });
    
    // 隐藏加载状态
    loading.value = false;
    
  } catch {
    ElMessage.info("已取消确认");
  }
};

const exportData = () => {
  ElMessage.success("数据导出成功");
};

const muteAlarm = () => {
  window.speechAPI.toggleMute();
  ElMessage.info("已消音");
};

const closePage = () => {
  emit("close-page");
  // ElMessage.info("关闭页面");
};

// 分页相关方法
const handlePageChange = (page) => {
  currentPage.value = page;
  console.log('切换到第', page, '页');
};

const handlePageSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1; // 重置到第一页
  console.log('每页显示', size, '条');
};

// 重置分页到第一页
const resetPagination = () => {
  currentPage.value = 1;
};

// 监听筛选条件变化，重置分页
watch(() => [
  filters.workshop,
  filters.station,
  filters.device,
  filters.alarmType,
  filters.collection,
  filters.isRecover,
  filters.alarmLevel,
  filters.keyword,
  filters.dateRange
], () => {
  resetPagination();
}, { deep: true });

// 生命周期
onMounted(() => {
  // 初始化数据
  console.log("报警表格组件已加载");
});

defineExpose({
  loading,
});
</script>

<style scoped lang="scss">
.alarm-table-container {
  background: #fff;
  min-height: 600px;
}

// 确认报警对话框样式
:deep(.ack-dialog) {
  .el-dialog__header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px 24px;
    border-radius: 8px 8px 0 0;

    .el-dialog__title {
      color: white;
      font-weight: 600;
      font-size: 18px;
    }

    .el-dialog__headerbtn {
      .el-dialog__close {
        color: white;
        font-size: 20px;

        &:hover {
          color: #f0f0f0;
        }
      }
    }
  }

  .el-dialog__body {
    padding: 0;
  }

  .el-dialog__footer {
    padding: 16px 24px;
    background: #f8f9fa;
    border-radius: 0 0 8px 8px;
  }
}

.ack-dialog-content {
  padding: 24px;
}

.section-title {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 2px solid #e4e7ed;
  padding-bottom: 8px;
}

.alarm-info-section {
  margin-bottom: 24px;
}

.info-grid {
  display: grid;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #409eff;
  transition: all 0.3s ease;

  &:hover {
    background: #f0f2f5;
    transform: translateX(2px);
  }
}

.info-label {
  font-weight: 600;
  color: #606266;
  min-width: 80px;
  margin-right: 12px;
  flex-shrink: 0;
}

.info-value {
  color: #303133;
  flex: 1;
  word-break: break-all;

  &.alarm-type {
    color: #f56c6c;
    font-weight: 600;
  }
}

.confirm-section {
  .section-title {
    border-bottom-color: #67c23a;
  }
}

.confirm-textarea {
  :deep(.el-textarea__inner) {
    border-radius: 6px;
    border: 2px solid #e4e7ed;
    transition: all 0.3s ease;

    &:focus {
      border-color: #409eff;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  .el-button {
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 500;

    &.el-button--primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;

      &:hover {
        background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
    }
  }
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

.pagination-section {
  display: flex;
  justify-content: center;
  padding: 16px 0;
  border-top: 1px solid #e4e7ed;
  background: #f8f9fa;
  margin-top: 16px;

  .pagination {
    :deep(.el-pagination__total) {
      color: #606266;
      font-weight: 500;
    }

    :deep(.el-pagination__sizes) {
      .el-select .el-input__inner {
        border-radius: 4px;
      }
    }

    :deep(.el-pager li) {
      border-radius: 4px;
      margin: 0 2px;
      
      &.is-active {
        background: #409eff;
        color: white;
      }
    }

    :deep(.btn-prev),
    :deep(.btn-next) {
      border-radius: 4px;
      margin: 0 4px;
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
    display: flex;
    flex-direction: column;
    gap: 4px;

    .performance-info {
      color: #909399;
      font-size: 12px;
      font-style: italic;
    }
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

// 设备监控对话框样式
.device-monitor-dialog {
  :deep(.el-dialog) {
    margin: 5vh auto;
    max-height: 90vh;
  }

  :deep(.el-dialog__body) {
    padding: 0;
    height: 80vh;
  }

  .iframe-container {
    width: 100%;
    height: 600px;
    position: relative;
  }

  .device-iframe {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
  }
}
</style>
