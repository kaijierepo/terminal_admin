// 全局图标注册文件
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 导出所有图标组件
export const icons = ElementPlusIconsVue

// 注册所有图标的函数
export function registerIcons(app) {
  // 注册所有Element Plus图标
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }
}

// 导出常用的图标组件
export const {
  Plus,
  Delete,
  Edit,
  Download,
  Upload,
  Loading,
  Search,
  Refresh,
  Close,
  Check,
  Warning,
  Info,
  Success,
  Error
} = ElementPlusIconsVue
