import { createRouter, createWebHistory } from 'vue-router'

/* 路由配置 - 双版本结构 */
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'version-select',
      component: () => import('@/pages/VersionSelectPage.vue'),
    },
    {
      path: '/v1',
      name: 'v1',
      component: () => import('@/components/layout/AppLayoutV1.vue'),
      children: [
        { path: '', name: 'v1-config', component: () => import('@/pages/v1/ConfigPage.vue') },
        { path: 'simulation', name: 'v1-simulation', component: () => import('@/pages/v1/SimulationPage.vue') },
        { path: 'results', name: 'v1-results', component: () => import('@/pages/v1/ResultsPage.vue') },
        { path: 'cultivars', name: 'v1-cultivars', component: () => import('@/pages/v1/CultivarsPage.vue') },
        { path: 'data', name: 'v1-data', component: () => import('@/pages/v1/DataPage.vue') },
      ],
    },
    {
      path: '/v2',
      name: 'v2',
      component: () => import('@/components/layout/AppLayoutV2.vue'),
      children: [
        { path: '', name: 'v2-basic', component: () => import('@/pages/BasicInfoPage.vue') },
        { path: 'phenology', name: 'v2-phenology', component: () => import('@/pages/PhenologyPage.vue') },
        { path: 'pest', name: 'v2-pest', component: () => import('@/pages/PestPage.vue') },
        { path: 'operations', name: 'v2-operations', component: () => import('@/pages/OperationsPage.vue') },
        { path: 'yield', name: 'v2-yield', component: () => import('@/pages/YieldPage.vue') },
      ],
    },
  ],
})

/* 路由守卫：更新页面标题 */
router.beforeEach((to) => {
  const title = (to.meta.title as string) || 'StrawSim'
  document.title = `${title} - StrawSim`
})

export default router
