/**
 * WebSocket 连接调试工具
 * 帮助诊断连接问题
 */

export const useWebSocketDebug = () => {
  /**
   * 测试 WebSocket 连接
   * @param {string} url - WebSocket 地址
   * @param {Object} options - 连接选项
   */
  const testConnection = (url, options = {}) => {
    console.log('🔍 开始测试 WebSocket 连接...');
    console.log('URL:', url);
    console.log('选项:', options);
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let socket;
      
      try {
        // 创建原生 WebSocket 连接
        socket = new WebSocket(url);
        
        // 连接成功
        socket.onopen = () => {
          const duration = Date.now() - startTime;
          console.log('✅ WebSocket 连接成功!');
          console.log('连接时间:', duration + 'ms');
          console.log('协议:', socket.protocol);
          console.log('就绪状态:', socket.readyState);
          
          // 发送测试消息
          const testMessage = {
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
          
          socket.send(JSON.stringify(testMessage));
          console.log('📤 发送测试消息:', testMessage);
          
          resolve({
            success: true,
            duration,
            protocol: socket.protocol,
            readyState: socket.readyState
          });
        };
        
        // 连接失败
        socket.onerror = (error) => {
          const duration = Date.now() - startTime;
          console.error('❌ WebSocket 连接失败!');
          console.error('错误:', error);
          console.error('连接时间:', duration + 'ms');
          console.error('就绪状态:', socket.readyState);
          
          reject({
            success: false,
            error,
            duration,
            readyState: socket.readyState
          });
        };
        
        // 连接关闭
        socket.onclose = (event) => {
          console.log('🔌 WebSocket 连接关闭');
          console.log('代码:', event.code);
          console.log('原因:', event.reason);
          console.log('是否正常关闭:', event.wasClean);
        };
        
        // 接收消息
        socket.onmessage = (event) => {
          console.log('📥 收到消息:', event.data);
          try {
            const data = JSON.parse(event.data);
            console.log('解析后的数据:', data);
          } catch (error) {
            console.log('非 JSON 格式消息:', event.data);
          }
        };
        
        // 设置超时
        setTimeout(() => {
          if (socket.readyState === WebSocket.CONNECTING) {
            console.warn('⏰ 连接超时');
            socket.close();
            reject({
              success: false,
              error: '连接超时',
              duration: Date.now() - startTime
            });
          }
        }, options.timeout || 10000);
        
      } catch (error) {
        console.error('❌ 创建 WebSocket 连接时发生错误:', error);
        reject({
          success: false,
          error: error.message,
          duration: Date.now() - startTime
        });
      }
    });
  };
  
  /**
   * 批量测试多个连接
   * @param {Array} connections - 连接配置数组
   */
  const testMultipleConnections = async (connections) => {
    console.log('🔍 开始批量测试 WebSocket 连接...');
    const results = [];
    
    for (const connection of connections) {
      console.log(`\n--- 测试连接: ${connection.id} ---`);
      try {
        const result = await testConnection(connection.url, connection.options);
        results.push({
          id: connection.id,
          url: connection.url,
          ...result
        });
      } catch (error) {
        results.push({
          id: connection.id,
          url: connection.url,
          ...error
        });
      }
    }
    
    console.log('\n📊 测试结果汇总:');
    results.forEach(result => {
      if (result.success) {
        console.log(`✅ ${result.id}: 连接成功 (${result.duration}ms)`);
      } else {
        console.log(`❌ ${result.id}: 连接失败 - ${result.error}`);
      }
    });
    
    return results;
  };
  
  /**
   * 检查网络连接
   */
  const checkNetworkConnection = () => {
    console.log('🌐 检查网络连接...');
    
    // 检查在线状态
    console.log('在线状态:', navigator.onLine);
    
    // 检查用户代理
    console.log('用户代理:', navigator.userAgent);
    
    // 检查 WebSocket 支持
    if (typeof WebSocket === 'undefined') {
      console.error('❌ 浏览器不支持 WebSocket');
      return false;
    } else {
      console.log('✅ 浏览器支持 WebSocket');
    }
    
    // 检查协议支持
    const protocols = ['ws://', 'wss://'];
    protocols.forEach(protocol => {
      console.log(`协议支持 ${protocol}:`, true);
    });
    
    return true;
  };
  
  /**
   * 诊断连接问题
   * @param {string} url - WebSocket 地址
   */
  const diagnoseConnection = async (url) => {
    console.log('🔧 开始诊断 WebSocket 连接问题...');
    
    // 1. 检查网络连接
    const networkOk = checkNetworkConnection();
    if (!networkOk) {
      return { success: false, error: '网络连接检查失败' };
    }
    
    // 2. 解析 URL
    try {
      const urlObj = new URL(url);
      console.log('URL 解析:');
      console.log('  协议:', urlObj.protocol);
      console.log('  主机:', urlObj.hostname);
      console.log('  端口:', urlObj.port);
      console.log('  路径:', urlObj.pathname);
    } catch (error) {
      console.error('❌ URL 格式错误:', error);
      return { success: false, error: 'URL 格式错误' };
    }
    
    // 3. 测试连接
    try {
      const result = await testConnection(url);
      return result;
    } catch (error) {
      console.error('❌ 连接测试失败:', error);
      return error;
    }
  };
  
  return {
    testConnection,
    testMultipleConnections,
    checkNetworkConnection,
    diagnoseConnection
  };
};

/**
 * 使用示例
 */
export const WebSocketDebugExample = {
  setup() {
    const { testConnection, diagnoseConnection } = useWebSocketDebug();
    
    // 测试单个连接
    const testSingleConnection = async () => {
      try {
        const result = await testConnection('ws://192.168.1.100:8080');
        console.log('连接测试结果:', result);
      } catch (error) {
        console.error('连接测试失败:', error);
      }
    };
    
    // 诊断连接问题
    const diagnose = async () => {
      const result = await diagnoseConnection('ws://192.168.1.100:8080');
      console.log('诊断结果:', result);
    };
    
    return {
      testSingleConnection,
      diagnose
    };
  }
};
