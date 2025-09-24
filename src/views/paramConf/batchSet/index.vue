<template>
  <div class="batch-set-config">
    <!-- 左侧站点列表 -->
    <div class="site-panel">
      <div class="panel-header">
        <h3>站点列表</h3>
      </div>
      
      <div class="site-list">
        <el-table
          :data="siteList"
          border
          height="calc(100vh - 160px)"
          @selection-change="handleSelectionChange">
          <el-table-column
            type="selection"
            width="55">
          </el-table-column>
          <el-table-column
            prop="stationName"
            label="站点名称"
            min-width="120">
          </el-table-column>
          <el-table-column
            prop="ip"
            label="IP地址"
            min-width="140">
          </el-table-column>
          <el-table-column
            prop="status"
            label="设置状态"
            width="100"
            align="center">
            <template #default="scope">
              <el-tag
                :type="scope.row.status === '已完成' ? 'success' : 'warning'"
                size="small">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <div class="action-area">
        <el-button 
          type="success" 
          plain
          @click="handleClearStatus">
          清空状态
        </el-button>
        <el-button 
          type="primary" 
          :disabled="selectedSites.length === 0"
          @click="handleBatchSet">
          批量设置 ({{ selectedSites.length }})
        </el-button>
      </div>
    </div>

    <!-- 右侧配置设置 -->
    <div class="config-panel">
      <div class="panel-header">
        <h3>配置设置</h3>
        <div class="header-actions">
          <el-button 
            type="info" 
            size="small"
            @click="handleLoadTemplate">
            加载模板
          </el-button>
          <el-button 
            type="warning" 
            size="small"
            @click="handleClearConfig">
            清空配置
          </el-button>
        </div>
      </div>
      
      <div class="config-input">
        <!-- 文件拖拽上传组件 -->
        <file-upload
          accept=".ini,.txt"
          upload-text="拖拽 INI 文件到此处，或点击选择文件"
          upload-hint="支持 .ini 和 .txt 格式"
          @file-uploaded="handleFileUploaded"
          @upload-error="handleUploadError">
        </file-upload>
        
        <!-- 配置输入区域 -->
        <div class="textarea-container">
          <el-input
            v-model="configIni"
            type="textarea"
            :rows="20"
            placeholder="请输入INI格式的配置，例如：&#10;[TLPGE20061115]&#10;AppTitle=JHD综合监测系统 V2.0&#10;LogLevel=INFO&#10;Port=8080&#10;AlarmRemarksName_0=报警备注名称&#10;AlarmRemarksValue_0=报警备注值"
            :class="{ 'error': iniError }">
          </el-input>
          
          <div v-if="iniError" class="error-tip">
            <el-icon><Warning /></el-icon>
            <span>{{ iniError }}</span>
          </div>
        </div>
      </div>
      
      <div class="config-info">
        <p><strong>配置格式说明：</strong></p>
        <ul>
          <li>使用INI格式，支持分组和键值对</li>
          <li>分组格式：[分组名]，如：[TLPGE20061115]</li>
          <li>键值对格式：键=值，如：AppTitle=JHD综合监测系统 V2.0</li>
          <li>支持注释，以#开头的行为注释</li>
          <li>提交时会自动转换为JSON格式</li>
        </ul>
      </div>
    </div>

    <!-- 进度弹窗 -->
    <el-dialog
      title="批量设置进度"
      :model-value="progressVisible"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false">
      <div class="progress-content">
        <div class="progress-info">
          <span>正在处理：{{ currentSite?.stationName || '' }}</span>
          <span>{{ progress.current }}/{{ progress.total }}</span>
        </div>
        <el-progress 
          :percentage="progress.percentage"
          :status="progress.status">
        </el-progress>
        
        <div class="progress-details">
          <div v-if="progress.success.length > 0" class="success-list">
            <h4>成功 ({{ progress.success.length }})：</h4>
            <el-tag 
              v-for="site in progress.success" 
              :key="site.ip"
              type="success"
              size="small"
              class="site-tag">
              {{ site.stationName }}
            </el-tag>
          </div>
          
          <div v-if="progress.failed.length > 0" class="failed-list">
            <h4>失败 ({{ progress.failed.length }})：</h4>
            <el-tag 
              v-for="site in progress.failed" 
              :key="site.ip"
              type="danger"
              size="small"
              class="site-tag">
              {{ site.stationName }}
            </el-tag>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button 
          v-if="!progress.completed"
          @click="handleCancelBatch">
          取消
        </el-button>
        <el-button 
          v-else
          type="primary"
          @click="progressVisible = false">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { requestSetProjectConf } from '@/api/config'
