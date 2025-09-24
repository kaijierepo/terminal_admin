import { defineStore } from "pinia";

export const useStationStore = defineStore('station', {
  state: () => {
    return {
      stationList: [],
      selectedStationIp: '' // 当前选中的站点IP
    }
  },
  getters: {
    // 获取所有站点列表
    getAllStations: (state) => state.stationList,
    
    // 根据ID获取站点
    getStationById: (state) => (id) => {
      return state.stationList.find(station => station.id === id);
    },
    
    // 根据IP获取站点
    getStationByIp: (state) => (ip) => {
      return state.stationList.find(station => station.ip === ip);
    },
    
    // 获取站点数量
    getStationCount: (state) => state.stationList.length,
    
    // 检查是否有站点
    hasStations: (state) => state.stationList.length > 0,
    
    // 获取所有IP地址列表
    getAllIps: (state) => state.stationList.map(station => station.ip),
    
    // 获取所有站点名称列表
    getAllStationNames: (state) => state.stationList.map(station => station.stationName || station.name),
    
    // 获取当前选中的站点IP
    getSelectedStationIp: (state) => state.selectedStationIp,
    
    // 获取当前选中的站点对象
    getSelectedStation: (state) => {
      return state.stationList.find(station => station.ip === state.selectedStationIp);
    },
    
    // 检查是否有选中的站点
    hasSelectedStation: (state) => !!state.selectedStationIp
  },
  actions: {
    // 初始化站点列表（persist 插件会自动从 localStorage 加载）
    initStationList() {
      // 这里只需要确保 stationList 已初始化
      if (!this.stationList) {
        this.stationList = [];
      }
    },
    
    // 添加单个站点
    addStation(station) {
      // 检查是否已存在相同IP的站点
      const existingStation = this.stationList.find(s => s.ip === station.ip);
      
      if (existingStation) {
        throw new Error('该IP地址的站点已存在');
      }
      
      this.stationList.push(station);
    },
    
    // 批量添加站点
    addStations(stations) {
      stations.forEach(station => {
        const existingStation = this.stationList.find(s => s.ip === station.ip);
        
        if (!existingStation) {
          this.stationList.push(station);
        }
      });
    },
    
    // 更新站点信息
    updateStation(originalIp, updatedStation) {
      const index = this.stationList.findIndex(station => station.ip === originalIp);
      if (index !== -1) {
        // 如果IP地址发生变化，检查新IP是否已存在
        if (updatedStation.ip && updatedStation.ip !== originalIp) {
          const existingStation = this.stationList.find(s => s.ip === updatedStation.ip);
          if (existingStation) {
            throw new Error('该IP地址的站点已存在');
          }
        }
        
        this.stationList[index] = { ...this.stationList[index], ...updatedStation };
        return true;
      }
      return false;
    },
    
    // 删除站点
    removeStation(ip) {
      const index = this.stationList.findIndex(station => station.ip === ip);
      if (index !== -1) {
        this.stationList.splice(index, 1);
        return true;
      }
      return false;
    },
    
    // 清空所有站点
    clearAllStations() {
      this.stationList = [];
    },
    
    // 检查站点是否存在
    stationExists(ip) {
      return this.stationList.some(station => station.ip === ip);
    },
    
    // 检查IP是否已存在
    ipExists(ip) {
      return this.stationList.some(station => station.ip === ip);
    },
    
    // 设置当前选中的站点
    setSelectedStation(ip) {
      this.selectedStationIp = ip;
    },
    
    // 清空选中的站点
    clearSelectedStation() {
      this.selectedStationIp = '';
    },
    
    // 自动选择第一个站点
    autoSelectFirstStation() {
      if (this.stationList.length > 0 && !this.selectedStationIp) {
        this.selectedStationIp = this.stationList[0].ip;
      }
    }
  },
  persist: {
    key: 'station-store',
    storage: localStorage,
    paths: ['stationList', 'selectedStationIp'],
    serializer: {
      serialize: (state) => {
        // 序列化时排除 systemInfo
        const cleanState = {
          stationList: state.stationList.map(station => {
            const { systemInfo, ...cleanStation } = station;
            return cleanStation;
          })
        };
        return JSON.stringify(cleanState);
      },
      deserialize: (str) => {
        return JSON.parse(str);
      }
    }
  }
});
