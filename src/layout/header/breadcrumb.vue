<script setup>
import { useAppStore } from '../../store/modules/app';
import { storeToRefs } from 'pinia';

import { wholeMenuRouterMap } from '@/router/index.js';
const { currentMenu } = storeToRefs(useAppStore());
const { changeCurrentMenu } = useAppStore();

const changeActiveMenu = (path, idx) => {
  if (idx === unref(currentMenu).length - 1) return;
  let curRoute = wholeMenuRouterMap;
  let curPaths = unref(currentMenu).slice(0, idx + 1);

  for (let i = 0; i <= idx; i++) {
    const routeName = unref(currentMenu)[i].split('/')[0];
    const route = curRoute.find(v => v.name == routeName);
    curRoute = route.children;
  }
  curPaths = curPaths.concat(getLastRoute(curRoute[0]));
  changeCurrentMenu(curPaths);
}
const getLastRoute = (routes) => {
  let res = [];
  if (routes?.children?.length) {
    res = res.concat(getLastRoute(routes.children[0]));
  }
  res.push(`${routes.name}/${routes.meta.title}`);
  return res;
}

</script>

<template>
  <div class="component-breadcrumb">
    <ElBreadcrumb>
      <ElBreadcrumbItem
        v-for="(item, idx) in currentMenu"
        :key="item"
        @click="changeActiveMenu(item, idx)"
        :to="{ name: idx === currentMenu.length - 1 ? '' : item.split('/')[0] }"
      >
        {{ item .split('/')[1] }}
      </ElBreadcrumbItem>
    </ElBreadcrumb>
  </div>
</template>

<style scoped lang="scss">

</style>