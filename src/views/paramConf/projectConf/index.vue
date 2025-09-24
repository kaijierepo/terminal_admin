<template>
  <div class="global-param-config" v-loading="pageLoading">
    <!-- 左侧检查项配置 -->
    <el-card class="config-panel">
      <div class="panel-header">
        <div class="header-left">
          <span>检查组</span>
          <span v-if="currentGroupName" class="current-group">
            当前：{{ currentGroupName }}
          </span>
        </div>
        <el-button 
          v-if="checkItems.length > 0"
          @click="handleClearItems">
          清空
        </el-button>
      </div>
      <div class="check-list">
        <div v-for="(item, index) in checkItems" 
                :key="item.key" 
                class="check-item">
          <div class="item-header">
            <div>
              <div>{{ item.key }}</div>
              <div class="item-name">{{ item.label }}</div>
            </div>
            <el-icon @click="handleDeleteItem(index)">
              <Delete />
            </el-icon>
          </div>
        </div>
      </div>
      
      
      <!-- 操作按钮区 -->
      <div class="action-area">
        <el-button 
          type="primary" 
          @click="handleAddCheck">
          <el-icon><Plus /></el-icon>
          添加检查项
        </el-button>
        <!-- <div class="group-actions">
          <el-button 
            type="success" 
            size="small"
            @click="handleSaveGroup">
            <el-icon><DocumentAdd /></el-icon>
            保存为检查组
          </el-button>
          <el-button 
            type="warning" 
            size="small"
            @click="handleSelectGroup">
            <el-icon><Document /></el-icon>
            选择检查组
          </el-button>
        </div> -->
      </div>
    </el-card>

    <!-- 右侧表格配置 -->
    <div class="table-panel">
      <div class="panel-header">
        <span>全局参数配置表</span>
        <el-button 
          @click="handleBatchReadConfig"
          :disabled="checkItems.length === 0">
          批量读取
        </el-button>
      </div>
      <div class="table-container">
        <el-table
          :data="tableData"
          border
          style="width: auto"
        >
          <!-- 站点列 -->
          <el-table-column
            prop="stationName"
            label="站点"
            min-width="140"
            align="center"
            fixed="left">
          </el-table-column>
          <el-table-column prop="ip" label="IP地址" min-width="200">
            <template #default="{ row }">
              <span>{{ row.ip }}</span>
            </template>
          </el-table-column>
          <!-- 动态检查项列 -->
          <template v-if="checkItems.length > 0">
            <el-table-column
              v-for="item in checkItems"
              :key="item.key"
              :prop="item.field"
              min-width="120"
              align="center">
              <template #header>
                <el-tooltip 
                  :content="item.label || '无说明'" 
                  placement="top"
                  effect="light">
                  <p>{{ item.field }}</p>
                </el-tooltip>
              </template>
              <template #default="scope">
                <el-input
                  v-model="scope.row[item.key]"
                  size="small"
                  placeholder="请输入">
                </el-input>
              </template>
            </el-table-column>
          </template>
          <!-- 操作列 -->
          <el-table-column
            label="操作"
            width="280"
            fixed="right">
            <template #default="scope">
              <el-button 
                size="small"
                @click="handleReadConfig(scope.row)">
                读取
              </el-button>
              <el-button 
                size="small"
                type="warning"
                plain
                @click="handleViewConfig(scope.row)">
                查看
              </el-button>
              <el-button 
                size="small"
                type="primary"
                @click="handleSave(scope.row)">
                保存
              </el-button>
              <el-button 
                size="small"
                type="success"
                @click="handleApplyTo(scope.row)">
                应用到
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 添加检查项弹窗 -->
    <add-check-item-dialog
      v-model:visible="addCheckDialogVisible"
      :available-fields="availableFields"
      :current-check-items="checkItems"
      @replace="handleAddCheckReplace"
    />

    <!-- 应用到其他站点弹窗 -->
    <apply-to-dialog
      v-model:visible="applyToDialogVisible"
      :current-row="currentRow"
      :config-items="checkItems"
      :site-list="tableData"
      @success="handleApplySuccess"
    />

    <!-- 选择检查组弹窗 -->
    <select-check-group-dialog
      ref="selectGroupDialog"
      v-model:visible="selectGroupDialogVisible"
      :check-groups="checkGroups"
      @confirm="handleSelectGroupConfirm"
      @delete="handleDeleteGroup"
    />

    <!-- 保存检查组弹窗 -->
    <!-- <save-check-group-dialog
      v-model:visible="saveGroupDialogVisible"
      :check-items="checkItems"
      @confirm="handleSaveGroupConfirm"
    /> -->

    <!-- 查看配置弹窗 -->
    <view-config-dialog
      v-model:visible="viewConfigDialogVisible"
      :config-data="viewConfigData"
      :check-items="checkItems"
      @refresh="handleViewConfigRefresh"
    />
  </div>
