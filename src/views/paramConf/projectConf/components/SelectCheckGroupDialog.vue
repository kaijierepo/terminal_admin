<template>
  <el-dialog
    title="选择检查组"
    :model-value="visible"
    width="650px"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose">
    <div class="group-list">
      <template v-if="checkGroups.length > 0">
        <el-card 
          shadow="none"
          v-for="group in checkGroups" 
          :key="group.id"
          class="group-card"
          :class="{ 'is-selected': selectedGroupId === group.id }">
          <div class="group-header" @click="handleGroupSelect(group)">
            <div class="group-info">
              <span class="group-name">{{ group.name }}</span>
            </div>
            <div class="group-actions">
              <el-button 
                size="small"
                class="delete-btn"
                @click.stop="handleDeleteGroup(group)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="group-items" @click="handleGroupSelect(group)">
            <el-tag
              v-for="item in group.items"
              :key="item.key"
              size="small"
              :title="`${item.field}${item.label ? ' - ' + item.label : ''}`"
              class="group-item">
              <span class="field">{{ item.field }}:{{ item.value }}</span>
              <template v-if="item.label">
                <span class="divider">-</span>
                <span class="label">{{ item.label }}</span>
              </template>
            </el-tag>
          </div>
        </el-card>
      </template>
      
      <div v-else class="empty-state">
        <el-icon><Document /></el-icon>
        <p>暂无检查组</p>
        <p class="tip">可以通过"保存为检查组"功能创建新的检查组</p>
      </div>
    </div>
    <template #footer>
      <el-button size="small" @click="closeDialog">取 消</el-button>
      <el-button 
        size="small"
        type="primary" 
        @click="handleConfirm"
        :disabled="checkGroups.length === 0">
        确 定
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'SelectCheckGroupDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    checkGroups: {
      type: Array,
      default: () => []
    },
    currentGroupName: {
      type: String,
      default: ''
    }
  },

  data() {
    return {
      selectedGroupId: null
    }
  },

  watch: {
    visible(val) {
      if (val && this.currentGroupName) {
        const currentGroup = this.checkGroups.find(g => g.name === this.currentGroupName)
        if (currentGroup) {
          this.selectedGroupId = currentGroup.id
        }
      } else {
        this.selectedGroupId = null
      }
    }
  },

  methods: {
    // 选择检查组
    handleGroupSelect(group) {
      this.selectedGroupId = group.id
    },

    // 删除检查组
    handleDeleteGroup(group) {
      this.$confirm('确认删除该检查组？', '提示', {
        type: 'warning'
      }).then(async () => {
        try {
          // 发送删除事件给父组件
          this.$emit('delete', group)
          
          // 如果删除的是当前选中的组，清空选中状态
          if (this.selectedGroupId === group.id) {
            this.selectedGroupId = null
          }
        } catch (error) {
          console.error('删除检查组失败:', error)
          this.$message.error('删除失败')
        }
      }).catch(() => {})
    },

    // 确认选择
    handleConfirm() {
      if (!this.selectedGroupId) {
        this.$message.warning('请选择一个检查组')
        return
      }
      const selectedGroup = this.checkGroups.find(g => g.id === this.selectedGroupId)
      this.$emit('confirm', selectedGroup)
    },

    // 取消选择
    closeDialog() {
      this.$emit('update:visible', false)
    },

    // 关闭弹窗
    handleClose() {
      this.$emit('update:visible', false)
      this.selectedGroupId = null
    }
  }
}
</script>

<style lang="scss" scoped>
.group-list {
  max-height: 500px;
  overflow-y: auto;
  padding: 5px;
  
  .group-card {
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.3s;
    border: 1px solid #eee;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    &:hover {
      background-color: #f5f7fa;
    }
    
    &.is-selected {
      border: 1px solid #409EFF;
      background-color: #ecf5ff;
      
      .group-header {
        .group-name {
          color: #409EFF;
        }
      }
    }
    
    .group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      
      .group-info {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .group-name {
          font-size: 16px;
          font-weight: 500;
          transition: color 0.3s;
        }
      }
      
      .group-actions {
        display: flex;
        align-items: center;
        gap: 10px;

        .delete-btn {
          padding: 2px;
          color: #909399;
          font-size: 16px;
          
          &:hover {
            color: #f56c6c;
          }
        }
      }
    }
    
    .group-items {
      position: relative;
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      
      .group-item {
        padding: 0 8px;
        display: flex;
        align-items: center;
        
        .field {
          color: #409EFF;
          font-weight: 500;
        }
        
        .divider {
          margin: 0 4px;
          color: #909399;
          flex-shrink: 0;
        }
        
        .label {
          display: inline-block;
          color: #606266;
          max-width: 330px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    color: #909399;
    
    i {
      font-size: 48px;
      margin-bottom: 16px;
      color: #DCDFE6;
    }
    
    p {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
      
      &.tip {
        font-size: 13px;
        margin-top: 8px;
        color: #C0C4CC;
      }
    }
  }
}
</style> 