import { useStationStore } from '@/store/modules/station'
import FileUpload from '@/components/FileUpload/index.vue'

export default {
  name: 'BatchSetConfig',
  
  components: {
    FileUpload
  },
  
  data() {
    return {
      // 选中的站点
      selectedSites: [],
      // 站点状态映射
      siteStatusMap: {},
      // 配置INI
      configIni: '',
      // INI解析错误
      iniError: '',
      // 进度弹窗
      progressVisible: false,
      // 当前处理的站点
      currentSite: null,
      // 进度信息
      progress: {
        current: 0,
        total: 0,
        percentage: 0,
        status: '',
        success: [],
        failed: [],
        completed: false
      },
      // 是否取消操作
      isCancelled: false
    }
  },
  
  computed: {
    // 使用 store 中的站点列表
    stationStore() {
      return useStationStore()
    },
    // 同步 store 中的站点数据，并添加状态字段
    siteList() {
      return this.stationStore.getAllStations.map(site => ({
        ...site,
        status: this.siteStatusMap[site.ip] || '未完成'
      }))
    }
  },
  
  created() {
    // 初始化 store 中的站点列表
    this.stationStore.initStationList()
  },
  
  methods: {
    // 刷新站点列表
    handleRefreshSites() {
      // 由于使用了 computed 属性，数据会自动同步，这里只需要提示用户
      this.$message.success('站点列表已刷新')
    },
    
    // 处理站点选择变化
    handleSelectionChange(selection) {
      this.selectedSites = selection
    },
    
    // 加载配置模板
    handleLoadTemplate() {
      this.configIni = `[TLPGE20061115]
AppTitle=JHD综合监测系统 V2.0
LogLevel=INFO
Port=8080
AlarmRemarksName_0=报警备注名称
AlarmRemarksValue_0=报警备注值`
      this.$message.success('配置模板已加载')
    },
    
    // 清空配置
    handleClearConfig() {
      this.configIni = ''
      this.iniError = ''
      this.$message.success('配置已清空')
    },
    
    // 清空状态
    handleClearStatus() {
      // 由于 siteList 是 computed 属性，状态信息需要存储在其他地方
      // 这里我们使用一个单独的响应式对象来存储状态
      this.siteStatusMap = {}
      this.$message.success('状态已清空')
    },
    
    // 验证INI格式并转换为JSON
    validateIni() {
      try {
        if (!this.configIni.trim()) {
          this.iniError = '请输入配置内容'
          return false
        }
        
        const config = this.parseIniToJson(this.configIni)
        if (typeof config !== 'object' || config === null) {
          this.iniError = '配置格式错误'
          return false
        }
        
        if (Object.keys(config).length === 0) {
          this.iniError = '配置不能为空'
          return false
        }
        
        this.iniError = ''
        return config
      } catch (error) {
        this.iniError = `INI格式错误: ${error.message}`
        return false
      }
    },
    
    // 将INI格式转换为JSON
    parseIniToJson(iniContent) {
      const lines = iniContent.split('\n')
      const result = {}
      let currentSection = ''
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        
        // 跳过空行和注释行
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          continue
        }
        
        // 检查是否是分组行 [section]
        if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
          currentSection = trimmedLine.slice(1, -1)
          continue
        }
        
        // 解析键值对
        const equalIndex = trimmedLine.indexOf('=')
        if (equalIndex > 0) {
          const key = trimmedLine.substring(0, equalIndex).trim()
          const value = trimmedLine.substring(equalIndex + 1).trim()
          
          // 如果有分组，则使用 分组名.键名 的格式
          const fullKey = currentSection ? `${currentSection}.${key}` : key
          result[fullKey] = value
        }
      }
      
      return result
    },
    
    // 批量设置
    async handleBatchSet() {
      const config = this.validateIni()
      if (!config) {
        return
      }
      
      if (this.selectedSites.length === 0) {
        this.$message.warning('请选择要设置的站点')
        return
      }
      
      try {
        await this.startBatchSet(this.selectedSites, config)
      } catch (error) {
        console.error('批量设置失败:', error)
        this.$message.error('批量设置失败')
      }
    },
    
    // 开始批量设置
    async startBatchSet(sites, config) {
      this.progressVisible = true
      this.isCancelled = false
      
      // 初始化进度
      this.progress = {
        current: 0,
        total: sites.length,
        percentage: 0,
        status: '',
        success: [],
        failed: [],
        completed: false
      }
      
      // 转换为配置格式
      const configArray = Object.entries(config).map(([key, value]) => `${key}=${value}`)
      console.log('转换后的配置:', configArray)
      // 逐个处理站点
      for (let i = 0; i < sites.length; i++) {
        if (this.isCancelled) {
          break
        }
        
        const site = sites[i]
        this.currentSite = site
        this.progress.current = i + 1
        this.progress.percentage = Math.floor(((i + 1) / sites.length) * 100)
        
        try {
          // 调用API设置配置
          const res = await requestSetProjectConf(site.ip, configArray)
          
          if (res.error) {
            throw new Error(res.error.message || '设置失败')
          }
          
          // 更新站点状态
          this.siteStatusMap[site.ip] = '已完成'
          this.progress.success.push(site)
          this.progress.status = 'success'
          
        } catch (error) {
          console.error(`站点 ${site.stationName} 设置失败:`, error)
          this.progress.failed.push(site)
          this.progress.status = 'exception'
        }
        
        // 添加延迟，让进度条动画更平滑
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      // 完成
      this.progress.completed = true
      this.currentSite = null
      
      // 显示结果
      const successCount = this.progress.success.length
      const failedCount = this.progress.failed.length
      
      if (failedCount === 0) {
        this.$message.success(`批量设置完成，成功 ${successCount} 个站点`)
      } else if (successCount === 0) {
        this.$message.error(`批量设置失败，失败 ${failedCount} 个站点`)
      } else {
        this.$message.warning(
          `批量设置完成，成功 ${successCount} 个站点，失败 ${failedCount} 个站点`
        )
      }
    },
    
    // 取消批量操作
    handleCancelBatch() {
      this.isCancelled = true
      this.progressVisible = false
      this.$message.info('批量操作已取消')
    },
    
    // 处理文件上传成功
    handleFileUploaded(data) {
      this.configIni = data.content
      this.iniError = '' // 清空之前的错误信息
      this.$message.success(`文件 "${data.fileName}" 上传成功`)
    },
    
    // 处理文件上传错误
    handleUploadError(errorMsg) {
      this.$message.error(errorMsg)
    }
  }
}
</script>

