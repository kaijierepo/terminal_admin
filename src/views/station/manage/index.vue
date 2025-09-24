<template>
  <div class="station-manage">
    <div class="flex">
      <div class="upgrade-package-section">
        <div class="section-title">
          <span>站点导入</span>
          <el-button size="small" plain @click="downloadTemplate">
            下载模板
          </el-button>
        </div>
        <ExcelFileUpload
          @excel-uploaded="handleExcelUploaded"
          @upload-error="handleUploadError"
          upload-text="点击选择 Excel 文件"
          upload-hint="支持 .xlsx 和 .xls 格式"
        />
      </div>
      <!-- 升级包上传区域 -->
      <div class="upgrade-package-section flex-1">
        <div class="section-title">
          <el-icon><Box /></el-icon>
          <span>升级包管理</span>
        </div>
        <div class="upload-container">
          <FileUpload
            :accept="'.zip'"
            :upload-text="'拖拽升级包到此处，或点击选择文件'"
            :upload-hint="'支持 .zip 格式，最大 200MB，可多选'"
            :max-size="200 * 1024 * 1024"
            :allowed-extensions="['.zip']"
            :multiple="true"
            @file-uploaded="handleUpgradePackageUpload"
            @files-uploaded="handleMultipleUpgradePackageUpload"
            @upload-error="handleUploadError"
          />
          <div v-if="uploadFiles.length > 0" class="files-list">
            <div class="files-header">
              <span>已上传的升级包 ({{ uploadFiles.length }} 个)</span>
              <div class="header-actions">
                <el-button
                  type="danger"
                  size="small"
                  plain
                  @click="clearAllFiles"
                  v-if="uploadFiles.length > 0"
                >
                  清空所有
                </el-button>
              </div>
            </div>
            <div
              class="file-item"
              v-for="(file, index) in uploadFiles"
              :key="index"
            >
              <div class="file-info">
                <span class="file-name">{{ file.fileName }}</span>
                <span class="file-size">{{ file.fileSize }}</span>
              </div>
              <div class="file-actions">
                <el-button
                  type="danger"
                  size="small"
                  plain
                  @click.stop="removeFile(index)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      
      <!-- 模型上传区域 -->
      <div class="upgrade-package-section flex-1">
        <div class="section-title">
          <el-icon><Upload /></el-icon>
          <span>模型管理</span>
        </div>
        <div class="upload-container">
          <FileUpload
            :upload-text="'拖拽模型文件到此处，或点击选择文件'"
            :upload-hint="'支持 .hjai 和 .onnx 格式，最大 100MB，可多选'"
            :multiple="true"
            :accept="'.hjai,.onnx'"
            :max-size="100 * 1024 * 1024"
            :allowed-extensions="['.hjai','.onnx']"
            @file-uploaded="handleModelUpload"
            @files-uploaded="handleMultipleModelUpload"
            @upload-error="handleUploadError"
          />
          <div v-if="modelFiles.length > 0" class="files-list">
            <div class="files-header">
              <span>已上传的模型文件 ({{ modelFiles.length }} 个)</span>
              <div class="header-actions">
                <el-button
                  type="danger"
                  size="small"
                  plain
                  @click="clearAllModelFiles"
                  v-if="modelFiles.length > 0"
                >
                  清空所有
                </el-button>
              </div>
            </div>
            <div
              class="file-item"
              v-for="(file, index) in modelFiles"
              :key="index"
            >
              <div class="file-info">
                <span class="file-name">{{ file.fileName }}</span>
                <span class="file-size">{{ file.fileSize }}</span>
              </div>
              <div class="file-actions">
                <el-button
                  type="danger"
                  size="small"
                  plain
                  @click.stop="removeModelFile(index)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <div class="page-header">
      <div class="header-actions">
        <el-button type="primary" plain @click="addStation">
          <el-icon><Plus /></el-icon>新增
        </el-button>
        <el-button type="success" plain @click="showScanDialog">
          <el-icon><Search /></el-icon>扫描站点
        </el-button>
        <span>共{{ stationList.length || 0 }}个站点</span>
      </div>
      <div class="header-search">
        <el-button
          plain
          @click="getAllSystemInfo"
          :disabled="stationList.length === 0"
        >
          <el-icon><Loading /></el-icon>刷新系统信息
        </el-button>
        <el-button
          type="danger"
          plain
          @click="deleteAllStations"
          :disabled="stationList.length === 0"
        >
          <el-icon><Delete /></el-icon>全部删除
        </el-button>
      </div>
    </div>

    <el-table
      :data="stationList"
      border
      stripe
      v-loading="loading"
      style="width: 100%"
    >
      <el-table-column type="index" label="序号" width="60"></el-table-column>
      <el-table-column prop="stationName" label="站点名" min-width="100">
        <template #default="{ row }">
          <span>{{ row.stationName }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="ip" label="IP地址" min-width="120">
        <template #default="{ row }">
          <span>{{ row.ip }}</span>
        </template>
      </el-table-column>
      <!-- 版本号列 -->
      <el-table-column label="SAP版本" min-width="100" align="center">
        <template #default="{ row }">
          <span v-if="row.systemInfo?.SapVersion">{{
            row.systemInfo.SapVersion
          }}</span>
          <span v-else class="no-data">-</span>
        </template>
      </el-table-column>

      <!-- WEB版本列 -->
      <el-table-column label="WEB版本" min-width="100" align="center">
        <template #default="{ row }">
          <span v-if="row.systemInfo?.WebVersion">{{
            row.systemInfo.WebVersion
          }}</span>
          <span v-else class="no-data">-</span>
        </template>
      </el-table-column>

      <!-- 系统启动时间列 -->
      <el-table-column label="系统启动时间" min-width="150" align="center">
        <template #default="{ row }">
          <span v-if="row.systemInfo?.result?.systemStartupTime">{{
            row.systemInfo.result.systemStartupTime
          }}</span>
          <span v-else class="no-data">-</span>
        </template>
      </el-table-column>

      <!-- 电脑启动时间列 -->
      <el-table-column label="电脑启动时间" min-width="150" align="center">
        <template #default="{ row }">
          <span v-if="row.systemInfo?.result?.computerStartupTime">{{
            row.systemInfo.result.computerStartupTime
          }}</span>
          <span v-else class="no-data">-</span>
        </template>
      </el-table-column>

      <!-- CPU使用率列 -->
      <el-table-column label="CPU使用率" min-width="100" align="center">
        <template #default="{ row }">
          <span v-if="row.systemInfo?.result?.cpu !== undefined"
            >{{ (row.systemInfo.result.cpu || 0).toFixed(1) }}%</span
          >
          <span v-else class="no-data">-</span>
        </template>
      </el-table-column>

      <!-- 内存使用列 -->
      <el-table-column label="内存使用" min-width="100" align="center">
        <template #default="{ row }">
          <span v-if="row.systemInfo?.result?.memory !== undefined"
            >{{ (row.systemInfo.result.memory || 0).toFixed(1) }}MB</span
          >
          <span v-else class="no-data">-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="420" fixed="right">
        <template #default="{ row, $index }">
          <el-button
            type="primary"
            size="small"
            plain
            @click="editStation(row)"
          >
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button
            type="success"
            size="small"
            plain
            @click="getSystemInfo(row)"
            :loading="row.loading"
          >
            {{ row.loading ? "获取中..." : "系统信息" }}
          </el-button>
          <el-button
            type="warning"
            size="small"
            @click="upgradeStation(row)"
            :disabled="uploadFiles.length === 0"
            :loading="row.upgradeLoading"
          >
            {{ row.upgradeLoading ? "升级中..." : "站点升级" }}
          </el-button>
          <el-button
            type="info"
            size="small"
            @click="uploadModelToStation(row)"
            :disabled="modelFiles.length === 0"
            :loading="row.modelUploadLoading"
          >
            {{ row.modelUploadLoading ? "上传中..." : "模型上传" }}
          </el-button>
          <el-button size="small" @click="jumpToStationWeb(row)">跳转站点</el-button>
          <el-button
            type="danger"
            size="small"
            plain
            @click="deleteStation(row, $index)"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑站点对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="stationForm"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="站点名" prop="stationName">
          <el-input
            v-model="stationForm.stationName"
            placeholder="请输入站点名"
            clearable
          />
        </el-form-item>
        <el-form-item label="IP地址" prop="ip">
          <el-input
            v-model="stationForm.ip"
            placeholder="请输入IPv4或IPv6地址，如：192.168.1.100 或 2001:db8::1"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 扫描站点组件 -->
    <StationScan 
      v-model="scanDialogVisible"
      @scan-complete="handleScanComplete"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Download,
  Upload,
  Plus,
  Delete,
  Edit,
  Loading,
  Refresh,
  Box,
  Search,
} from "@element-plus/icons-vue";
import * as XLSX from "xlsx";
import { requestGetSystemInfo, requestUpgradeVersion } from "@/api/config";
import { requestUploadFile } from "@/api/file";
import { formatIPForURL } from "@/utils/ipValidator";
import { useStationStore } from "@/store/modules/station";
import FileUpload from "@/components/FileUpload/index.vue";
import ExcelFileUpload from "@/components/FileUpload/ExcelFileUpload.vue";
import StationScan from "./components/StationScan/index.vue";

