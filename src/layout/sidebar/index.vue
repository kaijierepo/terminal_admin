<script setup lang="tsx">
import { ref, onMounted, computed } from "vue";
import { getStationList } from "@/api/config";
import StationTree from "@/components/StationTree/index.vue";
import AlarmtTable from "@/components/AlarmtTable/index.vue";
import digTree from "./config";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import { requestUnackAlarmList } from "@/api/alarm";
import { BellFilled } from "@element-plus/icons-vue";

// 定义组件事件
const emit = defineEmits([
  "station-select",
  "station-connect",
  "node-expand",
  "sidebar-toggle",
]);

const stationTree = ref([]);
const dialogVisible = ref(false);
const isCollapsed = ref(false);
const timer = ref(null);
const alarmData = ref([]);

// 计算是否有未确认的报警
const hasUnackAlarms = computed(() => {
  return alarmData.value && alarmData.value.length > 0;
});

const handleClose = () => {
  dialogVisible.value = false;
};

onUnmounted(() => {
  clearInterval(timer.value);
});

onMounted(() => {
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
  timer.value = setInterval(() => {
    loopQueryUnackAlarmList();
  }, 60 * 1000);
  
});

const loopQueryUnackAlarmList = async () => {
  const unackAlarmList = [];
  
  try {
    // 创建所有请求的Promise数组
    const requests = getAllStationIps.value.map(({ ip, name }) => 
      requestUnackAlarmList(ip, { name: name }).catch(err => {
        console.log(`请求 ${name} 失败:`, err);
        return { params: [] }; // 失败时返回空数组
      })
    );
    
    // 等待所有请求完成
    const results = await Promise.all(requests);
    
    // 处理所有结果
    results.forEach(res => {
      if (res && res.params) {
        unackAlarmList.push(...res.params);
      }
    });
    
    console.log(`获取到 ${unackAlarmList.length} 条告警数据`, unackAlarmList);
    alarmData.value = unackAlarmList;
    console.log('alarmData.value 已更新:', alarmData.value);
  } catch (error) {
    console.error('批量请求失败:', error);
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
              ips.push({ ip: station.ip, name: station.name });
            }
          });
        }
      });
    }
  });
  return ips;
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
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <AlarmtTable :stationTree="stationTree" :alarmData="alarmData" />
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
          <el-icon class="mr-1 alarm-bell-icon" :class="{ 'alarm-animation': hasUnackAlarms }">
            <BellFilled />
          </el-icon>
          集中报警
          <!-- <span v-if="hasUnackAlarms" class="alarm-badge">{{ alarmData.length }}</span> -->
        </el-button>
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
    width: 20px;

    .collapse-button {
      .el-icon {
        transform: rotate(180deg);
      }
    }
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
  0%, 100% {
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
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 2px 4px rgba(255, 71, 87, 0.3);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(255, 71, 87, 0.5);
  }
}
</style>
