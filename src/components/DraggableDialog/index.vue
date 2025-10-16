<template>
  <teleport to="body">
    <div
      v-if="modelValue"
      class="draggable-dialog-container"
      :class="{ 'has-modal': modal }"
      :style="{ pointerEvents: modal ? 'auto' : 'none' }"
    >
      <!-- 蒙层 -->
      <div
        v-if="modal"
        class="dialog-overlay"
        @click="handleOverlayClick"
      ></div>

      <!-- 对话框主体 -->
      <div
        ref="dialogRef"
        class="dialog-wrapper"
        :style="dialogStyle"
        @mousedown="handleMouseDown"
      >
        <!-- 头部 -->
        <div class="dialog-header" ref="headerRef">
          <span class="dialog-title">{{ title }}</span>
          <button class="dialog-close" @click="handleClose">
            <svg viewBox="0 0 1024 1024" width="16" height="16">
              <path
                d="M512 456.310154L94.247385 38.557538a39.542154 39.542154 0 1 0-55.689847 55.689847L456.310154 512 38.557538 929.752615a39.542154 39.542154 0 1 0 55.689847 55.689847L512 567.689846l417.752615 417.752616a39.542154 39.542154 0 1 0 55.689847-55.689847L567.689846 512l417.752616-417.752615a39.542154 39.542154 0 1 0-55.689847-55.689847L512 456.310154z"
                fill="currentColor"
              ></path>
            </svg>
          </button>
        </div>

        <!-- 内容区 -->
        <div class="dialog-body">
          <slot></slot>
        </div>

        <!-- 底部 -->
        <div v-if="$slots.footer" class="dialog-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "",
  },
  width: {
    type: String,
    default: "50%",
  },
  modal: {
    type: Boolean,
    default: true,
  },
  closeOnClickModal: {
    type: Boolean,
    default: true,
  },
  beforeClose: {
    type: Function,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "close"]);

const dialogRef = ref(null);
const headerRef = ref(null);
const isDragging = ref(false);
const position = ref({ x: 0, y: 0 });
const dragStart = ref({ x: 0, y: 0 });

// 对话框样式
const dialogStyle = computed(() => ({
  width: props.width,
  transform: `translate(${position.value.x}px, ${position.value.y}px)`,
  pointerEvents: "auto",
}));

// 重置位置
const resetPosition = () => {
  position.value = { x: 0, y: 0 };
};

// 监听显示状态，重置位置
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      nextTick(() => {
        resetPosition();
      });
    }
  }
);

// 处理鼠标按下（开始拖动）
const handleMouseDown = (e) => {
  // 只有点击头部才能拖动
  if (!headerRef.value?.contains(e.target)) {
    return;
  }

  // 不拖动关闭按钮
  if (e.target.closest(".dialog-close")) {
    return;
  }

  isDragging.value = true;
  dragStart.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y,
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
  
  // 防止文本选中
  e.preventDefault();
};

// 处理鼠标移动
const handleMouseMove = (e) => {
  if (!isDragging.value) return;

  position.value = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y,
  };
};

// 处理鼠标释放
const handleMouseUp = () => {
  isDragging.value = false;
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
};

// 处理蒙层点击
const handleOverlayClick = () => {
  if (props.closeOnClickModal) {
    handleClose();
  }
};

// 处理关闭
const handleClose = () => {
  if (props.beforeClose) {
    props.beforeClose(() => {
      emit("update:modelValue", false);
      emit("close");
    });
  } else {
    emit("update:modelValue", false);
    emit("close");
  }
};
</script>

<style scoped lang="scss">
.draggable-dialog-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.dialog-wrapper {
  position: relative;
  z-index: 2;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  // max-height: 90vh;
  transition: transform 0.01s linear;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  cursor: move;
  user-select: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px 8px 0 0;

  .dialog-title {
    font-size: 18px;
    font-weight: 600;
    color: #fff;
  }

  .dialog-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 4px;
    color: #fff;
    transition: all 0.3s;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.dialog-body {
  padding: 20px;
  flex: 1;
  overflow: auto;
}

.dialog-footer {
  padding: 12px 20px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #f8f9fa;
  border-radius: 0 0 8px 8px;
}
</style>