// Store 实例
const stationStore = useStationStore();

// 响应式数据
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref("新增站点");
const formRef = ref();

// 扫描相关数据
const scanDialogVisible = ref(false);

// 使用 store 中的站点列表
const stationList = computed(() => stationStore.getAllStations);

// 表单数据
const stationForm = reactive({
  originalIp: "", // 用于编辑时记录原始IP
  stationName: "",
  ip: "",
});

// 表单验证规则
const formRules = {
  stationName: [
    { required: true, message: "请输入站点名", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" },
  ],
  ip: [
    { required: true, message: "请输入IP地址", trigger: "blur" },
  ],
};

// 初始化数据
onMounted(() => {
  loadStationList();
});

// 加载站点列表
const loadStationList = () => {
  loading.value = true;
  try {
    stationStore.initStationList();
  } catch (error) {
    console.error("加载站点数据失败:", error);
  } finally {
    loading.value = false;
  }
};

// 下载模板
const downloadTemplate = () => {
  const template = [
    ["站点名", "IP地址"],
    ["示例站点1", "192.168.1.100"],
    ["示例站点2", "192.168.1.101"],
    ["IPv6站点1", "2001:db8::1"],
    ["IPv6站点2", "::1"],
  ];

  const ws = XLSX.utils.aoa_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "站点模板");

  XLSX.writeFile(wb, "站点导入模板.xlsx");
  ElMessage.success("模板下载成功");
};