</template>

<script>
import { requestProjectConf, requestSetProjectConf } from '@/api/config'
import { parseINIConstructor } from '@/utils/parseUtil'
import { useStationStore } from '@/store/modules/station'
import AddCheckItemDialog from './components/AddCheckItemDialog.vue'
import SelectCheckGroupDialog from './components/SelectCheckGroupDialog.vue'
// import SaveCheckGroupDialog from './components/SaveCheckGroupDialog.vue'
import ApplyToDialog from './components/ApplyToDialog.vue'
import ViewConfigDialog from './components/ViewConfigDialog.vue'
import { Delete } from '@element-plus/icons-vue' 
import { iniConf } from './conf/JHD10.js'

export default {
  name: 'GlobalParamConfig',
  components: {
    AddCheckItemDialog,
    SelectCheckGroupDialog,
    // SaveCheckGroupDialog,
    ApplyToDialog,
    ViewConfigDialog,
    Delete
  },

  data() {
    return {
      // 检查项列表
      checkItems: [],
      // 表格数据
      tableData: [],
      // 添加检查项弹窗
      addCheckDialogVisible: false,
      // 应用到弹窗
      applyToDialogVisible: false,
      // 新检查项表单
      newCheckForm: {
        name: '',
        fields: []
      },
      // 可选字段
      availableFields: [],
      // 所有站点
      allSites: [],
      // 已选站点
      selectedSites: [],
      // 当前操作的行数据
      currentRow: null,
      // 已选中的字段
      selectedFields: [],
      // 添加择检查组相关数据
      selectGroupDialogVisible: false,
      selectedGroupId: null,
      checkGroups: [],
      // 站点列表数据
      siteList: [],
      saveGroupDialogVisible: false,
      currentGroupName: '',
      pageLoading: false,
      // 查看配置弹窗
      viewConfigDialogVisible: false,
      viewConfigData: null
    }
  },
  computed: {
    // 使用 store 中的站点列表
    stationStore() {
      return useStationStore()
    },
    ipList() {
      return this.stationStore.getAllStations
    }
  },
  created() {
    // 初始化 store 中的站点列表
    this.stationStore.initStationList()
    this.tableData = this.ipList
    if (this.ipList.length) {
      this.getIniData()
    }
  },
  methods: {
    // 格式化配置数据
    formatConfigData(data) {
      const result = []
      for (const [groupName, items] of Object.entries(data)) {
        // 跳过空对象
        if (Object.keys(items).length === 0) continue
        
        // 创建分组对象
        const group = {
          field: groupName,
          label: '',
          key: groupName,
          children: [] // 初始化子节点数组
        }

        // 添加子节点
        for (const [field, content] of Object.entries(items)) {
          const childKey = `${groupName}.${field}`
          
          group.children.push({
            field,
            label: content.comment,
            value: content.value,
            key: childKey
          })
        }
        result.push(group)
      }

      return result
    },

    // 获取配置数据
    async getIniData() {
      this.pageLoading = true
      try {
        const result = iniConf
        if (result) {
          const formatedData = parseINIConstructor(result)
          console.log(formatedData)
          // 格式化数据为树形结构
          this.availableFields = this.formatConfigData(formatedData)
        } else {
          this.$message.error('获取Tools/JHD10（自行根据需要修改）.ini文件数据失败:' + res.result)
        }
      } catch (e) {
        console.error(e)
      } finally {
        this.pageLoading = false
      }
    },

    // 添加检查项
    handleAddCheck() {
      this.addCheckDialogVisible = true
    },

    // 处理表格选择变化
    handleSelectionChange(selection) {
      // 过滤掉父节点，只保留叶子节点
      this.selectedFields = selection.filter(item => !item.children)
    },

    // 处理添加检查项替换
    async handleAddCheckReplace(selectedFields) {
      this.pageLoading = true
      try {
        // 清空现有检查项
        this.checkItems = []
        // 清空表格数据中的配置项
        this.tableData.forEach(row => {
          Object.keys(row).forEach(key => {
            if (key !== 'ip' && key !== 'stationName' && key !== 'disabled') {
              delete row[key]
            }
          })
        })

        // 获取所有站点的配置数据
        const confKeys = selectedFields.map(item => item.key)
        const results = await Promise.all(
          this.ipList.map(item => 
            this.getStationConfData(item.ip, confKeys, selectedFields)
              .catch(error => {
                console.error(`获取站点[${item.stationName}]配置失败:`, error)
                return {
                  error: true,
                  item
                }
              })
          )
        )

        // 统计失败的站点
        const failures = results.filter(r => r && r.error).map(r => r.item)

        // 添加新的检查项
        this.checkItems = selectedFields

        // 清空当前检查组名称
        this.currentGroupName = ''

        // 清空当前选中行
        this.currentRow = null

        // 根据结果提示
        if (failures.length > 0) {
          console.log(
            `${failures.length}个站点获取配置失败：${failures.map(f => f.name).join('、')}`
          )
        }
        this.$message.success('添加成功')
        this.addCheckDialogVisible = false
      } catch (error) {
        console.error('添加检查项失败:', error)
        this.$message.error('添加失败')
      } finally {
        this.pageLoading = false
      }
    },

    // 获取站点配置数据
    async getStationConfData(ip, confKeys, checkData) {
      try {
        const res = await requestProjectConf(ip, confKeys)
        // 更新表格数据
        const stationData = this.tableData.find(item => item.ip === ip)
        if (stationData) {
          // 遍历检查项，匹配返回数据
          checkData.forEach(item => {
            // 从返回数据中找到对应的字段值
            const fieldValue = (res.params && res.params[item.field || item.key]) || item.value
            // 使用 key 作为属性名，绑定值
            stationData[item.key] = fieldValue
          })
        }

        return res.params
      } catch (error) {
        // this.$message.error(`获取站点[${ip}]配置失败: ${error}`)
        throw error
      }
    },

    // 删除检查项
    handleDeleteItem(index) {
      const item = this.checkItems[index]
      this.checkItems.splice(index, 1)
      
      // 从表格数据中删除对应的属性
      this.tableData.forEach(row => {
        delete row[item.key]
      })
    },

    // // 保存为检查组
    // handleSaveGroup() {
    //   if (this.checkItems.length === 0) {
    //     this.$message.warning('请先添加检查项')
    //     return
    //   }
    //   this.saveGroupDialogVisible = true
    // },
    
    // async writeJsonReq(data, cb) {
    //   try {
    //     const res = await localhost_http({
    //       jsonrpc: '2.0',
    //       method: 'setConfFile',
    //       params: {
    //         path: `Stations/CheckGroup.jdb`,
    //         data: JSON.stringify(data),
    //         dir_type: 'run',
    //       },
    //       id: '1',
    //     })
    //     if (res.error) return this.$message.error(res.error)
    //     cb && cb()
    //     return this.$message.success('操作成功!')
    //   } catch (e) {
    //     console.log(e)
    //   }
    // },

    // 选择检查组
    async handleSelectGroup() {
      try {
        await this.getCheckGroups()
        this.selectGroupDialogVisible = true
      } catch (error) {
        console.error('获取检查组失败:', error)
        this.$message.error('获取检查组失败')
      }
    },

    // // 获取检查组数据
    // async getCheckGroups() {
    //   try {
    //     const res = await localhost_http({
    //       jsonrpc: '2.0',
    //       method: 'getConfEncodeFile',
    //       params: {
    //         path: `Stations/CheckGroup.jdb`,
    //         source_encode: 'utf8',
    //         target_encode: 'utf8',
    //         dir_type: 'run',
    //       },
    //       id: '1'
    //     })

    //     let data = JSON.parse(res.result.data || '[]')
    //     if (Array.isArray(data) && data.length > 0) {
    //       this.checkGroups = data.reverse()
    //     } else {
    //       this.checkGroups = []
    //     }
    //   } catch (error) {
    //     console.error('获取检查组失败:', error)
    //     this.checkGroups = []
    //     throw error
    //   }
    // },

    // 处理选择检查组确认
    async handleSelectGroupConfirm(group) {
      this.pageLoading = true
      try {
        // 清空现有检查项
        this.checkItems = []
        // 清空表格数据中的配置项
        this.tableData.forEach(row => {
          Object.keys(row).forEach(key => {
            if (key !== 'ip' && key !== 'name' && key !== 'disabled') {
              delete row[key]
            }
          })
        })

        // 获取所有站点的配置数据
        const confKeys = group.items.map(item => item.key)
        const results = await Promise.all(
          this.ipList.map(item => 
            this.getStationConfData(item.ip, confKeys, group.items)
              .catch(error => {
                console.error(`获取站点[${item.name}]配置失败:`, error)
                return {
                  error: true,
                  item
                }
              })
          )
        )

        // 统计失败的站点
        const failures = results.filter(r => r && r.error).map(r => r.item)

        // 添加检查项
        this.checkItems = group.items
        // 更新当前检查组名称
        this.currentGroupName = group.name

        // 根据结果提示
        if (failures.length > 0) {
          console.log(
            `${failures.length}个站点获取配置失败：${failures.map(f => f.name).join('、')}`
          )
        }
        this.$message.success('选择成功')

        this.selectGroupDialogVisible = false
      } catch (error) {
        console.error('选择检查组失败:', error)
        this.$message.error('选择失败')
      } finally {
        this.pageLoading = false
      }
    },

    // 删除检查组
    async handleDeleteGroup(group) {
      try {
        // 从列表中移除
        const index = this.checkGroups.findIndex(g => g.id === group.id)
        if (index === -1) return
        
        // 先移除数据
        this.checkGroups.splice(index, 1)
        
        // 保存到文件
        await this.writeJsonReq(this.checkGroups)
      } catch (error) {
        // 删除失败时恢复数据
        this.checkGroups.splice(index, 0, group)
        console.error('删除检查组失败:', error)
        this.$message.error('删除失败')
      }
    },

    // 保存行数据
    async handleSave(row) {
      // 检查是否有检查项
      if (this.checkItems.length === 0) {
        this.$message.warning('请先添加检查项')
        return
      }

      try {
        const { ip, name, disabled, ...configs } = row
        
        // 检查是否有配置值
        const hasValue = Object.values(configs).some(value => value !== undefined && value !== '')
        if (!hasValue) {
          this.$message.warning('请至少填写一项配置值')
          return
        }

        const data = Object.entries(configs).map(([key, value]) => `${key}=${value}`)
        const res = await requestSetProjectConf(row.ip, data)
        if (res.error) {
          throw new Error(res.error.message || '保存失败')
        }
        this.$message.success('保存成功')
      } catch (error) {
        console.error('保存失败:', error)
        this.$message.error('保存失败 ' + error.message)
      }
    },

    // 处理站点选变化
    handleSiteSelectionChange(selection) {
      this.selectedSites = selection
    },

    // 应用到其他站点
    handleApplyTo(row) {
      if (!row) {
        this.$message.warning('请先选择一行数据')
        return
      }

      if (this.checkItems.length === 0) {
        this.$message.warning('请先添加检查项')
        return
      }

      // 确保 currentRow 有值
      this.currentRow = { ...row }
      this.applyToDialogVisible = true
    },

    // 应用成功回调
    async handleApplySuccess({ sites, configs }) {
      this.pageLoading = true
      try {
        // 获取所有选中站点的最新配置
        const results = await Promise.all(
          sites.map(site => 
            this.getStationConfData(
              site.ip,
              configs.map(item => item.key),
              configs
            ).catch(error => {
              console.error(`更新站点[${site.name}]数据失败:`, error)
              return {
                error: true,
                site
              }
            })
          )
        )

        // 统计失败的站点
        const failures = results.filter(r => r && r.error).map(r => r.site)

        // 根据结果提示
        if (failures.length > 0) {
          this.$message.error(
            `${failures.length}个站点更新数据失败：${failures.map(f => f.name).join('、')}`
          )
        }

        this.applyToDialogVisible = false
      } catch (error) {
        console.error('更新数据失败:', error)
        this.$message.error('数据更新失败')
      } finally {
        this.pageLoading = false
      }
    },

    // 处理保存检查组确认
    async handleSaveGroupConfirm(newGroup) {
      try {
        // 添加到检查组列表
        this.checkGroups.push(newGroup)
        
        // 保存到文件
        await this.writeJsonReq(this.checkGroups)
      } catch (error) {
        console.error('保存检查组失败:', error)
        // 保存失败时从列表中移除
        const index = this.checkGroups.findIndex(g => g.id === newGroup.id)
        if (index > -1) {
          this.checkGroups.splice(index, 1)
        }
        this.$message.error('保存失败')
      }
    },

    // 清空检查项
    handleClearItems() {
      this.$confirm('确认清空所有检查项？', '提示', {
        type: 'warning'
      }).then(() => {
        // 清空检查项
        this.checkItems = []
        // 清空当前检查组名称
        this.currentGroupName = ''
        // 清空表格数据中的配置项
        this.tableData.forEach(row => {
          Object.keys(row).forEach(key => {
            if (key !== 'ip' && key !== 'name' && key !== 'disabled') {
              delete row[key]
            }
          })
        })
        // 清空当前选中行
        this.currentRow = null
        
        this.$message.success('已清空检查项')
      }).catch(() => {})
    },

    // 读取配置
    async handleReadConfig(row) {
      if (!row) {
        this.$message.warning('请先选择一行数据')
        return
      }

      if (this.checkItems.length === 0) {
        this.$message.warning('请先添加检查项')
        return
      }

      this.pageLoading = true
      try {
        const confKeys = this.checkItems.map(item => item.key)
        console.log('读取配置的字段:', confKeys)
        console.log('读取配置的IP:', row.ip)
        
        const res = await requestProjectConf(row.ip, confKeys)
        console.log('API返回结果:', res)

        if (res.error) {
          throw new Error(res.error.message || '读取失败')
        }

        // 更新表格数据
        const stationData = this.tableData.find(item => item.ip === row.ip)
        if (stationData) {
          console.log('找到站点数据:', stationData)
          
          confKeys.forEach(key => {
            // 尝试从不同路径获取值
            let fieldValue = ''
            if (res.params && res.params[key]) {
              fieldValue = res.params[key]
            } else if (res.params && res.params[key.split('.').pop()]) {
              // 如果完整key没有，尝试用字段名
              fieldValue = res.params[key.split('.').pop()]
            }
            
            console.log(`更新字段 ${key}: ${fieldValue}`)
            stationData[key] = fieldValue
          })
          
          // 强制更新表格
          this.$nextTick(() => {
            this.$forceUpdate()
          })
          
          console.log('更新后的站点数据:', stationData)
        } else {
          console.error('未找到对应的站点数据')
        }
        
        this.$message.success('读取成功')
      } catch (error) {
        console.error('读取配置失败:', error)
        this.$message.error('读取失败 ' + error.message)
      } finally {
        this.pageLoading = false
      }
    },

    // 批量读取配置
    async handleBatchReadConfig() {
      if (this.checkItems.length === 0) {
        this.$message.warning('请先添加检查项')
        return
      }

      this.pageLoading = true
      try {
        const results = await Promise.all(
          this.tableData.map(row => 
            this.getStationConfData(row.ip, this.checkItems.map(item => item.key), this.checkItems)
              .catch(error => {
                console.error(`批量读取站点[${row.stationName}]配置失败:`, error)
                return {
                  error: true,
                  row
                }
              })
          )
        )

        // 统计失败的站点
        const failures = results.filter(r => r && r.error).map(r => r.row)

        // 根据结果提示
        if (failures.length > 0) {
          this.$message.error(
            `${failures.length}个站点批量读取失败：${failures.map(f => f.stationName).join('、')}`
          )
        } else {
          this.$message.success('所有站点批量读取成功')
        }
      } catch (error) {
        console.error('批量读取失败:', error)
        this.$message.error('批量读取失败')
      } finally {
        this.pageLoading = false
      }
    },

    // 查看配置
    async handleViewConfig(row) {
      await this.handleReadConfig(row)
      // 设置查看数据并打开弹窗
      this.viewConfigData = { ...row }
      this.viewConfigDialogVisible = true
    },

    // 查看配置弹窗刷新
    async handleViewConfigRefresh(configData) {
      if (!configData || !configData.ip) {
        this.$message.error('无效的配置数据')
        return
      }

      try {
        // 重新读取配置数据
        const confKeys = this.checkItems.map(item => item.key)
        const res = await requestProjectConf(configData.ip, confKeys)
        
        if (res.error) {
          throw new Error(res.error.message || '读取失败')
        }

        // 更新查看数据
        const updatedData = { ...configData }
        confKeys.forEach(key => {
          let fieldValue = ''
          if (res.params && res.params[key]) {
            fieldValue = res.params[key]
          } else if (res.params && res.params[key.split('.').pop()]) {
            fieldValue = res.params[key.split('.').pop()]
          }
          updatedData[key] = fieldValue
        })

        this.viewConfigData = updatedData

        // 同时更新表格中的数据
        const stationData = this.tableData.find(item => item.ip === configData.ip)
        if (stationData) {
          confKeys.forEach(key => {
            stationData[key] = updatedData[key]
          })
        }

        this.$message.success('数据刷新成功')
      } catch (error) {
        console.error('刷新配置数据失败:', error)
        this.$message.error('刷新失败: ' + error.message)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.global-param-config {
  display: flex;
  gap: 10px;
  height: 100%;
  padding: 2px;
  box-sizing: border-box;
  
  .config-panel {
    width: 350px;
    height: 100%;
    flex-shrink: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    
    :deep(.el-card__body) {
      height: 100%;
      padding: 15px;
      display: flex;
      flex-direction: column;
    }
    
    .panel-header {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid #EBEEF5;
      flex-shrink: 0;
    }
    
    .check-list {
      flex: 1;
      overflow-y: auto;
      margin-bottom: 16px;
      padding-right: 5px;
      
      .check-item {
        padding: 12px 15px;
        border: 1px solid #EBEEF5;
        border-radius: 4px;
        margin-bottom: 10px;
        background-color: #fff;
        transition: all 0.3s;
        
        &:hover {
          box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
          border-color: #e6e6e6;
          
          .el-button {
            opacity: 1;
          }
        }
        
        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          word-break: break-word;
          > div {
            flex: 1;
            margin-right: 10px;
            font-size: 14px;
          }
          .item-name {
            color: #909399;
            font-size: 13px;
          }
          
          .el-button {
            padding: 2px;
            color: #909399;
            
            &:hover {
              color: #f56c6c;
            }
          }
        }
      }
    }
    
    .action-area {
      .el-button {
        width: 100%;
        margin-bottom: 10px;
      }
      
      .group-actions {
        display: flex;
      }
    }
  }
  
  .table-panel {
    flex: 1;
    background-color: #fff;
    padding: 20px;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
    display: flex;
    flex-direction: column;
    min-width: 0;
    
    .panel-header {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #EBEEF5;
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .table-container {
      flex: 1;
      overflow: auto;
      
      :deep(.el-table) {
        min-width: 100%;
        
        .el-table__fixed,
        .el-table__fixed-right {
          height: 100% !important;
          bottom: 0 !important;
        }
        
        th {
          background-color: #f5f7fa;
          color: #606266;
        }
        
        .el-button {
          padding: 7px 12px;
        }
        
        .el-button + .el-button {
          margin-left: 8px;
        }
      }
    }
  }
}

// 弹窗样式
:deep(.el-dialog__body) {
  padding: 10px 20px;
}

:deep(.el-transfer) {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  
  .el-transfer-panel {
    width: 250px;
    
    &__body {
      height: 300px;
    }
  }
}

// 添加表格样式
:deep(.el-table) {
  margin: 10px 0;
  
  th {
    background-color: #f5f7fa;
    color: #606266;
  }
  
  .el-table__header-wrapper {
    border-bottom: 1px solid #EBEEF5;
  }
}

.group-list {
  max-height: 500px;
  overflow-y: auto;
  padding: 10px;
  
  .group-card {
    margin-bottom: 15px;
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
        
        .el-tag {
          height: 20px;
          line-height: 18px;
        }
      }
      
      .group-actions {
        display: flex;
        align-items: center;
        gap: 10px;

        .group-time {
          color: #909399;
          font-size: 13px;
        }

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
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      .group-item {
        background-color: #fff;
        border-color: #e4e7ed;
      }
    }
  }
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #dcdfe6;
    border-radius: 3px;
  }
}

// 添加配置签样式
.config-tag {
  margin-right: 8px;
  margin-bottom: 4px;
}

.no-config {
  color: #909399;
  font-size: 13px;
}

// 修改表格样式
:deep(.el-table) {
  .el-tag {
    margin-right: 8px;
    
    &:last-child {
      margin-right: 0;
    }
  }
}

// 添加树形表格样式
:deep(.el-table) {
  .el-table__expand-icon {
    margin-right: 8px;
  }
  
  .cell {
    .el-tooltip {
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
p {
  margin: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .current-group {
    font-size: 13px;
    color: #409EFF;
    font-weight: normal;
  }

  .clear-btn {
    padding: 0;
    font-size: 14px;
    color: #909399;
    
    &:hover {
      color: #f56c6c;
    }
  }
}

-webkit-scrollbar {
  width: 6px;
}

-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

:deep(.el-tooltip__popper.is-light) {
  // 自定义 tooltip 样式
  border: 1px solid #EBEEF5;
  padding: 8px 12px;
  color: #606266;
  font-size: 13px;
  line-height: 1.4;
  max-width: 300px;
  word-break: break-word;
}

</style>
