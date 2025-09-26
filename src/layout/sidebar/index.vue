<script setup lang="tsx">
import { ref, onMounted, computed, watch } from "vue";
import { getStationList } from "@/api/config";
import StationTree from "@/components/StationTree/index.vue";
import AlarmtTable from "@/components/AlarmtTable/index.vue";
import digTree from "./config";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import { requestUnackAlarmList, requestAckAlarm } from "@/api/alarm";
import { BellFilled } from "@element-plus/icons-vue";
import { useAlarmStore } from "@/store/modules/alarm";
import { useWebSocketManager } from "@/mixins/websocketManager";
import { useWebSocketDebug } from "@/mixins/websocketDebug";

// 定义组件事件
const emit = defineEmits([
  "station-select",
  "station-connect",
  "node-expand",
  "sidebar-toggle",
]);

// 使用报警 store
const alarmStore = useAlarmStore();

// 初始化 WebSocket 调试工具
const { testConnection, diagnoseConnection, checkNetworkConnection } = useWebSocketDebug();

// 初始化 WebSocket 管理器
const {
  socketInstances,
  connectionStates,
  createStationConnections,
  updateStationConnections,
  sendMessage,
  closeConnection,
  closeAllConnections,
  reconnectConnection,
  reconnectAllConnections,
  reconnectStations,
  getConnectionState,
  getAllConnectionStates,
  getConnectionHealth,
  getAllConnectionHealth,
  hasConnection,
  getConnectionCount,
  sendSubscriptionToConnection,
  sendSubscriptionToAllConnections
} = useWebSocketManager();

const stationTree = ref([]);
const dialogVisible = ref(false);
const isCollapsed = ref(false);
const timer = ref(null);
const alarmData = ref([]);
const alarmtTableRef = ref(null);

// 计算是否有未确认的报警
const hasUnackAlarms = computed(() => {
  return alarmStore.unackAlarmCount > 0;
});

// 计算需要播报的报警数量
const voiceAlarmCount = computed(() => {
  return alarmStore.voiceAlarms.length;
});

// 计算消音的报警数量
const mutedAlarmCount = computed(() => {
  return alarmStore.mutedAlarms.length;
});

const handleClose = () => {
  // 停止所有语音播放
  if (window.speechAPI) {
    window.speechAPI.stop();
  }

  // 设置语音时间戳
  alarmStore.setVoiceTimestamp();

  // 清除所有未确认报警（可选，根据需要决定是否保留）
  // alarmStore.clearAllUnackAlarms();

  dialogVisible.value = false;
};

// 处理移除已确认的报警
const handleRemoveConfirmedAlarms = (confirmedItems) => {
  console.log("移除已确认的报警:", confirmedItems);

  // 创建已确认报警的唯一标识集合
  const confirmedIds = new Set(
    confirmedItems.map((item) => `${item.stationName}-${item.tag}-${item.time}`)
  );

  // 从本地数据中过滤掉已确认的报警
  const filteredAlarms = alarmData.value.filter((alarm) => {
    const alarmId = `${alarm.stationName}-${alarm.tag}-${alarm.time}`;
    return !confirmedIds.has(alarmId);
  });

  // 更新本地数据
  alarmData.value = filteredAlarms;

  // 更新 store 中的数据
  alarmStore.updateUnackAlarms(filteredAlarms);

  console.log(
    `已从本地移除 ${confirmedItems.length} 条确认的报警，剩余 ${filteredAlarms.length} 条`
  );
};

// WebSocket 事件处理函数
const handleWebSocketMessage = (connectionId, eventName, ...args) => {
  console.log(`收到 WebSocket 消息: ${connectionId} -> ${eventName}`, args);
  
  // console.log('args[0]:##################', args[0]);
  handleAlarmMessage(connectionId, args[0]);

};

const handleWebSocketError = (connectionId, error) => {
  console.error(`WebSocket 错误: ${connectionId}`, error);
  // 可以在这里添加错误处理逻辑，比如重连、通知用户等
};

const handleWebSocketConnect = (connectionId, socket) => {
  console.log(`WebSocket 连接成功: ${connectionId}`);
  // 连接成功后可以发送认证消息等
  sendMessage(connectionId, 'auth', { type: 'client', timestamp: Date.now() });
};