// 处理 Excel 文件上传
const handleExcelUploaded = (data) => {
  try {
    const { data: jsonData } = data;
    
    // 跳过表头
    const stations = jsonData
      .slice(1)
      .map((row, index) => ({
        id: Date.now() + index,
        stationName: row[0] || "",
        ip: row[1] || "",
      }))
      .filter((station) => station.stationName && station.ip);

    if (stations.length === 0) {
      ElMessage.warning("文件中没有有效数据");
      return;
    }
    // 添加到列表
    stationStore.addStations(stations);
    ElMessage.success(`成功导入 ${stations.length} 个站点`);
  } catch (error) {
    ElMessage.error("文件解析失败，请检查文件格式");
  }
};

// 处理上传错误
const handleUploadError = (error) => {
  ElMessage.error(error);
};

// 新增站点
const addStation = () => {
  dialogTitle.value = "新增站点";
  dialogVisible.value = true;
};

// 编辑站点
const editStation = (row) => {
  dialogTitle.value = "编辑站点";
  stationForm.originalIp = row.ip;
  stationForm.stationName = row.stationName;
  stationForm.ip = row.ip;
  dialogVisible.value = true;
};

// 删除站点
const deleteStation = (row, index) => {
  ElMessageBox.confirm(`确定要删除站点"${row.stationName}"吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      stationStore.removeStation(row.ip);
      ElMessage.success("删除成功");
    })
    .catch(() => {
      // 取消删除
    });
};

// 全部删除站点
const deleteAllStations = () => {
  if (stationList.value.length === 0) {
    ElMessage.warning("没有站点数据可删除");
    return;
  }

  ElMessageBox.confirm(`确定要删除所有站点吗？此操作不可恢复！`, "警告", {
    confirmButtonText: "确定删除",
    cancelButtonText: "取消",
    type: "warning",
    confirmButtonClass: "el-button--danger",
  })
    .then(() => {
      stationStore.clearAllStations();
      ElMessage.success("已删除所有站点");
    })
    .catch(() => {
      // 取消删除
    });
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    if (stationForm.originalIp) {
      // 编辑模式
      try {
        const success = stationStore.updateStation(stationForm.originalIp, {
          stationName: stationForm.stationName,
          ip: stationForm.ip,
        });
        if (success) {
          ElMessage.success("更新成功");
        } else {
          ElMessage.error("更新失败");
        }
      } catch (error) {
        ElMessage.error(error.message);
        return;
      }
    } else {
      // 新增模式
      const newStation = {
        id: Date.now(),
        stationName: stationForm.stationName,
        ip: stationForm.ip,
      };
      try {
        stationStore.addStation(newStation);
        ElMessage.success("添加成功");
      } catch (error) {
        ElMessage.error(error.message);
      }
    }

    dialogVisible.value = false;
    resetForm();
  } catch (error) {
    // 验证失败
    console.warn(error);
  }
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  stationForm.originalIp = "";
  stationForm.stationName = "";
  stationForm.ip = "";
};

// 获取系统信息
const getSystemInfo = async (station) => {
  if (!station.ip) {
    ElMessage.error("站点IP地址不能为空");
    return;
  }

  // 设置加载状态
  station.loading = true;

  try {
    const response = await requestGetSystemInfo(station.ip);
    if (response) {
      // 直接更新响应式数据中的系统信息，不保存到localStorage
      station.systemInfo = response;
      ElMessage.success(`成功获取 ${station.stationName} 的系统信息`);
    } else {
      ElMessage.warning(`获取 ${station.stationName} 系统信息失败`);
    }
  } catch (error) {
    console.error("获取系统信息失败:", error);
    ElMessage.error(
      `获取 ${station.stationName} 系统信息失败: ${error.message || "网络错误"}`
    );
  } finally {
    // 清除加载状态
    station.loading = false;
  }
};

// 批量获取所有站点的系统信息
const getAllSystemInfo = async () => {
  if (stationList.value.length === 0) {
    ElMessage.warning("没有站点数据");
    return;
  }

  // 为所有没有系统信息的站点添加loading状态
  const stationsToUpdate = stationList.value.filter(
    (station) => !station.systemInfo
  );

  if (stationsToUpdate.length === 0) {
    ElMessage.info("所有站点都已获取过系统信息");
    return;
  }

  try {
    // 逐个请求系统信息
    for (let i = 0; i < stationsToUpdate.length; i++) {
      const station = stationsToUpdate[i];

      // 设置单个站点的loading状态
      station.loading = true;

      try {
        const response = await requestGetSystemInfo(station.ip);
        if (response && response.result) {
          // 直接更新响应式数据中的系统信息，不保存到localStorage
          station.systemInfo = response;
          ElMessage.success(`成功获取 ${station.stationName} 的系统信息`);
        } else {
          ElMessage.warning(`获取 ${station.stationName} 系统信息失败`);
        }
      } catch (error) {
        console.error(`获取 ${station.stationName} 系统信息失败:`, error);
        ElMessage.error(
          `获取 ${station.stationName} 系统信息失败: ${
            error.message || "网络错误"
          }`
        );
      } finally {
        // 清除单个站点的loading状态
        station.loading = false;
      }

      // 添加延迟，避免请求过于频繁
      if (i < stationsToUpdate.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // 批量获取完成
    ElMessage.success(`批量获取完成，共处理 ${stationsToUpdate.length} 个站点`);
  } catch (error) {
    console.error("批量获取系统信息失败:", error);
    ElMessage.error("批量获取系统信息失败");
  }
};

const uploadFiles = ref([]);
const modelFiles = ref([]);

// 处理单个升级包上传
const handleUpgradePackageUpload = async (uploadData) => {
  loading.value = true;
  const { fileSize, fileName, file, ...others } = uploadData;

  // 直接使用原始文件对象，不需要转换
  const fileInfo = {
    fileName,
    fileSize: `${(fileSize / 1024 / 1024).toFixed(2)}MB`,
    file, // 直接使用原始文件对象
    ...others,
  };

  uploadFiles.value.push(fileInfo);
  loading.value = false;
  ElMessage.success(`升级包 "${fileName}" 上传成功！`);
};

// 处理多个升级包上传
const handleMultipleUpgradePackageUpload = async (filesData) => {
  loading.value = true;
  const processedFiles = [];

  for (const uploadData of filesData) {
    const { fileSize, fileName, file, ...others } = uploadData;

    // 直接使用原始文件对象，不需要转换
    const fileInfo = {
      fileName,
      fileSize: `${(fileSize / 1024 / 1024).toFixed(2)}MB`,
      file, // 直接使用原始文件对象
      ...others,
    };

    processedFiles.push(fileInfo);
  }

  uploadFiles.value.push(...processedFiles);
  loading.value = false;
  ElMessage.success(`成功处理 ${processedFiles.length} 个升级包文件！`);
};

// 删除文件
const removeFile = (index) => {
  uploadFiles.value.splice(index, 1);
  ElMessage.success("文件已删除");
};

// 清空所有文件
const clearAllFiles = () => {
  uploadFiles.value = [];
  ElMessage.success("已清空所有文件");
};

// 处理单个模型文件上传
const handleModelUpload = async (uploadData) => {
  loading.value = true;
  const { fileSize, fileName, file, ...others } = uploadData;

  // 直接使用原始文件对象，不需要转换
  const fileInfo = {
    fileName,
    fileSize: `${(fileSize / 1024 / 1024).toFixed(2)}MB`,
    file, // 直接使用原始文件对象
    ...others,
  };

  modelFiles.value.push(fileInfo);
  loading.value = false;
  ElMessage.success(`模型文件 "${fileName}" 上传成功！`);
};

// 处理多个模型文件上传
const handleMultipleModelUpload = async (filesData) => {
  loading.value = true;
  const processedFiles = [];

  for (const uploadData of filesData) {
    const { fileSize, fileName, file, ...others } = uploadData;

    // 直接使用原始文件对象，不需要转换
    const fileInfo = {
      fileName,
      fileSize: `${(fileSize / 1024 / 1024).toFixed(2)}MB`,
      file, // 直接使用原始文件对象
      ...others,
    };

    processedFiles.push(fileInfo);
  }

  modelFiles.value.push(...processedFiles);
  loading.value = false;
  ElMessage.success(`成功处理 ${processedFiles.length} 个模型文件！`);
};

// 删除模型文件
const removeModelFile = (index) => {
  modelFiles.value.splice(index, 1);
  ElMessage.success("模型文件已删除");
};

// 清空所有模型文件
const clearAllModelFiles = () => {
  modelFiles.value = [];
  ElMessage.success("已清空所有模型文件");
};

// 模型上传到站点功能
const uploadModelToStation = async (station) => {
  if (modelFiles.value.length === 0) {
    ElMessage.warning("请先上传模型文件");
    return;
  }

  if (!station.ip) {
    ElMessage.error("站点IP地址不能为空");
    return;
  }

  const fileNames = modelFiles.value.map((file) => file.fileName).join("、");

  // 确认上传操作
  try {
    await ElMessageBox.confirm(
      `确定要将模型文件上传到站点"${station.stationName}"吗？\n模型文件：${fileNames}`,
      "确认上传",
      {
        confirmButtonText: "确定上传",
        cancelButtonText: "取消",
        type: "warning",
      }
    );
  } catch {
    return; // 用户取消
  }

  // 设置当前站点的上传loading状态
  station.modelUploadLoading = true;

  try {
    // 调用requestUploadFile接口上传所有模型文件
    const uploadPromises = modelFiles.value.map(async (fileInfo, index) => {
      const { fileName, file } = fileInfo;
      const uploadResponse = await requestUploadFile(station.ip, "82", {
        fileName,
        dir: "/run/Models",
        file, // 直接传递原始文件对象
      });

      if (!uploadResponse) {
        throw new Error(`上传模型文件 "${fileName}" 失败`);
      }

      return fileName;
    });

    // 等待所有文件上传完成
    const uploadedFileNames = await Promise.all(uploadPromises);
    ElMessage.success(
      `所有模型文件上传成功！共 ${uploadedFileNames.length} 个文件`
    );
  } catch (error) {
    console.error("模型文件上传失败:", error);
    ElMessage.error(`模型文件上传失败: ${error.message || "未知错误"}`);
  } finally {
    // 清除当前站点的上传loading状态
    station.modelUploadLoading = false;
  }
};

// 站点升级功能
const upgradeStation = async (station) => {
  if (uploadFiles.value.length === 0) {
    ElMessage.warning("请先上传升级包");
    return;
  }

  if (!station.ip) {
    ElMessage.error("站点IP地址不能为空");
    return;
  }

  const fileNames = uploadFiles.value.map((file) => file.fileName).join("、");

  // 确认升级操作
  try {
    await ElMessageBox.confirm(
      `确定要对站点"${station.stationName}"进行升级吗？\n升级包：${fileNames}`,
      "确认升级",
      {
        confirmButtonText: "确定升级",
        cancelButtonText: "取消",
        type: "warning",
      }
    );
  } catch {
    return; // 用户取消
  }

  // 设置当前站点的升级loading状态
  station.upgradeLoading = true;

  try {
    // 第一步：调用多次requestUploadFile接口上传所有升级包
    const uploadPromises = uploadFiles.value.map(async (fileInfo, index) => {
      const { fileName, file } = fileInfo;
      const uploadResponse = await requestUploadFile(station.ip, "82", {
        fileName,
        dir: "/run",
        file, // 直接传递原始文件对象
      });

      if (!uploadResponse) {
        throw new Error(`上传升级包 "${fileName}" 失败`);
      }

      return fileName;
    });

    // 等待所有文件上传完成
    const uploadedFileNames = await Promise.all(uploadPromises);
    ElMessage.success(
      `所有升级包上传成功！共 ${uploadedFileNames.length} 个文件`
    );

    // 第二步：调用requestUpgradeVersion接口执行升级
    ElMessage.info("正在执行站点升级...");
    const upgradeParams = uploadedFileNames.map((fileName) => ({
      dir_type: "run",
      path: fileName,
    }));

    const upgradeResponse = await requestUpgradeVersion(
      station.ip,
      upgradeParams
    );

    if (!upgradeResponse) {
      throw new Error("站点升级失败");
    }

    ElMessage.success(
      `站点"${station.stationName}"升级成功！使用了 ${uploadedFileNames.length} 个升级包`
    );

    // 升级成功后，可以选择刷新系统信息
    setTimeout(() => {
      getSystemInfo(station);
    }, 10 * 1000);
  } catch (error) {
    console.error("站点升级失败:", error);
    ElMessage.error(`站点升级失败: ${error.message || "未知错误"}`);
  } finally {
    // 清除当前站点的升级loading状态
    station.upgradeLoading = false;
  }
};

const jumpToStationWeb = (station) => {
  window.open(`http://${formatIPForURL(station.ip)}:81/`, "_blank");
};

// 显示扫描对话框
const showScanDialog = () => {
  scanDialogVisible.value = true;
};

// 处理扫描完成
const handleScanComplete = (result) => {
  console.log('扫描完成:', result);
  // 可以在这里添加额外的处理逻辑
};
</script>

<style scoped>
.station-manage {
  padding: 10px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-upload) {
  display: inline-block;
}

:deep(.el-table .el-table__row:hover) {
  background-color: #f5f7fa;
}

.system-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item .label {
  font-size: 12px;
  color: #909399;
  min-width: 60px;
}

.info-item .value {
  font-size: 12px;
  color: #303133;
  font-weight: 500;
}

.loading-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 12px;
}

