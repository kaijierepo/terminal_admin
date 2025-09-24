<template>
  <div class="station-tree">
    <div class="tree-header">
      <div class="header-title">
        <el-icon><OfficeBuilding /></el-icon>
        <span>站点列表</span>
      </div>
      <div class="header-actions">
        <el-button
          type="primary"
          size="small"
          plain
          @click="toggleExpandAll"
          :icon="allExpanded ? 'Minus' : 'Plus'"
        >
          {{ allExpanded ? '全部收起' : '全部展开' }}
        </el-button>
        <el-dropdown @command="handleHeaderAction" trigger="click">
          <el-button size="small" type="primary" :icon="Setting">
            管理
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="add-line">添加线路</el-dropdown-item>
              <el-dropdown-item command="add-workshop">添加车间</el-dropdown-item>
              <el-dropdown-item command="add-station">添加站点</el-dropdown-item>
              <el-dropdown-item command="reset" divided>重置为默认</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <div class="tree-content">
      <div
        v-for="line in stationTree"
        :key="line.id"
        class="tree-node line-node"
      >
        <!-- 线路节点 -->
        <div
          class="node-content line-content"
        >
          <div class="node-indicator" @click="toggleNode(line)">
            <el-icon class="expand-icon" :class="{ expanded: line.expanded }">
              <ArrowRight />
            </el-icon>
            <el-icon class="node-icon line-icon">
              <OfficeBuilding />
            </el-icon>
          </div>
          <div class="node-info flex">
            <div class="node-name" @click="toggleNode(line)">{{ line.name }}（{{ line.children?.length || 0 }}）</div>
          </div>
          <div class="node-actions">
            <el-dropdown @command="(command) => handleNodeAction(line, command)" trigger="click" @click.stop>
              <el-button size="small" type="text" :icon="MoreFilled">
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="add-workshop">添加车间</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        
        <!-- 车间子节点 -->
          <div
            v-show="line.expanded"
            class="children-container"
          >
            <div
              v-for="workshop in line.children"
              :key="workshop.id"
              class="tree-node workshop-node"
            >
              <!-- 车间节点 -->
              <div
                class="node-content workshop-content"
              >
                <div class="node-indicator" @click="toggleNode(workshop)">
                  <el-icon class="expand-icon" :class="{ expanded: workshop.expanded }">
                    <ArrowRight />
                  </el-icon>
                  <el-icon class="node-icon workshop-icon">
                    <OfficeBuilding />
                  </el-icon>
                </div>
                <div class="node-info flex" @click="toggleNode(workshop)">
                  <div class="node-name">{{ workshop.name }}（{{ workshop.children?.length || 0 }}）</div>
                </div>
                <div class="node-actions">
                  <el-dropdown @command="(command) => handleNodeAction(workshop, command, line)" trigger="click" @click.stop>
                    <el-button size="small" type="text" :icon="MoreFilled">
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="edit">编辑</el-dropdown-item>
                        <el-dropdown-item command="add-station">添加站点</el-dropdown-item>
                        <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
              
              <!-- 站点子节点 -->
                <div
                  v-show="workshop.expanded"
                  class="children-container"
                >
                  <div
                    v-for="station in workshop.children"
                    :key="station.id"
                    class="tree-node station-node"
                    :class="{ 'selected': isStationSelected(station) }"
                  >
                    <div class="node-content station-content">
                      <div class="node-indicator">
                        <el-icon class="node-icon station-icon" :class="getStationStatusClass(station)">
                          <Monitor />
                        </el-icon>
                      </div>
                      <div class="node-info station-info" @click="handleStationAction(station, 'select')">
                        <div class="node-name" :class="getStationStatusClass(station)">
                          {{ station.name }}
                        </div>
                        <div class="node-meta">
                          <span class="station-ip">{{ station.ip }}</span>
                          <!--<span class="station-port">:{{ station.httpport }}</span>
                          <span 
                            class="station-status" 
                            :class="getStationStatusClass(station)"
                          >
                            {{ getStationStatusText(station) }}
                          </span> -->
                        </div>
                      </div>
                      <div class="node-actions">
                        <el-dropdown @command="(command) => handleNodeAction(station, command, workshop, line)" trigger="click" @click.stop>
                          <el-button size="small" type="text" :icon="MoreFilled" style="color: #409eff; font-size: 12px;">
                          </el-button>
                          <template #dropdown>
                            <el-dropdown-menu>
                              <el-dropdown-item command="edit">编辑</el-dropdown-item>
                              <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                            </el-dropdown-menu>
                          </template>
                        </el-dropdown>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-if="!stationTree || stationTree.length === 0" class="empty-state">
      <el-icon class="empty-icon"><Box /></el-icon>
      <div class="empty-text">暂无站点数据</div>
      <div class="empty-hint">请先添加站点信息</div>
    </div>
  </div>

  <!-- 添加/编辑对话框 -->
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      size="small"
    >
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入名称" />
      </el-form-item>
      
      <el-form-item v-if="formData.type === 'station'" label="IP地址" prop="ip">
        <el-input v-model="formData.ip" placeholder="请输入IP地址" />
      </el-form-item>
      
      <el-form-item v-if="formData.type === 'station'" label="端口" prop="httpport">
        <el-input-number v-model="formData.httpport" :min="1" :max="65535" placeholder="端口号" />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, readonly } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  OfficeBuilding,
  Monitor,
  ArrowRight,
  Link,
  Box,
  Plus,
  Minus,
  Setting,
  MoreFilled
} from '@element-plus/icons-vue'

