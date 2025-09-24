import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { router } from './router';

// 配置 NProgress
NProgress.configure({ 
  showSpinner: false, // 是否显示加载微调器
  minimum: 0.2, // 最小百分比
  easing: 'ease',
  speed: 500
})

router.beforeEach((to, from, next) => {
  // 开始加载进度条
  NProgress.start()
  next()
  NProgress.done()
});

// 路由后置守卫
router.afterEach(() => {
  // 完成进度条
  NProgress.done()
})