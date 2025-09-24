<template>
  <el-dialog
    title="应用站点"
    :model-value="visible"
    width="600px"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose">
    <div v-if="currentRow" class="dialog-content">
      <!-- 左侧当前配置 -->
      <div class="left-panel">
        <div class="panel-title">
          <span>当前配置</span>
        </div>
        <div class="config-list">
          <div 
            v-for="item in configItems" 
            :key="item.key"
            class="config-item">
            <div class="item-header">
              <div class="field-value">
                <span class="field">{{ item.field }}：</span>
                <span class="value">{{ currentRow[item.key] }}</span>
              </div>
              <div class="desc" v-if="item.label" :title="item.label">
                {{ item.label }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧站点列表 -->
      <div class="right-panel">
        <div class="panel-title">选择应用站点</div>
        <el-table
          ref="siteTable"
          :data="siteList"
          style="width: 100%"
          height="400"
          @selection-change="handleSelectionChange">
          <el-table-column
            type="selection"
            width="55">
          </el-table-column>
          <el-table-column
            prop="name"
            label="站点名称">
            <template #default="scope">
              <span :class="{ 'current-row': scope.row.ip === currentRow.ip }">
                {{ scope.row.name }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <template #footer>
      <el-button size="small" @click="handleClose">取 消</el-button>
      <el-button 
        size="small"
        type="primary" 
        :loading="loading"
        @click="handleConfirm">
        确定应用
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
import { requestSetProjectConf } from '@/api/config'

export default {
  name: 'ApplyToDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    currentRow: {
      type: Object,
      default: () => ({})
    },
    configItems: {
      type: Array,
      default: () => []
    },
    siteList: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      loading: false,
      selectedSites: []
    }
  },

  methods: {
    // 检查站点是否有配置
    hasConfig(row) {
      return this.configItems.some(item => row[item.key] !== undefined)
    },

    // 处理站点选择变化
    handleSelectionChange(selection) {
      this.selectedSites = selection
    },

    // 确认应用
    async handleConfirm() {
      if (this.selectedSites.length === 0) {
        this.$message.warning('请选择要应用的站点')
        return
      }

      this.applying = true
      try {
        const configs = {}
        this.configItems.forEach(item => {
          configs[item.key] = this.currentRow[item.key]
        })

        const results = []
        const failures = []

        // 逐个处理请求
        for (const site of this.selectedSites) {
          try {
            const data = Object.entries(configs).map(([key, value]) => `${key}=${value}`)
            const res = await requestSetProjectConf(site.ip, data)

            if (res.error) {
              throw new Error(res.error.message || '应用失败')
            } else {
              results.push({ site, success: true })
            }
          } catch (error) {
            console.error(`应用到站点 ${site.name} 失败:`, error)
            failures.push(site)
          }
        }

        const succeeded = this.selectedSites.length - failures.length

        // 根据结果提示不同信息
        if (failures.length === 0) {
          this.$message.success(`成功应用到 ${succeeded} 个站点`)
        } else if (succeeded === 0) {
          this.$message.error(`应用失败：${failures.map(f => f.name).join('、')}`)
        } else {
          this.$message.warning(
            `成功应用到 ${succeeded} 个站点，` + 
            `失败 ${failures.length} 个：${failures.map(f => f.name).join('、')}`
          )
        }

        if (succeeded > 0) {
          this.$emit('success', {
            sites: this.selectedSites.filter(site => !failures.find(f => f.ip === site.ip)),
            configs: this.configItems
          })
          this.handleClose()
        }
      } catch (error) {
        console.error('应用失败:', error)
        this.$message.error('应用失败')
      } finally {
        this.applying = false
      }
    },

    // 初始化选择状态
    initSelection() {
      this.$nextTick(() => {
        // 清空之前的选择
        this.$refs.siteTable.clearSelection()
        
        // 只选中当前站点
        const currentSite = this.siteList.find(site => site.ip === this.currentRow.ip)
        if (currentSite) {
          this.$refs.siteTable.toggleRowSelection(currentSite, true)
        }
      })
    },

    // 关闭弹窗
    handleClose() {
      this.$emit('update:visible', false)
      // 清空选择
      this.$refs.siteTable && this.$refs.siteTable.clearSelection()
      this.selectedSites = []
    }
  },

  watch: {
    visible(val) {
      if (val) {
        this.initSelection()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.dialog-content {
  display: flex;
  gap: 8px;
  height: 500px;
}

.left-panel,
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  overflow: hidden;  // 防止内容溢出
}
.left-panel {
  flex: 2;
}

.panel-title {
  padding: 12px 15px;
  font-size: 14px;
  font-weight: bold;
  background-color: #f5f7fa;
  border-bottom: 1px solid #EBEEF5;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .current-site {
    color: #409EFF;
    font-size: 13px;
  }
}

.left-panel {
  width: 380px;
  flex-shrink: 0;

  .config-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;

    .config-item {
      padding: 12px;
      background-color: #f5f7fa;
      border-radius: 4px;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .item-header {
        .field-value {
          margin-bottom: 4px;
          
          .field {
            color: #606266;
            font-weight: bold;
          }
          
          .value {
            color: #409EFF;
          }
        }
        
        .desc {
          color: #909399;
          font-size: 13px;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }
}

.right-panel {
  min-width: 0;
}

:deep(.el-table) {
  .current-row {
    color: #409EFF;
    font-weight: bold;
  }
  
  .el-table__header-wrapper {
    th {
      background-color: #f5f7fa;
      color: #606266;
    }
  }

  // 禁用选择框的 hover 效果
  .el-checkbox__inner:hover {
    border-color: #DCDFE6;
  }
  
  // 当前行的选择框样式
  .el-checkbox {
    &.is-checked {
      .el-checkbox__inner {
        background-color: #409EFF;
        border-color: #409EFF;
      }
    }

    &.is-indeterminate {
      .el-checkbox__inner {
        background-color: #409EFF;
        border-color: #409EFF;
      }
    }
  }
}
</style> 