// 定义组件属性
const props = defineProps({
  // 站点树数据
  data: {
    type: Array,
    default: () => []
  },
  // 是否默认展开所有节点
  defaultExpandAll: {
    type: Boolean,
    default: true
  }
})

// 定义组件事件
const emit = defineEmits(['station-select', 'station-connect', 'node-expand', 'tree-change', 'tree-reset'])

// 响应式数据
const stationTree = ref([])
const allExpanded = ref(true)
const selectedStation = ref(null) // 当前选中的站点

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()
const formData = ref({
  name: '',
  ip: '',
  httpport: 81,
  type: '', // line, workshop, station
  parentNode: null, // 父节点引用
  editingNode: null // 编辑的节点引用
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 2, max: 20, message: '名称长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  ip: [
    { required: true, message: '请输入IP地址', trigger: 'blur' },
    { 
      pattern: /^(\d{1,3}\.){3}\d{1,3}$/, 
      message: '请输入正确的IP地址格式', 
      trigger: 'blur' 
    }
  ],
  httpport: [
    { required: true, message: '请输入端口号', trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口号范围为 1-65535', trigger: 'blur' }
  ]
}

// 初始化树数据
const initTreeData = (data) => {
  const setExpanded = (nodes, expanded) => {
    return nodes.map(node => ({
      ...node,
      expanded: expanded,
      children: node.children ? setExpanded(node.children, expanded) : undefined
    }))
  }
  
  stationTree.value = setExpanded(data, props.defaultExpandAll)
}

// 监听数据变化
watch(() => props.data, (newData) => {
  if (newData && newData.length > 0) {
    initTreeData(newData)
  }
}, { immediate: true })

// 切换节点展开/收起状态
const toggleNode = (node) => {
  node.expanded = !node.expanded
  emit('node-expand', node)
}

// 切换全部展开/收起
const toggleExpandAll = () => {
  allExpanded.value = !allExpanded.value
  
  const setAllExpanded = (nodes, expanded) => {
    nodes.forEach(node => {
      node.expanded = expanded
      if (node.children) {
        setAllExpanded(node.children, expanded)
      }
    })
  }
  
  setAllExpanded(stationTree.value, allExpanded.value)
}

// 获取站点状态样式类
const getStationStatusClass = (station) => {
  if (station.name && station.name.includes('通信中断')) {
    return 'status-offline'
  }
  return 'status-online'
}

// 获取站点状态文本
const getStationStatusText = (station) => {
  if (station.name && station.name.includes('通信中断')) {
    return '离线'
  }
  return '在线'
}

// 判断站点是否被选中
const isStationSelected = (station) => {
  return selectedStation.value && selectedStation.value.id === station.id
}

// 清除选中状态
const clearSelection = () => {
  selectedStation.value = null
}

// 设置选中状态
const setSelectedStation = (station) => {
  selectedStation.value = station
}

// 处理站点操作
const handleStationAction = (station, action) => {
  switch (action) {
    case 'connect':
      emit('station-connect', station)
      ElMessage.success(`正在连接到 ${station.name}`)
      break
    case 'select':
      // 设置选中状态
      selectedStation.value = station
      emit('station-select', station)
      break
    default:
      selectedStation.value = station
      emit('station-select', station)
  }
}

// 处理头部操作
const handleHeaderAction = async (command) => {
  switch (command) {
    case 'add-line':
      openDialog('添加线路', 'line')
      break
    case 'add-workshop':
      openDialog('添加车间', 'workshop')
      break
    case 'add-station':
      openDialog('添加站点', 'station')
      break
    case 'reset':
      try {
        await ElMessageBox.confirm(
          '确定要重置为默认数据吗？这将清除所有自定义的站点信息。',
          '重置确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        )
        emit('tree-reset')
        ElMessage.success('已重置为默认数据')
      } catch {
        ElMessage.info('已取消重置')
      }
      break
  }
}

// 处理节点操作
const handleNodeAction = (node, command, parentNode = null, grandParentNode = null) => {
  switch (command) {
    case 'edit':
      openEditDialog(node)
      break
    case 'add-workshop':
      if (node.type === 'line' || !node.type) {
        openDialog('添加车间', 'workshop', node)
      }
      break
    case 'add-station':
      if (node.type === 'workshop' || !node.type) {
        openDialog('添加站点', 'station', node)
      }
      break
    case 'delete':
      handleDelete(node, parentNode)
      break
  }
}

// 打开添加对话框
const openDialog = (title, type, parentNode = null) => {
  dialogTitle.value = title
  formData.value = {
    name: '',
    ip: '',
    httpport: 81,
    type: type,
    parentNode: parentNode,
    editingNode: null
  }
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (node) => {
  dialogTitle.value = `编辑${getNodeTypeText(node)}`
  formData.value = {
    name: node.name,
    ip: node.ip || '',
    httpport: node.httpport || 81,
    type: getNodeType(node),
    parentNode: null,
    editingNode: node
  }
  dialogVisible.value = true
}

// 获取节点类型
const getNodeType = (node) => {
  if (node.ip) return 'station'
  if (node.children && node.children.some(child => child.ip)) return 'workshop'
  return 'line'
}

// 获取节点类型文本
const getNodeTypeText = (node) => {
  const type = getNodeType(node)
  const typeMap = {
    line: '线路',
    workshop: '车间',
    station: '站点'
  }
  return typeMap[type] || '节点'
}

// 处理删除
const handleDelete = async (node, parentNode) => {
  const nodeTypeText = getNodeTypeText(node)
  try {
    await ElMessageBox.confirm(
      `确定要删除${nodeTypeText}"${node.name}"吗？${node.children ? '删除后将同时删除所有子节点。' : ''}`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    if (parentNode) {
      // 删除子节点
      const index = parentNode.children.findIndex(child => child.id === node.id)
      if (index > -1) {
        parentNode.children.splice(index, 1)
      }
    } else {
      // 删除根节点
      const index = stationTree.value.findIndex(item => item.id === node.id)
      if (index > -1) {
        stationTree.value.splice(index, 1)
      }
    }
    
    ElMessage.success(`删除${nodeTypeText}成功`)
    emit('tree-change', stationTree.value)
  } catch {
    ElMessage.info('已取消删除')
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    if (formData.value.editingNode) {
      // 编辑模式
      formData.value.editingNode.name = formData.value.name
      if (formData.value.type === 'station') {
        formData.value.editingNode.ip = formData.value.ip
        formData.value.editingNode.httpport = formData.value.httpport
      }
      ElMessage.success(`编辑${getNodeTypeText(formData.value.editingNode)}成功`)
    } else {
      // 添加模式
      const newNode = createNewNode(formData.value)
      
      if (formData.value.parentNode) {
        // 添加到父节点
        if (!formData.value.parentNode.children) {
          formData.value.parentNode.children = []
        }
        formData.value.parentNode.children.push(newNode)
        // 自动展开父节点
        formData.value.parentNode.expanded = true
      } else {
        // 添加到根节点
        stationTree.value.push(newNode)
      }
      
      ElMessage.success(`添加${getNodeTypeText(newNode)}成功`)
    }
    
    dialogVisible.value = false
    emit('tree-change', stationTree.value)
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 创建新节点
const createNewNode = (formData) => {
  const baseNode = {
    id: generateId(formData.type),
    name: formData.name,
    expanded: false
  }
  
  if (formData.type === 'station') {
    return {
      ...baseNode,
      ip: formData.ip,
      httpport: formData.httpport
    }
  } else {
    return {
      ...baseNode,
      children: []
    }
  }
}

// 生成ID
const generateId = (type) => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 5)
  return `${type}_${timestamp}_${random}`
}

// 监听全部展开状态
watch(allExpanded, (newVal) => {
  const setAllExpanded = (nodes, expanded) => {
    nodes.forEach(node => {
      node.expanded = expanded
      if (node.children) {
        setAllExpanded(node.children, expanded)
      }
    })
  }
  
  setAllExpanded(stationTree.value, newVal)
})

// 暴露方法给父组件
defineExpose({
  clearSelection,
  setSelectedStation,
  selectedStation: readonly(selectedStation)
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.station-tree {
  background: #fff;
  overflow: hidden;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%);
  backdrop-filter: blur(10px);
  color: white;
  
  .header-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    
    .el-icon {
      font-size: 16px;
    }
  }
  
  .header-actions {
    display: flex;
    gap: 8px;
    
    .el-button {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.3);
      color: white;
      padding: 4px 8px;
      font-size: 12px;
      height: auto;
      
      &:hover {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.5);
      }
    }
  }
}

.tree-content {
  padding: 8px 0;
  max-height: calc(100vh - 130px);
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
    
    &:hover {
      background: #a8a8a8;
    }
  }
}

.tree-node {
  .node-content {
    display: flex;
    align-items: center;
    padding: 6px 10px;
    transition: all 0.3s ease;
    
    &:hover {
      background: #f8f9ff;
    }
  }
  
  &.line-node {
    .line-content {
      margin-left: 0;
      
      &:hover {
        background: #f0f2ff;
      }
    }
  }
  
  &.workshop-node {
    margin-left: 10px;
    
    .workshop-content {
      margin-left: 4px;
      
      &:hover {
        background: #f0f2ff;
      }
    }
  }
  
  &.station-node {
    margin-left: 20px;
    
    .station-content {
      border-left: 2px solid #e4e7ed;
      margin-left: 16px;
      
      &:hover {
        background: #fafbff;
        border-left-color: #409eff;
      }
    }
    
    // 选中状态样式
    &.selected {
      .station-content {
        background: #fafbff;
        border-left: 1px solid #409eff;
        
        .node-name {
          color: #409eff;
          font-weight: 600;
        }
        
        .station-icon {
          color: #409eff !important;
          transform: scale(1.1);
        }
        
        .station-ip {
          background: rgba(64, 158, 255, 0.1);
          color: #409eff;
          font-weight: 500;
        }
      }
    }
  }
}

.node-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: 10px;
  
  .expand-icon {
    font-size: 10px;
    color: #909399;
    transition: transform 0.3s ease;
    
  }
  
  .node-icon {
    font-size: 14px;
    
    &.line-icon {
      color: #409eff;
    }
    
    &.workshop-icon {
      color: #667eea;
    }
    
    &.station-icon {
      color: #67c23a;
      
      &.status-offline {
        color: #f56c6c;
      }
    }
  }
}

