<script setup>
import StackBar from './components/stackBar.vue';
</script>

<template>
  <div class="page-chart">
    <ElRow :gutter="20">
      <ElCol :span="24">
        <ElCard shadow="never" class="mt-5">
          <StackBar></StackBar>
        </ElCard>
      </ElCol>
    </ElRow>
  </div>
</template>

<style lang="scss" scoped>
.page-chart {
  background-color: #eee;
}
</style>