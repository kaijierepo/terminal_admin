import { ref, reactive, onUnmounted } from 'vue';

// 原生 WebSocket 连接类
class NativeWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.socket = null;
    this.isConnected = false;
    this.reconnectCount = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.listeners = new Map();
    
    this.connect();
  }
  
  connect() {
    try {
      this.socket = new WebSocket(this.url);
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket 连接失败:', error);
      this.handleError(error);
    }
  }
  
  setupEventListeners() {
    this.socket.onopen = () => {
      console.log('WebSocket 连接成功:', this.url);
      this.isConnected = true;
      this.reconnectCount = 0;
      this.emit('connect');
    };
    
    this.socket.onclose = (event) => {
      console.log('WebSocket 连接关闭:', this.url, event);
      this.isConnected = false;
      this.emit('disconnect', event.reason);
      
      // 自动重连
      if (this.reconnectCount < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectCount++;
          console.log(`WebSocket 重连尝试: ${this.url}, 第 ${this.reconnectCount} 次`);
          this.emit('reconnect_attempt', this.reconnectCount);
          this.connect();
        }, this.reconnectDelay * this.reconnectCount);
      } else {
        console.error('WebSocket 重连失败:', this.url);
        this.emit('reconnect_failed');
      }
    };
    
    this.socket.onerror = (error) => {
      console.error('WebSocket 错误:', this.url, error);
      this.emit('connect_error', error);
    };
    
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit('message', data);
      } catch (error) {
        // 如果不是 JSON 格式，直接传递原始数据
        this.emit('message', event.data);
      }
    };
  }
  
  emit(event, ...args) {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`WebSocket 事件监听器错误: ${event}`, error);
      }
    });
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  off(event, callback) {
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  send(data) {
    if (this.isConnected && this.socket) {
      if (typeof data === 'object') {
        this.socket.send(JSON.stringify(data));
      } else {
        this.socket.send(data);
      }
    } else {
      console.warn('WebSocket 未连接，无法发送消息');
    }
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
  
  handleError(error) {
    this.emit('connect_error', error);
  }
}

/**
 * WebSocket 管理器 Mixin
 * 支持管理多个 WebSocket 连接实例
 */
export const useWebSocketManager = () => {
  // 存储所有 WebSocket 实例
  const socketInstances = reactive(new Map());
  
  // 连接状态
  const connectionStates = reactive(new Map());
  
  // 全局配置
  const defaultConfig = {
    timeout: 20000,
    maxReconnectionAttempts: 5,
    reconnectDelay: 1000,
    reconnectDelayMax: 5000
  };

  /**
   * 创建 WebSocket 连接
   * @param {string} id - 连接唯一标识
   * @param {string} url - WebSocket 地址
   * @param {Object} options - 连接选项
   * @param {Function} onMessage - 消息回调
   * @param {Function} onError - 错误回调
   * @param {Function} onConnect - 连接成功回调
   * @param {Function} onDisconnect - 断开连接回调
   */
  const createConnection = (id, url, options = {}, onMessage, onError, onConnect, onDisconnect) => {
    // 如果已存在连接，先关闭
    if (socketInstances.has(id)) {
      closeConnection(id);
    }

    const config = { ...defaultConfig, ...options };
    
    console.log(`创建 WebSocket 连接: ${id} -> ${url}`);
    
    // 使用原生 WebSocket
    const socket = new NativeWebSocket(url, config);
    
    // 存储连接实例
    socketInstances.set(id, {
      socket,
      url,
      config,
      onMessage,
      onError,
      onConnect,
      onDisconnect,
      reconnectCount: 0,
      isConnected: false,
      lastConnectTime: null
    });

    // 设置连接状态
    connectionStates.set(id, {
      connected: false,
      connecting: false,
      error: null,
      reconnectCount: 0
    });

    // 绑定事件监听器
    setupEventListeners(id, socket);

    return socket;
  };

  /**
   * 设置事件监听器
   */
  const setupEventListeners = (id, socket) => {
    const instance = socketInstances.get(id);
    if (!instance) return;

    // 原生 WebSocket 事件监听
    socket.on('connect', () => {
      console.log(`WebSocket 连接成功: ${id}`);
      instance.isConnected = true;
      instance.lastConnectTime = Date.now();
      instance.reconnectCount = 0;
      
      updateConnectionState(id, { connected: true, connecting: false, error: null });
      
      // 连接成功后自动发送订阅命令
      sendSubscriptionCommand(id, socket);
      
      if (instance.onConnect) {
        instance.onConnect(id, socket);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`WebSocket 连接断开: ${id}, 原因: ${reason}`);
      instance.isConnected = false;
      
      updateConnectionState(id, { connected: false, connecting: false });
      
      if (instance.onDisconnect) {
        instance.onDisconnect(id, reason);
      }
    });

    socket.on('connect_error', (error) => {
      console.error(`WebSocket 连接错误: ${id}`, error);
      instance.reconnectCount++;
      
      updateConnectionState(id, { 
        connected: false, 
        connecting: false, 
        error: error.message || error,
        reconnectCount: instance.reconnectCount
      });
      
      if (instance.onError) {
        instance.onError(id, error);
      }
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`WebSocket 重连尝试: ${id}, 第 ${attemptNumber} 次`);
      instance.reconnectCount = attemptNumber;
      
      updateConnectionState(id, { 
        connecting: true, 
        reconnectCount: attemptNumber 
      });
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`WebSocket 重连成功: ${id}, 尝试了 ${attemptNumber} 次`);
      instance.reconnectCount = 0;
      
      // 重连成功后重新发送订阅命令
      sendSubscriptionCommand(id, socket);
    });

    socket.on('reconnect_failed', () => {
      console.error(`WebSocket 重连失败: ${id}`);
      updateConnectionState(id, { 
        connected: false, 
        connecting: false, 
        error: '重连失败' 
      });
    });

    socket.on('message', (data) => {
      console.log(`WebSocket 收到消息: ${id}`, data);
      
      if (instance.onMessage) {
        instance.onMessage(id, 'message', data);
      }
    });
  };

  /**
   * 更新连接状态
   */
  const updateConnectionState = (id, state) => {
    const currentState = connectionStates.get(id) || {};
    connectionStates.set(id, { ...currentState, ...state });
  };

  /**
   * 发送订阅命令
   * @param {string} id - 连接标识
   * @param {Object} socket - socket 实例
   */
  const sendSubscriptionCommand = (id, socket) => {
    const subscriptionCommand = {
      "<": "",
      "cmd": "rpc",
      "jsonrpc": "2.0",
      "method": "NotificationSubscription",
      "params": {
        "type": {
          "UnOkAlarm": true
        }
      },
      "id": 1,
      ">": ""
    };

    try {
      // 原生 WebSocket 发送订阅命令
      socket.send(JSON.stringify(subscriptionCommand));
      console.log(`发送订阅命令到 ${id}:`, subscriptionCommand);
    } catch (error) {
      console.error(`发送订阅命令失败 ${id}:`, error);
    }
  };

  /**
   * 发送消息
   * @param {string} id - 连接标识
   * @param {string} event - 事件名
   * @param {*} data - 数据
   */
  const sendMessage = (id, event, data) => {
    const instance = socketInstances.get(id);
    if (!instance || !instance.isConnected) {
      console.warn(`WebSocket 连接不存在或未连接: ${id}`);
      return false;
    }

    try {
      // 原生 WebSocket 发送消息
      instance.socket.send(data);
      console.log(`发送 WebSocket 消息: ${id}`, data);
      return true;
    } catch (error) {
      console.error(`发送 WebSocket 消息失败: ${id}`, error);
      return false;
    }
  };

  /**
   * 关闭指定连接
   * @param {string} id - 连接标识
   */
  const closeConnection = (id) => {
    const instance = socketInstances.get(id);
    if (instance) {
      console.log(`关闭 WebSocket 连接: ${id}`);
      
      // 原生 WebSocket 关闭连接
      instance.socket.disconnect();
      
      socketInstances.delete(id);
      connectionStates.delete(id);
    }
  };

  /**
   * 关闭所有连接
   */
  const closeAllConnections = () => {
    console.log('关闭所有 WebSocket 连接');
    for (const [id] of socketInstances) {
      closeConnection(id);
    }
  };

  /**
   * 重连指定连接
   * @param {string} id - 连接标识
   */
  const reconnectConnection = (id) => {
    const instance = socketInstances.get(id);
    if (instance) {
      console.log(`重连 WebSocket: ${id}`);
      instance.socket.connect();
    }
  };

  /**
   * 重连所有连接
   */
  const reconnectAllConnections = () => {
    console.log('重连所有 WebSocket 连接');
    for (const [id] of socketInstances) {
      reconnectConnection(id);
    }
  };

  /**
   * 获取连接状态
   * @param {string} id - 连接标识
   */
  const getConnectionState = (id) => {
    return connectionStates.get(id) || { connected: false, connecting: false, error: null };
  };

  /**
   * 获取所有连接状态
   */
  const getAllConnectionStates = () => {
    return Object.fromEntries(connectionStates);
  };

  /**
   * 检查连接是否存在
   * @param {string} id - 连接标识
   */
  const hasConnection = (id) => {
    return socketInstances.has(id);
  };

  /**
   * 获取连接数量
   */
  const getConnectionCount = () => {
    return socketInstances.size;
  };

  /**
   * 批量创建连接
   * @param {Array} connections - 连接配置数组
   * @param {Function} onMessage - 统一消息回调
   * @param {Function} onError - 统一错误回调
   * @param {Function} onConnect - 统一连接成功回调
   * @param {Function} onDisconnect - 统一断开连接回调
   */
  const createMultipleConnections = (connections, onMessage, onError, onConnect, onDisconnect) => {
    console.log(`批量创建 ${connections.length} 个 WebSocket 连接`);
    
    connections.forEach(({ id, url, options = {} }) => {
      createConnection(id, url, options, onMessage, onError, onConnect, onDisconnect);
    });
  };

  /**
   * 根据站点信息创建连接
   * @param {Array} stations - 站点信息数组
   * @param {Function} onMessage - 消息回调
   * @param {Function} onError - 错误回调
   * @param {Function} onConnect - 连接成功回调
   * @param {Function} onDisconnect - 断开连接回调
   */
  const createStationConnections = (stations, onMessage, onError, onConnect, onDisconnect) => {
    const connections = stations.map(station => ({
      id: `${station.name}-${station.ip}-${station.port}`,
      url: `ws://${station.ip}:${station.port}`,
      options: {
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000
      }
    }));

    createMultipleConnections(connections, onMessage, onError, onConnect, onDisconnect);
  };

  /**
   * 智能更新连接 - 根据站点变化智能管理连接
   * @param {Array} newStations - 新的站点列表
   * @param {Array} oldStations - 旧的站点列表
   * @param {Function} onMessage - 消息回调
   * @param {Function} onError - 错误回调
   * @param {Function} onConnect - 连接成功回调
   * @param {Function} onDisconnect - 断开连接回调
   */
  const updateStationConnections = (newStations, oldStations, onMessage, onError, onConnect, onDisconnect) => {
    if (!oldStations || oldStations.length === 0) {
      // 首次加载，创建所有连接
      createStationConnections(newStations, onMessage, onError, onConnect, onDisconnect);
      return;
    }

    // 创建站点标识符映射
    const createStationId = (station) => `${station.name}-${station.ip}-${station.port}`;
    
    const oldStationIds = new Set(oldStations.map(createStationId));
    const newStationIds = new Set(newStations.map(createStationId));
    
    // 找出新增的站点
    const addedStations = newStations.filter(station => 
      !oldStationIds.has(createStationId(station))
    );
    
    // 找出删除的站点
    const removedStations = oldStations.filter(station => 
      !newStationIds.has(createStationId(station))
    );
    
    // 找出修改的站点（IP或端口变化）
    const modifiedStations = newStations.filter(newStation => {
      const oldStation = oldStations.find(old => old.name === newStation.name);
      return oldStation && (
        oldStation.ip !== newStation.ip || 
        oldStation.port !== newStation.port
      );
    });
    
    console.log('WebSocket 连接更新分析:', {
      added: addedStations.length,
      removed: removedStations.length,
      modified: modifiedStations.length
    });
    
    // 处理新增的站点
    if (addedStations.length > 0) {
      console.log('创建新增站点的连接:', addedStations);
      createStationConnections(addedStations, onMessage, onError, onConnect, onDisconnect);
    }
    
    // 处理删除的站点
    if (removedStations.length > 0) {
      console.log('关闭删除站点的连接:', removedStations);
      removedStations.forEach(station => {
        const connectionId = createStationId(station);
        if (hasConnection(connectionId)) {
          closeConnection(connectionId);
        }
      });
    }
    
    // 处理修改的站点
    if (modifiedStations.length > 0) {
      console.log('更新修改站点的连接:', modifiedStations);
      modifiedStations.forEach(station => {
        const connectionId = createStationId(station);
        
        // 关闭旧连接
        if (hasConnection(connectionId)) {
          closeConnection(connectionId);
        }
        
        // 创建新连接
        createConnection(
          connectionId,
          `ws://${station.ip}:${station.port}`,
          {
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: 3,
            reconnectionDelay: 2000
          },
          onMessage,
          onError,
          onConnect,
          onDisconnect
        );
      });
    }
  };

  /**
   * 批量重连指定站点
   * @param {Array} stationIds - 站点ID数组
   */
  const reconnectStations = (stationIds) => {
    stationIds.forEach(id => {
      if (hasConnection(id)) {
        reconnectConnection(id);
      }
    });
  };

  /**
   * 获取连接健康状态
   * @param {string} id - 连接标识
   */
  const getConnectionHealth = (id) => {
    const instance = socketInstances.get(id);
    const state = connectionStates.get(id);
    
    if (!instance || !state) {
      return { status: 'unknown', lastConnect: null, reconnectCount: 0 };
    }
    
    return {
      status: state.connected ? 'connected' : (state.connecting ? 'connecting' : 'disconnected'),
      lastConnect: instance.lastConnectTime,
      reconnectCount: instance.reconnectCount,
      error: state.error
    };
  };

  /**
   * 获取所有连接的健康状态
   */
  const getAllConnectionHealth = () => {
    const health = {};
    for (const [id] of socketInstances) {
      health[id] = getConnectionHealth(id);
    }
    return health;
  };

  /**
   * 手动发送订阅命令到指定连接
   * @param {string} id - 连接标识
   */
  const sendSubscriptionToConnection = (id) => {
    const instance = socketInstances.get(id);
    if (instance && instance.isConnected) {
      sendSubscriptionCommand(id, instance.socket);
      return true;
    } else {
      console.warn(`连接 ${id} 不存在或未连接，无法发送订阅命令`);
      return false;
    }
  };

  /**
   * 向所有连接发送订阅命令
   */
  const sendSubscriptionToAllConnections = () => {
    console.log('向所有连接发送订阅命令');
    let successCount = 0;
    
    for (const [id, instance] of socketInstances) {
      if (instance.isConnected) {
        if (sendSubscriptionToConnection(id)) {
          successCount++;
        }
      }
    }
    
    console.log(`成功向 ${successCount} 个连接发送订阅命令`);
    return successCount;
  };

  // 组件卸载时清理所有连接
  onUnmounted(() => {
    closeAllConnections();
  });

  return {
    // 状态
    socketInstances,
    connectionStates,
    
    // 方法
    createConnection,
    createMultipleConnections,
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
  };
};