.node-info {
  flex: 1;
  
  &.station-info {
    flex: 1;
    min-width: 0; /* 允许内容收缩 */
    max-width: calc(100% - 80px); /* 为操作按钮预留空间 */
  }
  
  .node-name {
    font-size: 13px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 2px;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    
    &.status-offline {
      color: #f56c6c;
    }
  }
  
  .node-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #909399;
    flex-wrap: wrap;
    
    .workshop-count {
      background: #e8f4fd;
      color: #409eff;
      padding: 1px 4px;
      border-radius: 8px;
      font-weight: 500;
    }
    
    .station-count {
      background: #f0f9ff;
      color: #667eea;
      padding: 1px 4px;
      border-radius: 8px;
      font-weight: 500;
    }
    
    .station-ip {
      font-family: 'Courier New', monospace;
      background: #f5f7fa;
      padding: 1px 4px;
      border-radius: 3px;
      color: #606266;
    }
    
    .station-port {
      color: #c0c4cc;
    }
    
    .station-status {
      padding: 1px 6px;
      border-radius: 8px;
      font-weight: 500;
      
      &.status-online {
        background: #f0f9ff;
        color: #67c23a;
      }
      
      &.status-offline {
        background: #fef0f0;
        color: #f56c6c;
      }
    }
  }
}

