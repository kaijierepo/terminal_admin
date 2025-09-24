<template>
  <div>
    <iframe :src="iframeSrc" frameborder="0"></iframe>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useStationStore } from '@/store/modules/station'

const iframeSrc = ref('');

onMounted(() => {
  console.log(selectedStation.value.ip)
  const ip = selectedStation.value.ip;
  iframeSrc.value = `http://${ip}:81/index.html#/electricity_export?ip=${ip}&port=81`;
});

const stationStore = useStationStore();

const selectedStation = computed(() => {
  return stationStore.getSelectedStation;
});

watch(selectedStation, (newVal) => {
  iframeSrc.value = `http://${newVal.ip}:81/index.html#/electricity_export?ip=${newVal.ip}&port=81`;
});


</script>

<style scoped>
iframe {
  width: 100%;
  height: calc(100vh - 100px);
}
</style>
