<script setup>

</script>

<template>
  <div class="component-app-main">
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component class="main-content" :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<style scoped lang="scss">

</style>