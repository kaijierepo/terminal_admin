import { createApp } from 'vue';
import App from '@/App.vue';
import { setupRouter } from './router/index.js';
import { setupStore } from './store/index.js';
import './permission.js';
import '@/styles/index.scss';
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { registerIcons } from '@/utils/iconRegister'
  
// 本地SVG图标
import "virtual:svg-icons-register";

import "uno.css";

const app = createApp(App);

// 配置错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err);
  console.error('Error Info:', info);
};

// 配置 Element Plus
app.use(ElementPlus, {
  locale: zhCn,
});

// 注册所有图标组件
registerIcons(app);

// 配置路由
setupRouter(app);

// 配置状态管理
setupStore(app);

// 挂载应用
app.mount('#app');
