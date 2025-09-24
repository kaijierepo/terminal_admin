<script setup>
import { useAppStore } from '../../store/modules/app';
import { storeToRefs } from 'pinia';
import { Expand, Fold } from '@element-plus/icons-vue';

const { isMenuCollapse } = storeToRefs(useAppStore());
const { toggleMenuCollapse } = useAppStore();
</script>

<template>
  <div class="component-collapse flex-center clickable" @click="toggleMenuCollapse()">
    <ElIcon :size="20" >
      <Expand v-show="isMenuCollapse"></Expand>
      <Fold v-show="!isMenuCollapse"></Fold>
    </ElIcon>
  </div>
</template>

<style scoped lang="scss">

</style>