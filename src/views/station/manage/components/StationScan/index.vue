<template>
  <el-dialog
    v-model="visible"
    title="扫描站点"
    width="600px"
    @close="handleClose"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="70px"
      >
        <el-form-item label="起始IP" prop="startIp">
          <el-input
            v-model="form.startIp"
            placeholder="请输入起始IP，如：192.168.2.80"
            clearable
            :disabled="scanning"
          />
        </el-form-item>
        <el-form-item label="结束IP" prop="endIp">
          <el-input
            v-model="form.endIp"
            placeholder="请输入结束IP，如：192.168.2.90"
            clearable
            :disabled="scanning"
          />
        </el-form-item>
        <div class="scan-tip">
          将扫描 {{ form.startIp || 'xxx.xxx.xxx.xxx' }} 到 {{ form.endIp || 'xxx.xxx.xxx.xxx' }} 的所有IP地址，需要花费一些时间
        </div>
      </el-form>
    
    <!-- 扫描进度 -->
    <div v-if="scanning" class="scan-progress">
      <el-progress 
        :percentage="scanProgress" 
        :status="scanProgress === 100 ? 'success' : ''"
      />
      <div class="scan-status">
        <span>正在扫描: {{ currentScanIp }}</span>
        <span>已扫描: {{ scannedCount }}/{{ totalScanCount }}</span>
      </div>
    </div>

    <!-- 扫描结果 -->
    <div v-if="scanResults.length > 0" class="scan-results">
      <div class="results-header">
        <span>扫描结果 ({{ scanResults.length }} 个站点)</span>
      </div>
      <div class="results-list">
        <div 
          v-for="(result, index) in scanResults" 
          :key="index"
          class="result-item"
          :class="{ 'success': result.success, 'error': !result.success }"
        >
          <div class="result-info">
            <span class="ip">{{ result.ip }}</span>
            <span v-if="result.success" class="station-name">{{ result.stationName }}</span>
            <span v-else class="error-msg">{{ result.error }}</span>
          </div>
          <div class="result-status">
            <el-icon v-if="result.success" color="#67c23a"><Check /></el-icon>
            <el-icon v-else color="#f56c6c"><Close /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">
          取消
        </el-button>
        <el-button 
          type="primary" 
          @click="startScan"
          :disabled="scanning || !form.startIp || !form.endIp"
          :loading="scanning"
        >
          {{ scanning ? '扫描中...' : '开始扫描' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from "vue";
import { ElMessage } from "element-plus";
import { Check, Close } from "@element-plus/icons-vue";
import { requestGetSystemInfo } from "@/api/config";
import { useStationStore } from "@/store/modules/station";

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['update:modelValue', 'scan-complete']);

// Store 实例
const stationStore = useStationStore();

// 响应式数据
const visible = ref(false);
const formRef = ref();
const scanning = ref(false);
const scanProgress = ref(0);
const currentScanIp = ref('');
const scannedCount = ref(0);
const totalScanCount = ref(0);
const scanResults = ref([]);
const scanController = ref(null); // 用于控制扫描停止

// 表单数据
const form = reactive({
  startIp: "",
  endIp: "",
});

// 表单验证规则
const formRules = {
  startIp: [
    { required: true, message: "请输入起始IP", trigger: "blur" },
    { 
      pattern: /^(\d{1,3}\.){3}\d{1,3}$/, 
      message: "请输入正确的IP格式，如：192.168.2.80", 
      trigger: "blur" 
    },
  ],
  endIp: [
    { required: true, message: "请输入结束IP", trigger: "blur" },
    { 
      pattern: /^(\d{1,3}\.){3}\d{1,3}$/, 
      message: "请输入正确的IP格式，如：192.168.2.90", 
      trigger: "blur" 
    },
    {
      validator: (rule, value, callback) => {
        if (form.startIp && value) {
          if (!isValidIpRange(form.startIp, value)) {
            callback(new Error('结束IP必须大于起始IP'));
          } else {
            callback();
          }
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
};

// IP范围验证和生成工具函数
const isValidIpRange = (startIp, endIp) => {
  const startParts = startIp.split('.').map(Number);
  const endParts = endIp.split('.').map(Number);
  
  // 检查IP格式是否正确
  if (startParts.length !== 4 || endParts.length !== 4) return false;
  if (startParts.some(part => part < 0 || part > 255) || endParts.some(part => part < 0 || part > 255)) return false;
  
  // 比较IP大小
  for (let i = 0; i < 4; i++) {
    if (startParts[i] > endParts[i]) return false;
    if (startParts[i] < endParts[i]) return true;
  }
  return true; // 相等也认为是有效的
};

// 生成IP范围列表
const generateIpList = (startIp, endIp) => {
  const startParts = startIp.split('.').map(Number);
  const endParts = endIp.split('.').map(Number);
  const ipList = [];
  
  // 将IP转换为数字进行比较
  const startNum = startParts[0] * 256 * 256 * 256 + startParts[1] * 256 * 256 + startParts[2] * 256 + startParts[3];
  const endNum = endParts[0] * 256 * 256 * 256 + endParts[1] * 256 * 256 + endParts[2] * 256 + endParts[3];
  
  for (let num = startNum; num <= endNum; num++) {
    const ip = [
      Math.floor(num / (256 * 256 * 256)),
      Math.floor((num % (256 * 256 * 256)) / (256 * 256)),
      Math.floor((num % (256 * 256)) / 256),
      num % 256
    ].join('.');
    ipList.push(ip);
  }
  
  return ipList;
};

// 监听 visible 变化
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal;
  if (newVal) {
    resetForm();
  }
});

// 监听 visible 变化并同步到父组件
watch(visible, (newVal) => {
  emit('update:modelValue', newVal);
});

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  form.startIp = "";
  form.endIp = "";
  scanResults.value = [];
  scanProgress.value = 0;
  scannedCount.value = 0;
  totalScanCount.value = 0;
  currentScanIp.value = "";
  stopScan();
};

// 停止扫描
const stopScan = () => {
  if (scanController.value) {
    scanController.value.abort();
    scanController.value = null;
  }
  scanning.value = false;
  currentScanIp.value = "";
};

// 处理关闭
const handleClose = () => {
  if (scanning.value) {
    stopScan();
    ElMessage.info("扫描已停止");
  }
  visible.value = false;
};

// 处理取消
const handleCancel = () => {
  if (scanning.value) {
    stopScan();
    ElMessage.info("扫描已停止");
  } else {
    visible.value = false;
  }
};

// 开始扫描
const startScan = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    
    scanning.value = true;
    scanResults.value = [];
    scanProgress.value = 0;
    scannedCount.value = 0;
    
    const newStations = [];
    const updatedStations = [];
    
    // 创建 AbortController 用于停止扫描
    scanController.value = new AbortController();
    
    // 生成要扫描的IP列表
    const ipList = generateIpList(form.startIp, form.endIp);
    totalScanCount.value = ipList.length;
    
    // 逐个扫描IP
    for (let i = 0; i < ipList.length; i++) {
      // 检查是否被停止
      if (scanController.value.signal.aborted) {
        break;
      }
      
      const ip = ipList[i];
      currentScanIp.value = ip;
      scannedCount.value = i + 1;
      scanProgress.value = Math.round(((i + 1) / ipList.length) * 100);
      
      try {
        // 调用getSystemInfo接口
        const response = await requestGetSystemInfo(ip);
        
        // 再次检查是否被停止
        if (scanController.value.signal.aborted) {
          break;
        }
        
        if (response && response.result) {
          // 检查IP是否已存在
          const existingStation = stationStore.getAllStations.find(station => station.ip === ip);
          
          if (existingStation) {
            // 已存在的IP，更新systemInfo
            existingStation.systemInfo = response;
            updatedStations.push({
              ip,
              stationName: existingStation.stationName,
              success: true,
              isUpdate: true
            });
          } else {
            // 新IP，添加到站点列表
            const newStation = {
              id: Date.now() + i,
              stationName: `站点-${ip}`,
              ip: ip,
              systemInfo: response
            };
            stationStore.addStation(newStation);
            newStations.push({
              ip,
              stationName: newStation.stationName,
              success: true,
              isUpdate: false
            });
          }
        } else {
          // 没有响应，记录为失败
          scanResults.value.push({
            ip,
            success: false,
            error: "无响应"
          });
        }
      } catch (error) {
        // 检查是否是被停止导致的错误
        if (scanController.value.signal.aborted) {
          break;
        }
        // 请求失败
        scanResults.value.push({
          ip,
          success: false,
          error: error.message || "连接失败"
        });
      }
      
      // 添加延迟，避免请求过于频繁
      if (i < ipList.length - 1 && !scanController.value.signal.aborted) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // 添加成功的结果到扫描结果中
    scanResults.value.unshift(...updatedStations, ...newStations);
    
    // 扫描完成
    scanning.value = false;
    currentScanIp.value = "";
    scanController.value = null;
    
    const successCount = scanResults.value.filter(r => r.success).length;
    const newCount = newStations.length;
    const updateCount = updatedStations.length;
    
    ElMessage.success(
      `扫描完成！发现 ${successCount} 个站点，新增 ${newCount} 个，更新 ${updateCount} 个`
    );
    
    // 通知父组件扫描完成
    emit('scan-complete', {
      successCount,
      newCount,
      updateCount,
      results: scanResults.value
    });
    
  } catch (error) {
    scanning.value = false;
    currentScanIp.value = "";
    scanController.value = null;
    console.error("扫描失败:", error);
    ElMessage.error("扫描失败，请检查网段格式");
  }
};
</script>

<style scoped>
.scan-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.scan-progress {
  margin: 20px 0;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.scan-status {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 14px;
  color: #606266;
}

.scan-results {
  margin-top: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background-color: #fafafa;
}

.results-header {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 600;
  color: #303133;
  border-radius: 6px 6px 0 0;
}

.results-list {
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.3s;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item.success {
  background-color: #f0f9ff;
}

.result-item.error {
  background-color: #fef0f0;
}

.result-item:hover {
  background-color: #e6f7ff;
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-info .ip {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.result-info .station-name {
  font-size: 12px;
  color: #67c23a;
  font-weight: 500;
}

.result-info .error-msg {
  font-size: 12px;
  color: #f56c6c;
}

.result-status {
  margin-left: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