.node-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0; /* 防止按钮被压缩 */
  min-width: 40px; /* 确保按钮区域有最小宽度 */
  
  .el-button {
    padding: 2px 6px;
    font-size: 11px;
    height: auto;
    min-height: 20px;
    
    &.el-button--text {
      padding: 2px 4px;
      color: #909399;
      
      &:hover {
        color: #409eff;
        background: rgba(64, 158, 255, 0.1);
      }
    }
  }
}

.children-container {
  overflow: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  color: #909399;
  
  .empty-icon {
    font-size: 32px;
    margin-bottom: 12px;
    color: #c0c4cc;
  }
  
  .empty-text {
    font-size: 14px;
    margin-bottom: 6px;
    color: #606266;
  }
  
  .empty-hint {
    font-size: 11px;
    color: #c0c4cc;
  }
}

// 动画效果
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  transform-origin: top;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: scaleY(0);
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  transform: scaleY(1);
}

// 响应式设计
@media (max-width: 768px) {
  .tree-header {
    padding: 8px 12px;
    
    .header-title {
      font-size: 12px;
    }
  }
  
  .tree-content {
    padding: 6px 0;
    
    .tree-node {
      .node-content {
        padding: 4px 12px;
      }
      
      &.workshop-node {
        margin-left: 12px;
        
        .workshop-content {
          margin-left: 12px;
        }
      }
      
      &.station-node {
        margin-left: 24px;
        
        .station-content {
          margin-left: 12px;
        }
      }
    }
  }
  
  .node-indicator {
    gap: 4px;
    margin-right: 8px;
    
    .expand-icon {
      font-size: 9px;
    }
    
    .node-icon {
      font-size: 12px;
    }
  }
  
  .node-info {
    .node-name {
      font-size: 12px;
      margin-bottom: 1px;
    }
    
    .node-meta {
      font-size: 10px;
      flex-wrap: wrap;
      gap: 4px;
    }
  }
  
  .node-actions {
    .el-button {
      padding: 1px 4px;
      font-size: 10px;
      min-height: 18px;
    }
  }
}
</style>