const handleWebSocketDisconnect = (connectionId, reason) => {
  console.log(`WebSocket 连接断开: ${connectionId}, 原因: ${reason}`);
  // 可以在这里添加断开连接的处理逻辑
};

// 处理报警消息
const handleAlarmMessage = (connectionId, alarmData) => {
  console.log(`收到报警消息: ${connectionId}`, alarmData);
  const [stationName, ip, port] = connectionId.split('-');
  // 检查数据格式，支持两种结构
  let params;
  if (alarmData && alarmData.params) {
    // 格式1: { params: { isAck, uuid, ... } }
    params = {...alarmData.params, stationName, ip, port};
  } else if (alarmData && (alarmData.isAck !== undefined || alarmData.uuid)) {
    // 格式2: { isAck, uuid, ... } 直接传递
    params = {...alarmData, stationName, ip, port};
  } else {
    console.warn('报警数据格式不正确:', alarmData);
    return;
  }
  
  const { isAck, uuid } = params;
  
  if (!uuid) {
    console.warn('报警数据缺少 uuid 字段');
    return;
  }
  
  if (isAck) {
    // 确认报警：删除相同 uuid 的对象
    handleAlarmAck(uuid);
  } else {
    // 新增或更新报警
    handleAlarmUpdate(params);
  }
};

// 处理报警确认
const handleAlarmAck = (uuid) => {
  console.log(`确认报警，删除 uuid: ${uuid}`);
  const beforeCount = alarmData.value.length;
  const filteredAlarms = alarmData.value.filter(alarm => alarm.uuid !== uuid);
  const afterCount = filteredAlarms.length;
  
  if (beforeCount > afterCount) {
    alarmData.value = filteredAlarms;
    alarmStore.updateUnackAlarms(filteredAlarms);
    console.log(`✅ 已删除 uuid ${uuid}，从 ${beforeCount} 条减少到 ${afterCount} 条报警`);
  } else {
    console.log(`⚠️ 未找到 uuid ${uuid} 的报警记录`);
  }
};

// 处理报警更新
const handleAlarmUpdate = (alarmParams) => {
  const { uuid } = alarmParams;
  console.log(`处理报警数据，uuid: ${uuid}`);
  
  // 检查是否已存在相同 uuid 的报警
  const existingIndex = alarmData.value.findIndex(alarm => alarm.uuid === uuid);
  
  if (existingIndex !== -1) {
    // 更新已存在的报警
    console.log(`🔄 更新已存在的报警，uuid: ${uuid}`);
    const oldAlarm = alarmData.value[existingIndex];
    alarmData.value[existingIndex] = { ...oldAlarm, ...alarmParams };
    console.log('更新前:', oldAlarm);
    console.log('更新后:', alarmData.value[existingIndex]);
  } else {
    // 新增报警
    console.log(`➕ 新增报警，uuid: ${uuid}`);
    alarmData.value.push(alarmParams);
    console.log('新增报警数据:', alarmParams);
  }
  
  // 更新 store 中的数据
  alarmStore.updateUnackAlarms(alarmData.value);
  
  // 播放语音报警
  alarmStore.playVoiceAlarms();
  
  console.log(`📊 当前报警总数: ${alarmData.value.length}`);
};

// 处理状态消息
const handleStatusMessage = (connectionId, statusData) => {
  console.log(`收到状态消息: ${connectionId}`, statusData);
  // 处理设备状态更新
};

// 处理心跳消息
const handleHeartbeatMessage = (connectionId, heartbeatData) => {
  console.log(`收到心跳消息: ${connectionId}`, heartbeatData);
  // 更新连接状态
};

// 切换全局消音
const toggleGlobalMute = () => {
  alarmStore.toggleGlobalMute();
};

// 手动播放报警语音
const playAlarmVoice = () => {
  alarmStore.playVoiceAlarms();
};

// 停止所有语音
const stopAllVoice = () => {
  if (window.speechAPI) {
    window.speechAPI.stop();
  }
};

// 清除语音时间戳（重新开始监测）
const clearVoiceTimestamp = () => {
  alarmStore.clearVoiceTimestamp();
};

// 获取语音时间戳信息
const getVoiceTimestampInfo = () => {
  const timestamp = alarmStore.voiceTimestamp;
  if (timestamp) {
    return {
      timestamp,
      dateString: new Date(timestamp).toLocaleString(),
      timeAgo: Math.floor((Date.now() - timestamp) / 1000 / 60), // 分钟数
    };
  }
  return null;
};

