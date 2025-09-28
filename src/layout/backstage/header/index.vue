<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Breadcrumb from './breadcrumb.vue';
import Collapse from './collapse.vue';
import { Screenfull } from '@/components/Screenfull/index';
import StationSelector from '@/components/StationSelector/index.vue';

const route = useRoute();

// 根据当前路由的 meta.showStationSelector 属性决定是否显示 StationSelector
const showStationSelector = computed(() => {
  // 如果 meta.showStationSelector 明确设置为 false，则隐藏
  // 否则显示（包括 true 和 undefined 的情况）
  return route.meta.showStationSelector !== false;
});

</script>

<template>
  <div class="component-header flex-between">
    <div class="flex-center">
      <Collapse class="mr-5"></Collapse>
      <Breadcrumb></Breadcrumb>
    </div>
    <div class="flex-center">
      <StationSelector
        v-if="showStationSelector"
        class="mr-5"
        width="280px"
      />
      <Screenfull class="mr-5" :size="30" color="#696969"></Screenfull>
    </div>
  </div>
</template>

<style scoped lang="scss">
.flex-center {
  display: flex;
  align-items: center;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mr-5 {
  margin-right: 20px;
}
</style>