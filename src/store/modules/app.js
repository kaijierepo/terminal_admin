import { defineStore } from "pinia";

export const useAppStore = defineStore('JHD_remote_manager', {
  state: () => {
    return {
      isCollapse: false,
      activeMenu: ''
    }
  },
  getters: {
    isMenuCollapse() {
      return this.isCollapse;
    },
    currentMenu() {
      return this.activeMenu;
    }
  },
  actions: {
    toggleMenuCollapse() {
      this.isCollapse = !this.isCollapse;
    },
    changeCurrentMenu(routes) {
      this.activeMenu = routes;
    }
  },
  persist: true
});