// 手动开始循环播放
const startLoopPlayback = () => {
  alarmStore.startLoopPlayback();
};

// 手动停止循环播放
const stopLoopPlayback = () => {
  alarmStore.stopLoopPlayback();
};

// 设置播放间隔
const setPlayInterval = (interval) => {
  alarmStore.setPlayInterval(interval);
};

// 获取循环播放状态
const getLoopPlaybackStatus = () => {
  return {
    isPlaying: alarmStore.isLoopPlaying,
    interval: alarmStore.playInterval,
    voiceAlarmsCount: alarmStore.voiceAlarms.length,
  };
};

watch(
  () => alarmStore.voiceTimestamp,
  (newVoiceTimestamp, oldVoiceTimestamp) => {
    console.log("voiceTimestamp 变化:", {
      new: newVoiceTimestamp,
      old: oldVoiceTimestamp,
    });
    if (
      newVoiceTimestamp !== null &&
      oldVoiceTimestamp !== null &&
      newVoiceTimestamp !== oldVoiceTimestamp
    ) {
      alarmStore.stopLoopPlayback();
    }
  }
);

// 监听 voiceAlarms 变化，自动开始/停止循环播放
watch(
  () => alarmStore.voiceAlarms,
  (newVoiceAlarms, oldVoiceAlarms) => {
    console.log("voiceAlarms 变化:", {
      new: newVoiceAlarms.length,
      old: oldVoiceAlarms?.length || 0,
    });

    if (newVoiceAlarms.length > 0) {
      // 有需要播放的报警，开始循环播放
      if (!alarmStore.isLoopPlaying) {
        alarmStore.startLoopPlayback();
      }
    } else {
      // 没有需要播放的报警，停止循环播放
      if (alarmStore.isLoopPlaying) {
        alarmStore.stopLoopPlayback();
      }
    }
  },
  { immediate: true }
);

// 监听全局消音状态变化
watch(
  () => alarmStore.globalMute,
  (isMuted) => {
    if (isMuted) {
      // 全局消音时停止循环播放
      alarmStore.stopLoopPlayback();
    } else if (alarmStore.voiceAlarms.length > 0) {
      // 取消全局消音且有报警时，重新开始循环播放
      alarmStore.startLoopPlayback();
    }
  }
);



onUnmounted(() => {
  // 清理定时器
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }

  // 清理健康监控定时器
  if (healthTimer) {
    clearInterval(healthTimer);
  }

  // 组件卸载时停止循环播放
  alarmStore.stopLoopPlayback();

  // 清理报警数据，释放内存
  alarmData.value = [];

  // 关闭所有 WebSocket 连接
  closeAllConnections();

  console.log("侧边栏组件已卸载，内存和 WebSocket 连接已清理");
});

onMounted(() => {
  // 从 localStorage 加载语音时间戳
  alarmStore.loadVoiceTimestamp();

  // 优先从localStorage加载数据
  const savedTreeData = localStorage.getItem("stationTreeData");
  if (savedTreeData) {
    try {
      const parsedData = JSON.parse(savedTreeData);
      stationTree.value = parsedData;
      console.log("从localStorage加载站点树数据:", parsedData);
    } catch (error) {
      console.error("解析localStorage数据失败:", error);
      // 如果解析失败，使用默认数据
      stationTree.value = digTree;
    }
  } else {
    // 如果没有保存的数据，使用默认数据
    console.log("使用默认站点树数据:", digTree);
    stationTree.value = digTree;
    // 保存默认数据到localStorage
    saveToLocalStorage(digTree);
  }

  //  requestUnackAlarmList("192.168.2.234").then(res => {
  //   res.params
  //  }).catch(err => {
  //   console.log(err);
  //  });
  loopQueryUnackAlarmList();

  // 确保清理之前的定时器
  if (timer.value) {
    clearInterval(timer.value);
  }

  timer.value = setInterval(() => {
    loopQueryUnackAlarmList();
  }, 20 * 60 * 1000);

  // 添加连接健康状态监控定时器
  const healthTimer = setInterval(() => {
    monitorConnectionHealth();
  }, 30 * 1000); // 每30秒检查一次

  // 初始化 WebSocket 连接
  initializeWebSocketConnections();
});

