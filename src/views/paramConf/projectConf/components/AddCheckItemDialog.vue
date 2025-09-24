<template>
  <el-dialog
    title="添加检查项"
    :model-value="visible"
    top="100px"
    width="800px"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose">
    <div class="search-bar">
      <el-input
        v-model="searchText"
        placeholder="请输入字段名或说明进行搜索"
        clearable
        @clear="handleClear"
        @input="handleSearch">
      </el-input>
      <el-button 
        type="primary"
        @click="handleAddCustom">
        补充检查项
      </el-button>
    </div>

    <el-tree
      ref="tree"
      class="config-tree"
      :data="filteredFields"
      :props="{
        children: 'children',
        label: 'field'
      }"
      show-checkbox
      node-key="key"
      default-expand-all
      @check="handleCheck">
      <template #default="{ node, data }">
        <span class="custom-tree-node">
          <p class="node-content" :title="`${data.field}${data.label ? ' - ' + data.label : ''}`">
            <span class="field">{{ data.field }}:{{ data.value }}</span>
            <template v-if="data.label">
              <span class="divider">-</span>
              <span class="label">{{ data.label }}</span>
            </template>
          </p>
        </span>
      </template>
    </el-tree>

    <template #footer>
      <el-button @click="closeDialog" size="small">取 消</el-button>
      <el-button type="primary" @click="handleConfirm" size="small">确 定</el-button>
    </template>

    <!-- 添加补充检查项弹窗 -->
    <add-custom-check-item-dialog
      v-model:visible="customDialogVisible"
      @confirm="handleCustomConfirm"
    />
  </el-dialog>
</template>

<script>
import AddCustomCheckItemDialog from './AddCustomCheckItemDialog.vue'

export default {
  name: 'AddCheckItemDialog',
  components: {
    AddCustomCheckItemDialog
  },

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    availableFields: {
      type: Array,
      default: () => []
    },
    currentCheckItems: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      selectedFields: [],
      searchText: '',
      filteredFields: [],
      customDialogVisible: false
    }
  },

  watch: {
    availableFields: {
      handler(val) {
        this.filteredFields = val
      },
      immediate: true
    },
    visible: {
      handler(val) {
        if (val) {
          // 使用 nextTick 确保 tree 组件已经渲染完成
          this.$nextTick(() => {
            // 先清空选择
            this.$refs.tree && this.$refs.tree.setCheckedKeys([])
            
            // 如果有当前检查项，设置选中状态
            if (this.currentCheckItems.length > 0) {
              const keysToCheck = this.currentCheckItems.map(item => item.key)
              this.$refs.tree.setCheckedKeys(keysToCheck)
              // 同步更新 selectedFields
              this.selectedFields = this.currentCheckItems
            }
          })
        }
      },
      immediate: true
    }
  },

  methods: {
    // 处理搜索
    handleSearch() {
      if (!this.searchText) {
        this.filteredFields = this.availableFields
        return
      }

      const searchText = this.searchText.toLowerCase()
      this.filteredFields = this.availableFields.reduce((acc, group) => {
        // 搜索子项
        const matchedChildren = (group.children || []).filter(item => {
          const fieldMatch = item.field.toLowerCase().includes(searchText)
          const labelMatch = item.label && item.label.toLowerCase().includes(searchText)
          return fieldMatch || labelMatch
        })

        // 如果有匹配的子项，创建新的分组
        if (matchedChildren.length > 0) {
          acc.push({
            ...group,
            children: matchedChildren
          })
        }
        return acc
      }, [])
    },

    // 清空搜索
    handleClear() {
      this.searchText = ''
      this.filteredFields = this.availableFields
      // 清空选择
      this.$refs.tree && this.$refs.tree.setCheckedKeys([])
    },

    // 处理节点选中
    handleCheck(data, { checkedNodes, checkedKeys }) {
      // 只收集叶子节点
      this.selectedFields = checkedNodes.filter(node => !node.children)
    },

    // 确认选择
    handleConfirm() {
      if (this.selectedFields.length === 0) {
        this.$message.warning('请至少选择一个配置项')
        return
      }
      this.$emit('replace', this.selectedFields)
    },

    // 取消选择
    closeDialog() {
      this.$emit('update:visible', false)
    },

    // 关闭弹窗
    handleClose() {
      this.$emit('update:visible', false)
      // 清空搜索和选择
      this.searchText = ''
      this.filteredFields = this.availableFields
      this.selectedFields = []
      this.$refs.tree && this.$refs.tree.setCheckedKeys([])
    },

    // 打开补充检查项弹窗
    handleAddCustom() {
      this.customDialogVisible = true
    },

    // 处理补充检查项确认
    handleCustomConfirm(newItem) {
      // 查找或创建分组
      let group = this.filteredFields.find(g => g.field === newItem.groupName)
      if (!group) {
        group = {
          field: newItem.groupName,
          label: newItem.groupName,
          key: newItem.groupName,
          children: []
        }
        this.filteredFields.push(group)
      }

      // 添加新项到分组
      const newChild = {
        field: newItem.field,
        label: newItem.label,
        key: newItem.key,
        value: newItem.defaultValue
      }
      group.children.push(newChild)

      // 选中新添加的项
      this.$nextTick(() => {
        // 获取当前已选中的项（包括之前选中的和新添加的）
        const currentCheckedKeys = [...this.selectedFields.map(item => item.key), newItem.key]
        
        // 合并当前选中项和新项
        const newSelectedFields = [
          ...this.selectedFields,  // 保留已选中的项
          newChild  // 添加新项
        ]

        // 更新树的选中状态
        this.$refs.tree.setCheckedKeys(currentCheckedKeys)
        
        // 更新 selectedFields
        this.selectedFields = newSelectedFields
        console.log('this.selectedFields', this.selectedFields)
      })

      // 关闭补充检查项弹窗
      this.customDialogVisible = false
    }
  }
}
</script>

<style lang="scss" scoped>
.search-bar {
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
  
  .el-input {
    flex: 1;
  }
  
  :deep(.el-input-group__append) {
    background-color: #409EFF;
    border-color: #409EFF;
    
    .el-button {
      padding: 0 15px;
      border: none;
      
      i {
        color: #fff;
      }
    }
  }
}

.config-tree {
  height: 500px;
  overflow-y: auto;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  padding: 10px;

  :deep(.el-tree-node__content) {
    height: auto;
    min-height: 32px;
    padding: 8px 0;
  }

  :deep(.el-tree-node__label) {
    width: 100%;
  }
}

// 调整复选框位置
:deep(.el-checkbox) {
  align-self: flex-start;
  margin-top: 2px;
}

.node-content {
  display: flex;
  align-items: center;
  width: 660px;
  margin: 0;
  
  .field {
    font-weight: bold;
    flex-shrink: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .divider {
    color: #909399;
    margin: 0 8px;
    flex-shrink: 0;
  }
  
  .label {
    color: #606266;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

// 调整 tooltip 样式
:deep(.el-tooltip__popper) {
  max-width: 500px;
  line-height: 1.4;
}
</style> 
