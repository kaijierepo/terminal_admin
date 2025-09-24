<template>
  <div class="month-day-selector">
    <el-form-item label="时间">
      <div class="flex">
        <el-date-picker
          v-model="selectedMonth"
          type="month"
          placeholder="请选择月份"
          @change="handleMonthChange"
          style="width: 120px"
          format="YYYY-MM"
          value-format="YYYY-MM"
          :clearable="false"
          :disabled="disabled"
        />
        <el-select
          v-model="selectedDay"
          placeholder="请选择日期"
          @change="handleDayChange"
          style="width: 120px"
          :disabled="!selectedMonth || disabled"
          :clearable="false"
          :loading="dayLoading"
        >
          <el-option
            v-for="item in dayList"
            :key="item.time"
            :label="item.label"
            :value="item.time"
          />
        </el-select>
      </div>
    </el-form-item>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { ElMessage } from "element-plus";
import { requestDBDayList } from "@/api/db";
import { useStationStore } from "@/store/modules/station";
import dayjs from "dayjs";

// Props定义
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ month: dayjs().format("YYYY-MM"), day: "" }),
  },
  tag: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  autoLoad: {
    type: Boolean,
    default: true,
  },
  defaultSelectCurrentMonth: {
    type: Boolean,
    default: true,
  },
  defaultSelectFirstDay: {
    type: Boolean,
    default: true,
  },
});

// Emits定义
const emit = defineEmits(["update:modelValue", "change", "dayLoaded"]);

// 响应式数据
const selectedMonth = ref(
  props.modelValue.month ||
    (props.defaultSelectCurrentMonth ? dayjs().format("YYYY-MM") : "")
);
const selectedDay = ref(props.modelValue.day || "");
const dayList = ref([]);
const dayLoading = ref(false);

// Store
const stationStore = useStationStore();
const selectedStation = computed(() => {
  return stationStore.getSelectedStation;
});

// 获取日期列表
const loadDayList = async (month) => {
  if (!selectedStation.value?.ip || !props.tag || !month) {
    return;
  }

  try {
    dayLoading.value = true;
    const response = await requestDBDayList(selectedStation.value.ip, {
      tag: `${props.tag}.扳动录像`,
      time: month,
    });

    if (response?.result?.length) {
      response.result.forEach((v) => {
        v.label = dayjs(v.time).format("DD");
      });

      dayList.value = response.result;

      // 如果启用默认选择第一个日期且当前没有选中日期
      if (
        props.defaultSelectFirstDay &&
        dayList.value.length > 0 &&
        !selectedDay.value
      ) {
        selectedDay.value = dayList.value[0].time;
        emit("update:modelValue", {
          month: selectedMonth.value,
          day: selectedDay.value,
        });
        emit("change", { month: selectedMonth.value, day: selectedDay.value });
      }

      emit("dayLoaded", dayList.value);
    } else {
      dayList.value = [];
      selectedDay.value = "";
      emit("update:modelValue", { month: selectedMonth.value, day: "" });
      emit("change", { month: selectedMonth.value, day: "" });
    }
  } catch (error) {
    console.error("获取日期列表失败:", error);
    ElMessage.error("获取日期列表失败");
    dayList.value = [];
    selectedDay.value = "";
  } finally {
    dayLoading.value = false;
  }
};

// 处理月份变化
const handleMonthChange = async (month) => {
  selectedMonth.value = month;
  selectedDay.value = "";
  dayList.value = [];

  if (month) {
    await loadDayList(month);
  }

  emit("update:modelValue", {
    month: selectedMonth.value,
    day: selectedDay.value,
  });
  emit("change", { month: selectedMonth.value, day: selectedDay.value });
};

// 处理日期变化
const handleDayChange = (day) => {
  selectedDay.value = day;
  emit("update:modelValue", {
    month: selectedMonth.value,
    day: selectedDay.value,
  });
  emit("change", { month: selectedMonth.value, day: selectedDay.value });
};

// 监听modelValue变化
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      selectedMonth.value = newVal.month || "";
      selectedDay.value = newVal.day || "";
    }
  },
  { deep: true }
);

// 监听站点变化，重新加载数据
watch(
  selectedStation,
  (newStation) => {
    if (newStation?.ip && props.autoLoad && selectedMonth.value) {
      loadDayList(selectedMonth.value);
    }
  },
  { deep: true }
);

// 监听tag变化，重新加载数据
watch(
  () => props.tag,
  (newTag) => {
    if (newTag && selectedMonth.value) {
      loadDayList(selectedMonth.value);
    }
  }
);

// 暴露方法给父组件
const refresh = () => {
  if (selectedMonth.value) {
    loadDayList(selectedMonth.value);
  }
};

const refreshData = () => {
  // 触发change事件，让父组件处理数据加载
  emit("change", { month: selectedMonth.value, day: selectedDay.value });
};

const getSelectedMonth = () => {
  return selectedMonth.value;
};

const getSelectedDay = () => {
  return selectedDay.value;
};

const getDayList = () => {
  return dayList.value;
};

const isLoading = () => {
  return dayLoading.value;
};

// 暴露方法
defineExpose({
  refresh,
  refreshData,
  getSelectedMonth,
  getSelectedDay,
  getDayList,
  isLoading,
});

// 组件挂载时加载数据
onMounted(() => {
  if (props.autoLoad && selectedMonth.value) {
    loadDayList(selectedMonth.value);
  }
});
</script>

<style scoped>
.month-day-selector {
  width: 100%;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}
</style>
