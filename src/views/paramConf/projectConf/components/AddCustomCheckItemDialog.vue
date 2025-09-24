<template>
  <el-dialog
    title="补充检查项"
    :model-value="visible"
    width="500px"
    :append-to-body="true"
    :modal-append-to-body="false"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose">
    <el-form 
      ref="form"
      :model="form"
      :rules="rules"
      label-width="80px"
      size="small">
      <el-form-item 
        label="完整Key" 
        prop="key">
        <el-input 
          v-model="form.key"
          placeholder="请输入完整key值，如：AlarmRemarksInfo.AlarmRemarksName_0">
        </el-input>
      </el-form-item>
      <el-form-item 
        label="说明" 
        prop="label">
        <el-input 
          v-model="form.label"
          placeholder="请输入说明">
        </el-input>
      </el-form-item>
      <el-form-item 
        label="默认值" 
        prop="defaultValue">
        <el-input 
          v-model="form.defaultValue"
          placeholder="请输入默认值">
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
  name: 'AddCustomCheckItemDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },

  data() {
    const validateKey = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入完整key值'))
      } else if (!value.includes('.')) {
        callback(new Error('key值必须包含分组名称，以"."分隔'))
      } else {
        callback()
      }
    }

    return {
      form: {
        key: '',
        label: '',
        defaultValue: ''
      },
      rules: {
        key: [
          { required: true, validator: validateKey, trigger: 'blur' }
        ],
        label: [
          { required: true, message: '请输入说明', trigger: 'blur' }
        ]
      }
    }
  },

  methods: {
    // 确认添加
    handleConfirm() {
      this.$refs.form.validate(valid => {
        if (!valid) return

        const [groupName, field] = this.form.key.split('.')
        const newItem = {
          field: field,
          label: this.form.label,
          key: this.form.key,
          defaultValue: this.form.defaultValue,
          groupName
        }

        this.$emit('confirm', newItem)
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

<style lang="scss" scoped>
// 调整弹窗层级
:deep(.el-dialog__wrapper) {
  z-index: 3001 !important;
}

// 调整遮罩层层级
:deep(.v-modal) {
  z-index: 3000 !important;
}

// 调整表单样式
:deep(.el-form) {
  .el-form-item {
    margin-bottom: 18px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

// 调整输入框样式
:deep(.el-input) {
  .el-input__inner {
    height: 32px;
    line-height: 32px;
  }
}
</style> 