.no-info {
  display: flex;
  justify-content: center;
}

.header-search {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 新增的样式 */
.no-data {
  color: #c0c4cc;
  font-style: italic;
}

:deep(.el-table) {
  .el-table__header {
    th {
      background-color: #f5f7fa;
      color: #606266;
      font-weight: 600;
    }
  }

  .el-table__body {
    td {
      padding: 8px 0;
    }
  }
}

:deep(.el-button) {
  margin: 2px;
}

:deep(.el-table__fixed-right) {
  .el-button {
    margin: 2px;
  }
}

/* 升级包上传区域样式 */
.upgrade-package-section {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.section-title .el-icon {
  font-size: 18px;
  color: #409eff;
}

.upload-container {
  display: flex;
  gap: 20px;
  align-items: flex-end;
}

.tip {
  background-color: #e8f4fd;
  border: 1px solid #b3d8ff;
  border-radius: 6px;
  padding: 12px;
  margin-top: 12px;
  flex: 1;
}

.tip p {
  margin: 4px 0;
  font-size: 14px;
  color: #409eff;
}

.tip p:first-child {
  font-weight: 600;
}

/* 多文件列表样式 */
.files-list {
  margin-top: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background-color: #fafafa;
}

.files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.3s;
}

.file-item:last-child {
  border-bottom: none;
}

.file-item:hover {
  background-color: #f0f9ff;
}

.file-info {
  flex: 1;
}

.file-name {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.file-size {
  margin: 0 0 0 20px;
  font-size: 12px;
  color: #909399;
}

.file-actions {
  margin-left: 12px;
}

</style>