// 初始化 WebSocket 连接
const initializeWebSocketConnections = () => {
  console.log('初始化 WebSocket 连接...',  wsStations.value);
  
  // 获取所有站点信息
  const stations = wsStations.value;
  
  if (stations.length > 0) {
    // 创建站点 WebSocket 连接
    createStationConnections(
      stations,
      handleWebSocketMessage,
      handleWebSocketError,
      handleWebSocketConnect,
      handleWebSocketDisconnect
    );
    
    console.log(`已创建 ${stations.length} 个 WebSocket 连接`);
  }
};

// 添加连接健康状态监控
const monitorConnectionHealth = () => {
  const health = getAllConnectionHealth();
  console.log('WebSocket 连接健康状态:', health);
  
  // 检查是否有连接异常
  const unhealthyConnections = Object.entries(health).filter(([id, status]) => 
    status.status === 'disconnected' && status.reconnectCount > 3
  );
  
  if (unhealthyConnections.length > 0) {
    console.warn('发现异常连接，尝试重连:', unhealthyConnections);
    const stationIds = unhealthyConnections.map(([id]) => id);
    reconnectStations(stationIds);
  }
};

// 手动发送订阅命令到所有连接
const sendSubscriptionToAll = () => {
  console.log('手动发送订阅命令到所有连接');
  const successCount = sendSubscriptionToAllConnections();
  console.log(`成功向 ${successCount} 个连接发送订阅命令`);
  return successCount;
};

// 手动发送订阅命令到指定连接
const sendSubscriptionToStation = (stationId) => {
  console.log(`手动发送订阅命令到站点: ${stationId}`);
  return sendSubscriptionToConnection(stationId);
};

// WebSocket 调试方法
const debugWebSocketConnection = async (station) => {
  const url = `ws://${station.ip}:${station.port}`;
  console.log(`🔍 调试 WebSocket 连接: ${station.name} -> ${url}`);
  
  try {
    // 检查网络连接
    checkNetworkConnection();
    
    // 诊断连接问题
    const result = await diagnoseConnection(url);
    console.log(`诊断结果 (${station.name}):`, result);
    
    return result;
  } catch (error) {
    console.error(`调试失败 (${station.name}):`, error);
    return { success: false, error: error.message };
  }
};

