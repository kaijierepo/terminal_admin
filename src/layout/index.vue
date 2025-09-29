<script setup>
import { ref } from "vue";
import SideBar from "./sidebar/index.vue";

// 响应式数据
const currentStation = ref(null);
const connectionStatus = ref("disconnected");
const connectionLog = ref([]);
const sidebarCollapsed = ref(false);

// 处理站点选择事件
const handleStationSelect = (station) => {
  currentStation.value = station;
  addConnectionLog("选择站点", `选中站点: ${station.name} (${station.ip})`);
};

// 处理站点连接事件
const handleStationConnect = (connectInfo) => {
  const { station, url, timestamp } = connectInfo;

  // 更新当前站点和连接状态
  currentStation.value = station;
  connectionStatus.value = "connecting";

  // 添加连接日志
  addConnectionLog("连接站点", `正在连接到: ${station.name} (${url})`);

  // 模拟连接过程
  setTimeout(() => {
    connectionStatus.value = "connected";
    addConnectionLog("连接成功", `成功连接到: ${station.name}`);

    // 这里可以添加实际的iframe URL更新逻辑
    updateIframeUrl(url);
  }, 1500);
};

// 处理节点展开事件
const handleNodeExpand = (node) => {
  const status = node.expanded ? "展开" : "收起";
  addConnectionLog("节点操作", `${status}节点: ${node.name}`);
};

// 处理侧边栏切换事件
const handleSidebarToggle = (collapsed) => {
  sidebarCollapsed.value = collapsed;
  addConnectionLog("界面操作", `侧边栏${collapsed ? "收缩" : "展开"}`);
};

// 添加连接日志
const addConnectionLog = (action, detail) => {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

  connectionLog.value.unshift({
    time,
    action,
    detail,
    timestamp: now.toLocaleString(),
  });

  // 限制日志数量
  if (connectionLog.value.length > 50) {
    connectionLog.value = connectionLog.value.slice(0, 50);
  }
};

// 更新iframe URL
const updateIframeUrl = (url) => {
  const iframe = document.querySelector("iframe");
  if (iframe) {
    iframe.src = url;
    console.log("已更新iframe URL:", url);
  }
};

// 获取当前连接状态文本
const getConnectionStatusText = () => {
  switch (connectionStatus.value) {
    case "connecting":
      return "连接中...";
    case "connected":
      return "已连接";
    case "disconnected":
    default:
      return "未连接";
  }
};

// 获取当前连接状态颜色
const getConnectionStatusColor = () => {
  switch (connectionStatus.value) {
    case "connecting":
      return "#e6a23c";
    case "connected":
      return "#67c23a";
    case "disconnected":
    default:
      return "#909399";
  }
};
</script>

<template>
  <div class="layout">
    <!-- 侧边栏 -->
    <SideBar
      class="sidebar"
      @station-select="handleStationSelect"
      @station-connect="handleStationConnect"
      @node-expand="handleNodeExpand"
      @sidebar-toggle="handleSidebarToggle"
    />

    <!-- iframe 内容 -->
    <iframe
      :src="
        currentStation
          ? `http://${currentStation.ip}:${currentStation.port}/#/`
          : ''
      "
      frameborder="0"
      class="main-iframe"
      :class="{ 'sidebar-collapsed': sidebarCollapsed }"
    ></iframe>
  </div>
</template>

<style scoped lang="scss">
@import "@/styles/variables.scss";

.layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.sidebar {
  background-color: $sidebar-bg-color;
  font-size: $sidebar-font-size;
  color: $sidebar-text-color;
  flex-shrink: 0;
  z-index: 1000;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 280px; // 为固定侧边栏留出空间
  height: 100vh;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  padding: 0 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-size: 14px;
  flex-shrink: 0;

  .station-info,
  .connection-status {
    display: flex;
    align-items: center;
    gap: 8px;

    .label {
      color: #606266;
      font-weight: 500;
    }

    .station-name,
    .status-text {
      color: #303133;
      font-weight: 600;
    }
  }
}

.main-iframe {
  flex: 1;
  width: 100%;
  height: 100%;
  border: none;
  margin-left: 280px;
  transition: margin-left 0.3s ease;
  
  &.sidebar-collapsed {
    margin-left: 0px;
  }
}

.log-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  max-height: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  overflow: hidden;

  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f5f7fa;
    border-bottom: 1px solid #e4e7ed;
    font-weight: 600;
    color: #303133;

    .clear-btn {
      background: none;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      color: #606266;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: #f0f2f5;
        border-color: #c0c4cc;
      }
    }
  }

  .log-content {
    max-height: 240px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 2px;
    }
  }

  .log-item {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 12px;

    &:last-child {
      border-bottom: none;
    }

    .log-time {
      font-family: "Courier New", monospace;
      color: #909399;
      min-width: 60px;
      margin-right: 12px;
    }

    .log-action {
      color: #409eff;
      font-weight: 500;
      min-width: 80px;
      margin-right: 12px;
    }

    .log-detail {
      color: #606266;
      flex: 1;
      word-break: break-all;
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .main-iframe {
    margin-left: 280px;
    
    &.sidebar-collapsed {
      margin-left: 60px;
    }
  }

  .log-panel {
    width: 350px;
  }
}

@media (max-width: 768px) {
  .main-iframe {
    margin-left: 260px;
    
    &.sidebar-collapsed {
      margin-left: 50px;
    }
  }

  .status-bar {
    flex-direction: column;
    height: auto;
    padding: 8px 12px;
    gap: 4px;

    .station-info,
    .connection-status {
      font-size: 12px;
    }
  }

  .log-panel {
    width: 300px;
    bottom: 10px;
    right: 10px;
  }
}
</style>
