<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0
  },
  text: {
    type: String,
    default: '加载中...'
  }
})
</script>

<template>
  <div v-if="loading" class="loading-overlay">
    <div class="loading-content">
      <div class="progress-bar">
        <div 
          class="progress-inner"
          :style="{ width: `${progress}%` }"
        />
      </div>
      <div class="progress-text">{{ text }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-content {
  text-align: center;
  color: white;
  
  .progress-bar {
    width: 200px;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 10px;
  }
  
  .progress-inner {
    height: 100%;
    background: #409EFF;
    transition: width 0.3s ease;
  }
  
  .progress-text {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
  }
}
</style> 