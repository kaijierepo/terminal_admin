<template>
  <el-dialog
    title="保存检查组"
    :model-value="visible"
    width="400px"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose">
    <el-form 
      ref="form"
      :model="form"
      :rules="rules"
      label-width="70px"
      size="small">
      <el-form-item 
        label="组名称" 
        prop="name">
        <el-input 
          v-model="form.name"
          placeholder="请输入检查组名称">
        </el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button size="small" @click="closeDialog">取 消</el-button>
      <el-button size="small" type="primary" @click="handleConfirm">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'SaveCheckGroupDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    checkItems: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      form: {
        name: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入检查组名称', trigger: 'blur' },
        ]
      }
    }
  },

  methods: {
    // 确认保存
    handleConfirm() {
      this.$refs.form.validate(valid => {
        if (!valid) return

        const newGroup = {
          id: Date.now(),
          name: this.form.name,
          createTime: new Date().toLocaleString(),
          items: this.checkItems
        }

        this.$emit('confirm', newGroup)
        this.handleClose()
      })
    },

    // 取消
    closeDialog() {
      this.$emit('update:visible', false)
    },

    // 关闭弹窗
    handleClose() {
      this.$emit('update:visible', false)
      this.$refs.form.resetFields()
    }
  }
}
</script>