// 批量调试所有站点连接
const debugAllConnections = async () => {
  console.log('🔍 开始调试所有 WebSocket 连接...');
  const stations = wsStations.value;
  const results = [];
  
  for (const station of stations) {
    console.log(`\n--- 调试站点: ${station.name} ---`);
    const result = await debugWebSocketConnection(station);
    results.push({
      station: station.name,
      url: `ws://${station.ip}:${station.port}`,
      ...result
    });
  }
  
  console.log('\n📊 调试结果汇总:');
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.station}: 连接正常`);
    } else {
      console.log(`❌ ${result.station}: 连接失败 - ${result.error}`);
    }
  });
  
  return results;
};

const loopQueryUnackAlarmList = async () => {
  const unackAlarmList = [];

  try {
    // 创建所有请求的Promise数组
    const requests = getAllStationIps.value.map(({ ip, name }) =>
      requestUnackAlarmList(ip, { name: name }).catch((err) => {
        console.log(`请求 ${ip}  ${name} 失败:`, err);
        return { params: [] }; // 失败时返回空数组
      })
    );

    // 等待所有请求完成
    const results = await Promise.all(requests);

    // 处理所有结果
    results.forEach((res) => {
      if (res && res.params) {
        unackAlarmList.push(...res.params);
      }
    });

    console.log(`获取到 ${unackAlarmList.length} 条告警数据`, unackAlarmList);

    // 使用 Pinia store 处理报警数据
    alarmStore.updateUnackAlarms(unackAlarmList);

    // 更新本地数据（用于显示）
    alarmData.value = alarmStore.unackAlarms;

    // 播放需要播报的报警语音
    alarmStore.playVoiceAlarms();

    console.log("报警数据已更新到 store");
    console.log("未确认报警数量:", alarmStore.unackAlarmCount);
    console.log("需要播报的报警数量:", alarmStore.voiceAlarms.length);

    // 内存优化：限制报警数据数量，避免无限累积
    const MAX_ALARM_COUNT = 100000; // 可以调整这个数值
    if (alarmData.value.length > MAX_ALARM_COUNT) {
      console.warn(
        `报警数据过多(${alarmData.value.length}条)，清理旧数据，保留最新${MAX_ALARM_COUNT}条`
      );
      // 保留最新的数据
      const sortedData = alarmData.value
        .sort(
          (a, b) =>
            new Date(b.time || b.timestamp || 0) -
            new Date(a.time || a.timestamp || 0)
        )
        .slice(0, MAX_ALARM_COUNT);
      alarmData.value = sortedData;
      alarmStore.updateUnackAlarms(sortedData);
    }

    // console.log('unackObj:', unackObj);

    // console.log('alarmData.value 已更新:', alarmData.value);
  } catch (error) {
    console.error("批量请求失败:", error);
  } finally {
    if (alarmtTableRef.value) {
      alarmtTableRef.value.loading = false;
    }
  }
};

// 收集所有站点的IP地址
const getAllStationIps = computed(() => {
  const ips = [];
  stationTree.value.forEach((line) => {
    if (line.children) {
      line.children.forEach((workshop) => {
        if (workshop.children) {
          workshop.children.forEach((station) => {
            if (station.ip) {
              ips.push({
                ip: station.ip,
                port: station.port || station.httpport,
                name: station.name,
              });
            }
          });
        }
      });
    }
  });
  return ips;
});

const wsStations = computed(() => {
  return getAllStationIps.value.map(item => ({
    name: item.name,
    ip: item.ip,
    port: item.port,
  }));
});

const computedStationFlat = computed(() => {
  const flatStations = [];
  stationTree.value.forEach((workshop) => {
    if (workshop.children && workshop.children.length > 0) {
      workshop.children.forEach((station) => {
        flatStations.push(station);
      });
    }
  });
  return flatStations;
});

// 处理站点选择事件
const handleStationSelect = (station) => {
  console.log("侧边栏 - 选中站点:", station);
  // 向上传递事件
  emit("station-select", station);
};

// 处理站点连接事件
const handleStationConnect = (station) => {
  console.log("侧边栏 - 连接站点:", station);

  // 构建连接信息
  const connectInfo = {
    station: station,
    url: `http://${station.ip}:${station.httpport}`,
    timestamp: new Date().toISOString(),
    action: "connect",
  };

  // 向上传递连接信息
  emit("station-connect", connectInfo);
};

// 处理节点展开事件
const handleNodeExpand = (node) => {
  console.log("侧边栏 - 节点展开:", node);
  // 向上传递事件
  emit("node-expand", node);
};

const handleAlarm = () => {
  console.log("侧边栏 - 集中报警");
  dialogVisible.value = true;
};

// 保存到localStorage的方法
const saveToLocalStorage = (treeData) => {
  try {
    localStorage.setItem("stationTreeData", JSON.stringify(treeData));
    console.log("站点树数据已保存到localStorage");
  } catch (error) {
    console.error("保存到localStorage失败:", error);
  }
};

// 从localStorage清除数据
const clearLocalStorage = () => {
  try {
    localStorage.removeItem("stationTreeData");
    console.log("localStorage中的站点树数据已清除");
  } catch (error) {
    console.error("清除localStorage失败:", error);
  }
};

// 重置为默认数据
const resetToDefault = () => {
  stationTree.value = digTree;
  saveToLocalStorage(digTree);
  console.log("已重置为默认站点树数据");
};

// 处理树结构变化
const handleTreeChange = (newTreeData) => {
  console.log("侧边栏 - 树结构变化:", newTreeData);
  stationTree.value = newTreeData;
  // 实时保存到localStorage
  saveToLocalStorage(newTreeData);
};

// 处理树重置
const handleTreeReset = () => {
  console.log("侧边栏 - 重置树结构");
  resetToDefault();
};

// 切换侧边栏收缩状态
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
  emit("sidebar-toggle", isCollapsed.value);
  console.log("侧边栏 - 切换状态:", isCollapsed.value ? "收缩" : "展开");
};

