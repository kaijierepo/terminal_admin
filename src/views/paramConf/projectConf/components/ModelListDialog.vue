<template>
  <el-dialog
    :title="`${site.name} - 模型列表`"
    :model-value="visible"
    width="600px"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose">
    <div v-loading="loading">
      <el-table
        v-if="modelList.length"
        :data="modelList"
        border
        :max-height="400"
        style="width: 100%">
        <el-table-column
          type="index"
          label="序号"
          width="80"
          align="center">
        </el-table-column>
        <el-table-column
          prop="name"
          label="模型名称"
          min-width="200"
          show-overflow-tooltip>
        </el-table-column>
      </el-table>
      <div v-else class="empty-tip">
        暂无模型文件
      </div>
    </div>
    <template #footer>
      <el-button @click="handleClose">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { public_http_ip } from '@/public_api/introduction-ip-api'

export default {
  name: 'ModelListDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    site: {
      type: Object,
      default: () => ({})
    }
  },

  data() {
    return {
      loading: false,
      modelList: []
    }
  },

  watch: {
    visible: {
      immediate: true,
      async handler(val) {
        if (val && this.site.ip) {
          await this.getModelList()
        } else {
          // 关闭时清空数据
          this.modelList = []
        }
      }
    }
  },

  methods: {
    // 获取模型列表
    async getModelList() {
      this.loading = true
      this.modelList = []

      try {
        const res = await public_http_ip(this.site.ip, {
          jsonrpc: '2.0',
          method: 'getAIModelList',
          params: {},
          id: 1,
        })
        // 转换数据格式
        this.modelList = (res.result || []).map(name => ({
          name
        }))
      } catch (error) {
        console.error('获取模型列表失败:', error)
        this.$message.error('获取模型列表失败')
      } finally {
        this.loading = false
      }
    },

    // 关闭弹窗
    handleClose() {
      this.$emit('update:visible', false)
      this.modelList = [] // 清空数据
    }
  }
}
</script>

<style lang="scss" scoped>
.empty-tip {
  padding: 30px 0;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

</style> 