<style lang="scss" scoped>
.batch-set-config {
  display: flex;
  gap: 10px;
  height: 100%;
  box-sizing: border-box;

  
  .panel-header {
    padding-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      margin: 0;
    }
  }
  
  .site-panel {
    width: 500px;
    height: 100%;
    flex-shrink: 0;
    background-color: #fff;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    
    .site-list {
      flex: 1;
    }
    
    .action-area {
      display: flex;
      gap: 10px;
      
      .el-button {
        flex: 1;
      }
    }
  }
  
  .config-panel {
    flex: 1;
    height: 100%;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    
    .config-input {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
      
      .textarea-container {
        flex: 1;
        
        .el-textarea {
          height: 100%;
          
          &.error {
            :deep(.el-textarea__inner) {
              border-color: #f56c6c;
            }
          }
        }
        
        .error-tip {
          margin-top: 10px;
          color: #f56c6c;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 14px;
        }
      }
    }
    
    .config-info {
      padding: 20px 20px 0;
      background-color: #f5f7fa;
      
      p {
        font-weight: 500;
        color: #303133;
      }
      
      ul {
        margin: 0;
        padding-left: 20px;
        color: #606266;
      }
    }
  }
}

// 进度弹窗样式
.progress-content {
  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
    color: #606266;
    font-size: 14px;
  }
  
  .progress-details {
    margin-top: 20px;
    
    h4 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #303133;
    }
    
    .site-tag {
      margin-right: 8px;
      margin-bottom: 5px;
    }
    
    .success-list {
      margin-bottom: 15px;
    }
    
    .failed-list {
      margin-bottom: 15px;
    }
  }
}

// 表格样式
:deep(.el-table) {
  th {
    background-color: #f5f7fa;
    color: #606266;
  }
  
  .el-table__header-wrapper {
    border-bottom: 1px solid #EBEEF5;
  }
}

// 标签样式
:deep(.el-tag) {
  &.el-tag--success {
    background-color: #f0f9ff;
    border-color: #67c23a;
    color: #67c23a;
  }
  
  &.el-tag--warning {
    background-color: #fdf6ec;
    border-color: #e6a23c;
    color: #e6a23c;
  }
}
</style>
