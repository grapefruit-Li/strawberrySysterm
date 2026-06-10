import { createRouter, createWebHistory } from 'vue-router'

/* 路由配置 */
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'config',
      component: () => import('@/pages/ConfigPage.vue'),
      meta: { title: '模拟配置' },
    },
    {
      path: '/simulation',
      name: 'simulation',
      component: () => import('@/pages/SimulationPage.vue'),
      meta: { title: '模拟运行' },
    },
    {
      path: '/results',
      name: 'results',
      component: () => import('@/pages/ResultsPage.vue'),
      meta: { title: '结果分析' },
    },
    {
      path: '/cultivars',
      name: 'cultivars',
      component: () => import('@/pages/CultivarsPage.vue'),
      meta: { title: '品种参数库' },
    },
    {
      path: '/data',
      name: 'data',
      component: () => import('@/pages/DataPage.vue'),
      meta: { title: '数据管理' },
    },
  ],
})

/* 路由守卫：更新页面标题 */
router.beforeEach((to) => {
  const title = (to.meta.title as string) || 'StrawSim'
  document.title = `${title} - StrawSim`
})

export default router
