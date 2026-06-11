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
    /* V2 路由 */
    {
      path: '/v2',
      component: () => import('@/components/layout/AppLayoutV2.vue'),
      children: [
        {
          path: '',
          name: 'v2-basic',
          component: () => import('@/pages/BasicInfoPage.vue'),
          meta: { title: '基础信息' },
        },
        {
          path: 'basic',
          name: 'v2-basic-full',
          component: () => import('@/pages/BasicInfoPage.vue'),
          meta: { title: '基础信息' },
        },
        {
          path: 'phenology',
          name: 'v2-phenology',
          component: () => import('@/pages/PhenologyPage.vue'),
          meta: { title: '物候方案' },
        },
        {
          path: 'pest',
          name: 'v2-pest',
          component: () => import('@/pages/PestPage.vue'),
          meta: { title: '植保IPM' },
        },
        {
          path: 'operations',
          name: 'v2-operations',
          component: () => import('@/pages/OperationsPage.vue'),
          meta: { title: '农事操作' },
        },
        {
          path: 'yield',
          name: 'v2-yield',
          component: () => import('@/pages/YieldPage.vue'),
          meta: { title: '产量预测' },
        },
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
