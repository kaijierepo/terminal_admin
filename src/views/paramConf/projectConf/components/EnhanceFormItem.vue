<template>
 <el-form-item :prop="field">
  <template #label>
   <el-tooltip :content="comment">
    <span>{{ label }}</span>
   </el-tooltip>
  </template>
  <div :style="containerStyle" class="form_item_style">
   <div class="form_item_style_left">
    <el-radio-group :disabled="disabled" v-if="type === 'radio'" v-model="form[field]">
     <el-radio v-for="(item, i) in options" :label="item.label" :key="i">{{ item.value }}</el-radio>
    </el-radio-group>
    <el-switch
     v-else-if="type === 'switch'"
     :disabled="disabled"
     v-model="form[field]"
     active-color="#13ce66"
     inactive-color="#D7DBDD"
     :active-value="config.activeValue || 1"
     :inactive-value="config.inactiveValue || 0"
     :active-text="config.activeText || '开'"
     :inactive-text="config.inactiveText || '关'"
    ></el-switch>
    <div v-else-if="type === 'inputNumber'">
     <el-input-number
      :disabled="disabled"
      style="width: 100px;height: 30px;line-height: 30px"
      v-model="form[field]"
      :controls="false"
      :min="0"
     ></el-input-number>
     <span>{{ unit }}</span>
    </div>
    <el-input
     :disabled="disabled"
     class="no-resize"
     v-else-if="type === 'textarea'"
     type="textarea"
     :rows="2"
     placeholder="请输入ip和port, 以空格分隔"
     v-model.trim="form[field]"
    >
    </el-input>
    <div class="slider_style" v-else-if="type === 'slider'">
     <el-slider
      :disabled="disabled"
      v-model="form[field]"
      style="width: 160px"
      :min="config.min"
      :max="config.max"
      :step="config.step"
     ></el-slider>
     <span>{{ form[field] }}%</span>
    </div>
    <el-select :disabled="disabled" v-model="form[field]" v-else-if="type === 'select'">
     <el-option
      v-for="(item, i) in options"
      :key="i"
      :label="item.label"
      :value="item.value"
     ></el-option>
    </el-select>
   </div>

   <div class="form_item_style_mid">
    <span v-if="isError" class="error_info">
     {{ forceCondition.message }}
    </span>
    <span v-else-if="form[field] === defaultValue && type === 'select'" class="success_info">
     {{ form[field] }}
    </span>
    <span v-else-if="form[field] === defaultValue && type === 'slider'" class="success_info">
     {{ form[field] }}
    </span>
    <span v-else-if="form[field] === defaultValue && type === 'radio'" class="success_info">
     {{ form[field] }}
    </span>
    <span
     v-else-if="isSpecialSuccessJudge(form[field], defaultValue) && type === 'inputNumber'"
     class="success_info"
    >
     {{ defaultValue === '' ? '空' : defaultValue }}{{ unit }}
    </span>
    <span
     v-else-if="form[field] === defaultValue && type === 'switch' && config.activeText"
     class="success_info"
    >
     {{ form[field] === 1 ? config.activeText : config.inactiveText }}
    </span>
    <span v-else-if="form[field] === defaultValue && type === 'switch'" class="success_info">
     {{ form[field] === 1 ? '开启' : '关闭' }}
    </span>
    <span v-else-if="type === 'slider'" class="warn_info"> 建议为{{ defaultValue }}% </span>
    <span v-else-if="type === 'select'" class="warn_info">建议为{{ defaultValue }}</span>
    <span v-else-if="form[field] !== defaultValue && type === 'inputNumber'" class="warn_info">
     建议为{{ defaultValue === '' ? '空' : defaultValue }}{{ unit }}
    </span>
    <span v-else-if="type === 'switch' && config.activeText" class="warn_info">
     建议为{{ defaultValue === 1 ? config.activeText : config.inactiveText }}
    </span>
    <span v-else-if="type === 'switch'" class="warn_info">
     建议为{{ defaultValue === 1 ? '开启' : '关闭' }}
    </span>
    <span v-else-if="type === 'radio'" class="warn_info"> 建议为{{ defaultValue }} </span>
   </div>
   <!-- <el-tooltip class="item" effect="dark" :content="comment" placement="right">
    <el-button type="text">
     解释说明
    </el-button>
   </el-tooltip> -->
  </div>
 </el-form-item>
</template>

<script>
export default {
 props: {
  containerStyle: {
   type: Object,
   default: () => ({}),
  },
  value: {
   type: String,
   default: '',
  },
  disabled: {
   type: Boolean,
   default: false,
  },
  defaultValue: {
   type: [String, Number, Boolean, Object, Array],
   default: '',
  },
  unit: {
   type: String,
   default: '',
  },
  comment: {
   type: String,
   default: '',
  },
  config: {
   type: Object,
   default: () => ({}),
  },
  type: {
   type: String,
   default: 'switch',
  },
  field: {
   type: String,
   default: '',
  },
  label: {
   type: String,
   default: '',
  },
  options: {
   type: Array,
   default: () => [],
  },
  form: {
   type: Object,
   default: () => {},
  },
  manufacturer: {
   type: String,
   default: 'default',
  },
  forceCondition: {
   type: Object,
   default: null,
  },
 },
 computed: {
  isError() {
   // console.log('forceCondition', this.forceCondition, this.manufacturer, this.form[this.field])
   if (this.forceCondition && Reflect.has(this.forceCondition, this.manufacturer)) {
    return this.forceCondition[this.manufacturer] !== this.form[this.field]
   }
   return false
  },
 },
 methods: {
  isSpecialSuccessJudge(currentValue, defaultValue) {
   let value = currentValue
   if (Object.prototype.toString.call(currentValue) === '[object Undefined]') {
    value = ''
   }
   return value === defaultValue
  },
 },
}
</script>

<style lang="scss" scoped>
.form_item_style {
 display: flex;
 width: 280px;
 align-items: center;
  gap: 10px;
 .form_item_style_left {
  flex: 1;
  box-sizing: border-box;
  padding-left: 20px;
  text-align: left;

  .slider_style {
   display: flex;
   align-items: center;
   gap: 10px;
  }
 }
 .form_item_style_mid {
  text-align: left;
  font-weight: bold;
  // min-width: 100px;
  .error_info {
   color: #e74c3c;
  }
  .success_info {
   color: #13ce66;
  }
  .warn_info {
   color: #f4d03f;
  }

  .no-resize ::v-deep textarea {
   resize: none;
  }
 }
}
</style>
