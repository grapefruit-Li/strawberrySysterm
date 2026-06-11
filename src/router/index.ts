import { createRouter, createWebHashHistory } from 'vue-router'

/* 路由配置 */
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    /* 版本选择页 */
    {
      path: '/',
      name: 'version-select',
      component: () => import('@/pages/VersionSelectPage.vue'),
      meta: { title: '版本选择' },
    },
    /* V1 路由 */
    {
      path: '/v1',
      component: () => import('@/components/layout/AppLayoutV1.vue'),
      children: [
        {
          path: '',
          name: 'v1-config',
          component: () => import('@/pages/v1/ConfigPage.vue'),
          meta: { title: '配置' },
        },
        {
          path: 'simulation',
          name: 'v1-simulation',
          component: () => import('@/pages/v1/SimulationPage.vue'),
          meta: { title: '模拟' },
        },
        {
          path: 'results',
          name: 'v1-results',
          component: () => import('@/pages/v1/ResultsPage.vue'),
          meta: { title: '结果' },
        },
        {
          path: 'cultivars',
          name: 'v1-cultivars',
          component: () => import('@/pages/v1/CultivarsPage.vue'),
          meta: { title: '品种库' },
        },
        {
          path: 'data',
          name: 'v1-data',
          component: () => import('@/pages/v1/DataPage.vue'),
          meta: { title: '数据' },
        },
      ],
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
