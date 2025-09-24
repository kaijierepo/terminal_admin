<template>
  <el-dialog
    title="应用到站点"
    :model-value="visible"
    width="400px"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose">
    <!-- 搜索框 -->
    <div class="search-bar">
      <el-input
        v-model="searchText"
        placeholder="请输入站点名称"
        clearable
        size="small"
        @input="handleSearch"
        @clear="handleSearchClear">
        <template #append>
          <el-button 
            @click="handleSearch">
            <el-icon><Search /></el-icon>
          </el-button>
        </template>
      </el-input>
    </div>

    <el-table
      ref="siteTable"
      :data="filteredSiteList"
      border
      max-height="400"
      @selection-change="handleSelectionChange">
      <el-table-column
        type="selection"
        width="55">
      </el-table-column>
      <el-table-column
        prop="name"
        label="站点名称">
      </el-table-column>
    </el-table>

    <!-- 添加进度条 -->
    <div v-if="applying" class="progress-container">
      <div class="progress-info">
        <span>正在应用 {{ currentSite }}</span>
        <span>{{ progress.current }}/{{ progress.total }}</span>
      </div>
      <el-progress 
        :percentage="progress.percentage"
        :status="progress.status">
      </el-progress>
    </div>

    <template #footer>
      <el-button @click="handleClose" size="small">取 消</el-button>
      <el-button 
        type="primary" 
        :loading="applying"
        size="small"
        @click="handleConfirm">
        确定应用
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
import { public_http_ip } from '@/public_api/introduction-ip-api'

export default {
  name: 'ApplyToSitesDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    siteList: {
      type: Array,
      default: () => []
    },
    currentModel: {
      type: Object,
      default: null
    }
  },

  data() {
    return {
      searchText: '',
      filteredSiteList: [],
      selectedSites: [],
      applying: false,
      progress: {
        current: 0,
        total: 0,
        percentage: 0,
        status: ''
      },
      currentSite: ''
    }
  },

  watch: {
    visible(val) {
      if (val) {
        this.searchText = ''
        this.filteredSiteList = this.siteList
        this.$nextTick(() => {
          this.$refs.siteTable && this.$refs.siteTable.clearSelection()
        })
      }
    },
    siteList: {
      immediate: true,
      handler(val) {
        this.filteredSiteList = val
      }
    }
  },

  methods: {
    handleSearch() {
      this.filteredSiteList = this.siteList.filter(site => 
        site.name.toLowerCase().includes(this.searchText.toLowerCase())
      )
    },

    handleSearchClear() {
      this.searchText = ''
      this.filteredSiteList = this.siteList
    },

    handleSelectionChange(selection) {
      this.selectedSites = selection
    },

    // 重置进度
    resetProgress() {
      this.progress = {
        current: 0,
        total: 0,
        percentage: 0,
        status: ''
      }
      this.currentSite = ''
    },

    // 更新进度
    updateProgress(current, total, siteName) {
      this.progress.current = current
      this.progress.total = total
      this.progress.percentage = Math.floor((current / total) * 100)
      this.currentSite = siteName
    },

    async handleConfirm() {
      if (this.selectedSites.length === 0) {
        this.$message.warning('请选择要应用的站点')
        return
      }

      this.applying = true
      this.resetProgress()
      try {
        const { name, content } = this.currentModel
        const results = []
        const failures = []
        const total = this.selectedSites.length

        // 逐个处理请求，收集结果
        for (let i = 0; i < this.selectedSites.length; i++) {
          const site = this.selectedSites[i]
          this.updateProgress(i + 1, total, site.name)

          try {
            const res = await public_http_ip(site.ip, {
              jsonrpc: '2.0',
              method: 'setConfFile',
              params: {
                path: `Models/${name}`,
                dir_type: 'run',
                mode: 'rewrite',
                data: content,
              },
            })
            if (res.result == 'OK') {
              results.push({ site, success: true })
              this.progress.status = 'success'
            } else {
              throw new Error(res.result)
            }
          } catch (error) {
            console.error(`应用到站点 ${site.name} 失败:`, error)
            failures.push(site)
            this.progress.status = 'exception'
          }

          // 添加延迟，让进度条动画更平滑
          await new Promise(resolve => setTimeout(resolve, 200))
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
          this.$emit('success')
          this.handleClose()
        }
      } catch (error) {
        console.error('应用失败:', error)
        this.$message.error('应用失败')
      } finally {
        this.applying = false
        this.resetProgress()
      }
    },

    handleClose() {
      this.$emit('update:visible', false)
      this.searchText = ''
      this.selectedSites = []
      this.resetProgress()
      this.$refs.siteTable && this.$refs.siteTable.clearSelection()
    }
  }
}
</script>

<style lang="scss" scoped>
.search-bar {
  margin-bottom: 8px;
}

.progress-container {
  margin-top: 15px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;

  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    color: #606266;
    font-size: 13px;
  }

  :deep(.el-progress-bar__outer) {
    background-color: #e9ecef;
  }

  :deep(.el-progress) {
    &.is-success {
      .el-progress-bar__inner {
        background-color: #67c23a;
      }
    }
    &.is-exception {
      .el-progress-bar__inner {
        background-color: #f56c6c;
      }
    }
  }
}
</style> 