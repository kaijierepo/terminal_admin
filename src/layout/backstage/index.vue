<script setup>
import AppMain from './appMain.vue';
import SideBar from './sidebar/index.vue';
import Header from './header/index.vue';

</script>

<template>
  <div class="layout">
    <SideBar class="sidebar"></SideBar>
    <div class="right">
      <Header class="header"></Header>
      <AppMain class="app-main"></AppMain>
    </div>
  </div>
</template>

<style scoped lang="scss">
.layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  .sidebar {
    // width: $sidebar-width;
    background-color: #010f36;
    font-size: 14px;
    color: #fff;
    flex-shrink: 0;
    // border-right: 1px solid $border-color;
  }
  .right {
    display: flex;
    flex-direction: column;
    flex: auto;
    width: 0;
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: $header-height;
      padding: 0 $page-padding;
      line-height: $header-height;
      background-color: $header-bg-color;
      font-size: $header-font-size;
      color: $header-text-color;
      border-bottom: 2px solid #eee;
    }
    .app-main {
      flex: 1;
      padding: 10px;
      min-width: 800px;
      overflow: scroll;
      background-color: $page-bg-color;
    }
  }
}
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: $sidebar-width;
}
</style>