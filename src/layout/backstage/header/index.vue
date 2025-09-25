<script setup>
import Breadcrumb from './breadcrumb.vue';
import Collapse from './collapse.vue';
import { Screenfull } from '@/components/Screenfull/index';
import StationSelector from '@/components/StationSelector/index.vue';

</script>

<template>
  <div class="component-header flex-between">
    <div class="flex-center">
      <Collapse class="mr-5"></Collapse>
      <Breadcrumb></Breadcrumb>
    </div>
    <div class="flex-center">
      <StationSelector
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