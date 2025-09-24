<template>
  <el-dialog
    v-model="dialogVisible"
    title="配置信息查看"
    width="800px"
    :before-close="handleClose"
    destroy-on-close>
    
    <div class="view-config-content">
      <!-- 站点基本信息 -->
      <div class="station-info">
        <h3>站点信息</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="站点名称">
            {{ configData.stationName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="IP地址">
            {{ configData.ip || '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 配置项信息 -->
      <div class="config-info" v-if="configItems.length > 0">
        <h3>配置项信息</h3>
        <el-table
          :data="configItems"
          border
          style="width: 100%"
          max-height="400">
          <el-table-column
            prop="field"
            label="字段名"
            width="200"
            show-overflow-tooltip>
          </el-table-column>
          <el-table-column
            prop="label"
            label="说明"
            width="200"
            show-overflow-tooltip>
          </el-table-column>
          <el-table-column
            prop="value"
            label="当前值"
            min-width="200">
            <template #default="scope">
              {{ scope.row.value || '未设置' }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 无配置项提示 -->
      <div class="no-config" v-else>
        <el-empty description="暂无配置项信息" />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'ViewConfigDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    configData: {
      type: Object,
      default: () => ({})
    },
    checkItems: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:visible', 'refresh'],
  data() {
    return {
      loading: false
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(value) {
        this.$emit('update:visible', value)
      }
    },
    configItems() {
      if (!this.checkItems.length || !this.configData) {
        return []
      }
      
      return this.checkItems.map(item => ({
        field: item.field || item.key,
        label: item.label || '无说明',
        value: this.configData[item.key] || ''
      }))
    }
  },
  methods: {
    handleClose() {
      this.dialogVisible = false
    },
    async handleRefresh() {
      this.loading = true
      try {
        this.$emit('refresh', this.configData)
      } catch (error) {
        this.$message.error('刷新失败')
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.view-config-content {
  .station-info {
    margin-bottom: 24px;
    
    h3 {
      margin: 0 0 16px 0;
      color: #303133;
      font-size: 16px;
      font-weight: 500;
    }
  }
  
  .config-info {
    h3 {
      margin: 0 0 16px 0;
      color: #303133;
      font-size: 16px;
      font-weight: 500;
    }
  }
  
  .no-config {
    text-align: center;
    padding: 40px 0;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-descriptions) {
  .el-descriptions__label {
    font-weight: 500;
    color: #606266;
  }
  
  .el-descriptions__content {
    color: #303133;
  }
}

:deep(.el-table) {
  .el-tag {
    max-width: 100%;
    word-break: break-all;
  }
}
</style>
