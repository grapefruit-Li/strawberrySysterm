import { createRouter, createWebHistory } from 'vue-router'

/* 路由配置 - 5页结构 */
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'basic-info',
      component: () => import('@/pages/BasicInfoPage.vue'),
      meta: { title: '基础信息' },
    },
    {
      path: '/phenology',
      name: 'phenology',
      component: () => import('@/pages/PhenologyPage.vue'),
      meta: { title: '物候方案' },
    },
    {
      path: '/pest',
      name: 'pest',
      component: () => import('@/pages/PestPage.vue'),
      meta: { title: '植保IPM' },
    },
    {
      path: '/operations',
      name: 'operations',
      component: () => import('@/pages/OperationsPage.vue'),
      meta: { title: '农事操作' },
    },
    {
      path: '/yield',
      name: 'yield',
      component: () => import('@/pages/YieldPage.vue'),
      meta: { title: '产量预测' },
    },
  ],
})

/* 路由守卫：更新页面标题 */
router.beforeEach((to) => {
  const title = (to.meta.title as string) || 'StrawSim'
  document.title = `${title} - StrawSim`
})

export default router
