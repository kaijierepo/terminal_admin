<script setup>
import { Icon } from '@/components/Icon';

// import { useTransition } from '@vueuse/core'

const summaryConf = [
  { name: 'visit', title: '访问量', icon: 'ph:cursor-click-bold', color: 'red', tip: '-', symbol: '', count: 5499900 },
  { name: 'user', title: '用户数量', icon: 'icon-park:people-top-card', color: 'green', tip: '-', symbol: '', count: 38490455 },
  { name: 'sale', title: '总销量', icon: 'noto-v1:money-bag', color: '', tip: '-', symbol: '$', count: 9009900 },
  { name: 'num', title: '成交数', icon: 'icon-park:tickets-two', color: '', tip: '-', symbol: '', count: 48449 },
]

const loading = ref(true);

setTimeout(() => {
  loading.value = false;
}, 1000);

</script>

<template>
  <div class="component-data-summary flex">
    <ContentWrap
      class="data-box flex-1"
      v-for="(item, index) in summaryConf"
      :key="index"
      :title="item.title"
      :tooltip-messge="item.tip"
    >
      <ElSkeleton :loading="loading" animated>
        <template #default>
          <div class="flex-between">
            <div class="flex-center">
              <span class="fs-30 mr-1">{{ item.symbol }}</span>
              <ElStatistic class="stat" :value="item.count" />
            </div>
            <Icon :icon="item.icon" :color="item.color" :size="40"></Icon>
          </div>
        </template>
        <template #template>
          <ElSkeletonItem variant="text" />
          <ElSkeletonItem variant="text" />
        </template>
      </ElSkeleton>
    </ContentWrap>
  </div>
</template>

<style lang="scss" scoped>
.component-data-summary {
  height: 100%;
  padding: 10px;
  .data-box {
    margin-right: 10px;
    &:last-child {
      margin-right: 0;
    }
  }
  :deep .el-statistic__content {
    font-size: 30px !important;
  }
}
</style>