// 监听站点变化，智能管理 WebSocket 连接
watch(
  () => wsStations.value,
  (newStations, oldStations) => {
    console.log('站点配置变化，智能管理 WebSocket 连接');
    console.log('新站点:', newStations);
    console.log('旧站点:', oldStations);
    
    // 使用智能连接管理方法
    updateStationConnections(
      newStations,
      oldStations,
      handleWebSocketMessage,
      handleWebSocketError,
      handleWebSocketConnect,
      handleWebSocketDisconnect
    );
  },
  { deep: true, immediate: false }
);
</script>

<template>
  <div class="component-sidebar" :class="{ collapsed: isCollapsed }">
    <!-- 收缩按钮 -->
    <div class="collapse-button" @click="toggleSidebar">
      <el-icon>
        <ArrowLeft v-if="!isCollapsed" />
        <ArrowRight v-else />
      </el-icon>
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="未确认的报警信息(集中监测)"
      width="80vw"
      :before-close="handleClose"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <AlarmtTable
        ref="alarmtTableRef"
        @refresh-data="loopQueryUnackAlarmList"
        @close-page="handleClose"
        @remove-confirmed-alarms="handleRemoveConfirmedAlarms"
        :requestAckAlarm="requestAckAlarm"
        :stationTree="stationTree"
        :alarmData="alarmData"
      />
    </el-dialog>

    <div class="menu-content" v-show="!isCollapsed">
      <StationTree
        :data="stationTree"
        @station-select="handleStationSelect"
        @station-connect="handleStationConnect"
        @node-expand="handleNodeExpand"
        @tree-change="handleTreeChange"
        @tree-reset="handleTreeReset"
      />

      <div class="menu-footer">
        <el-button type="danger" @click="handleAlarm">
          <el-icon
            class="mr-1 alarm-bell-icon"
            :class="{ 'alarm-animation': hasUnackAlarms }"
          >
            <BellFilled />
          </el-icon>
          集中报警
          <!-- <span v-if="hasUnackAlarms" class="alarm-badge">{{ alarmData.length }}</span> -->
        </el-button>
        
        <!-- 调试按钮 -->
        <!-- <el-button type="info" size="small" @click="debugAllConnections" style="margin-top: 8px;">
          🔍 调试连接
        </el-button> -->
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.component-sidebar {
  position: fixed;
  top: 0px;
  left: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  width: 280px;
  flex-direction: column;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  transition: all 0.3s ease;

  &.collapsed {
    width: 10px;
  }

  .collapse-button {
    position: absolute;
    top: 50%;
    right: -15px;
    transform: translateY(-50%);
    width: 30px;
    height: 30px;
    background: #409eff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
    z-index: 1001;
    transition: all 0.3s ease;

    &:hover {
      background: #337ecc;
      transform: translateY(-50%) scale(1.1);
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
    }

    .el-icon {
      color: white;
      font-size: 16px;
      transition: transform 0.3s ease;
    }
  }

  .framework-name {
    height: 40px;
    padding: 0 12px;
    font-size: 16px;
    line-height: 40px;
    text-align: center;
    font-weight: bold;
    border-bottom: 1px solid #e9ecef;
  }

  .menu-content {
    flex: 1;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  }

  .menu-footer {
    text-align: center;
    padding: 8px;
    border-top: 1px solid #e4e7ed;
    background: #f8f9fa;

    .el-button {
      position: relative;

      .alarm-bell-icon {
        position: relative;
        top: -2px;
        font-size: 19px;
        transition: all 0.3s ease;

        &.alarm-animation {
          animation: bellShake 1s ease-in-out infinite;
          transform-origin: center;
        }
      }

      .alarm-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #ff4757;
        color: white;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        font-size: 10px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(255, 71, 87, 0.3);
      }
    }
  }
}

// 铃铛摇晃动画
@keyframes bellShake {
  0%,
  100% {
    transform: rotate(0deg);
  }
  10% {
    transform: rotate(-15deg);
  }
  20% {
    transform: rotate(15deg);
  }
  30% {
    transform: rotate(-10deg);
  }
  40% {
    transform: rotate(10deg);
  }
  50% {
    transform: rotate(-5deg);
  }
  60% {
    transform: rotate(5deg);
  }
  70% {
    transform: rotate(-2deg);
  }
  80% {
    transform: rotate(2deg);
  }
  90% {
    transform: rotate(-1deg);
  }
}

// 徽章脉冲动画
@keyframes badgePulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 2px 4px rgba(255, 71, 87, 0.3);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(255, 71, 87, 0.5);
  }
}
</style>
