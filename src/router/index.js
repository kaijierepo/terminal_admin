import { createRouter, createWebHashHistory } from 'vue-router';

import Layout from '@/layout/index.vue';

export const constantRouterMap = [
  {
    path: '/',
    name: 'Root',
    meta: {
      menuHidden: true
    },
    component: Layout,
  },
  {
    path: '/station',
    component: Layout,
    name: 'station',
    redirect: 'station/manage',
    meta: {
      title: '站点管理',
      icon: 'ant-design:table-outlined'
    },
    children: [
      {
        path: 'manage',
        component: () => import('@/views/station/manage/index.vue'),
        name: 'stationManage',
        meta: {
          title: '站点管理',
          icon: 'ant-design:table-outlined'
        }
      },
    ]
  },
  {
    path: '/param',
    component: Layout,
    name: 'param',
    redirect: 'param/project',
    meta: {
      title: '全局参数管理',
      icon: 'ant-design:table-outlined'
    },
    children: [
      {
        path: 'project',
        component: () => import('@/views/paramConf/projectConf/index.vue'),
        name: 'projectConf',
        meta: {
          title: '参数检查'
        }
      },
      {
        path: 'set',
        component: () => import('@/views/paramConf/batchSet/index.vue'),
        name: 'batchSet',
        meta: {
          title: '参数配置'
        }
      },
    ]
  }, 
  {
    path: '/electricParams',
    component: Layout,
    name: 'electricParams',
    redirect: 'electricParams/report',
    meta: {
      title: '电参数',
      icon: 'ant-design:table-outlined'
    },
    children: [
      {
        path: 'report',
        component: () => import('@/views/electricParams/report/index.vue'),
        name: 'electricParamsReport',
        meta: {
          title: '电参数报表',
          icon: 'ant-design:table-outlined'
        }
      },
    ]
  },
  
  {
    path: '/dragForce',
    component: Layout,
    name: 'dragForce',
    redirect: 'dragForce/report',
    meta: {
      title: '电参数',
      icon: 'ant-design:table-outlined'
    },
    children: [
      {
        path: 'report',
        component: () => import('@/views/dragForce/report/index.vue'),
        name: 'dragForceReport',
        meta: {
          title: '阻力报表',
          icon: 'ant-design:table-outlined'
        }
      },
    ]
  },
  
  {
    path: '/pull',
    component: Layout,
    name: 'pull',
    redirect: 'pull/audioDownload',
    meta: {
      title: '扳动',
      icon: 'ant-design:table-outlined'
    },
    children: [
      {
        path: 'audioDownload',
        component: () => import('@/views/pull/audioDownload/index.vue'),
        name: 'pullAudioDownload',
        meta: {
          title: '扳动历史音频下载',
          icon: 'ant-design:table-outlined'
        }
      },
    ]
  },
  // {
  //   path: '/example',
  //   component: Layout,
  //   name: 'example',
  //   redirect: 'example/chart',
  //   meta: {
  //     title: '组件示例',
  //     icon: 'ant-design:table-outlined'
  //   },
  //   children: [
  //     {
  //       path: 'chart',
  //       component: () => import('@/views/example/chart/index.vue'),
  //       name: 'chartExample',
  //       meta: {
  //         title: 'echarts组件'
  //       }
  //     },
  //   ]
  // },
  {
    path: '/404',
    component: () => import('@/views/error/404.vue'),
    name: 'NoFind',
    meta: {
      menuHidden: true,
      title: '404',
    }
  }
]

export const wholeMenuRouterMap = [
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRouterMap,
  scrollBehavior: () => ({ top: 0 })
})

export function setupRouter(app) {
  app.use(router)
}