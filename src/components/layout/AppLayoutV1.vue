<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Settings,
  Play,
  BarChart3,
  Leaf,
  Database,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  BookOpen,
} from 'lucide-vue-next'
import ManualDrawer from '@/components/ManualDrawer.vue'

const route = useRoute()
const router = useRouter()
const showManual = ref(false)

/* 侧边栏折叠状态 */
const sidebarCollapsed = ref(false)

/* 响应式：小屏幕自动折叠 */
function handleResize() {
  if (window.innerWidth < 768) {
    sidebarCollapsed.value = true
  }
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

/* 切换侧边栏 */
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

/* V1 导航项配置 */
const navItems = [
  { path: '/v1', label: '配置', icon: Settings },
  { path: '/v1/simulation', label: '模拟', icon: Play },
  { path: '/v1/results', label: '结果', icon: BarChart3 },
  { path: '/v1/cultivars', label: '品种库', icon: Leaf },
  { path: '/v1/data', label: '数据', icon: Database },
]

/* 判断当前路由是否激活 */
function isActive(path: string): boolean {
  if (path === '/v1') return route.path === '/v1'
  return route.path.startsWith(path)
}

/* 当前页面标题 */
const currentPageTitle = computed(() => {
  const item = navItems.find(item => isActive(item.path))
  return item?.label || '模拟器模式'
})
</script>

<template>
  <div class="h-screen flex bg-midnight-900 overflow-hidden">
    <!-- 侧边栏 -->
    <aside
      class="h-full flex flex-col bg-midnight-800/80 backdrop-blur-md border-r border-midnight-600/30 transition-all duration-300 ease-in-out relative"
      :class="sidebarCollapsed ? 'w-16' : 'w-60'"
    >
      <!-- 品牌 Logo -->
      <div class="flex items-center gap-3 px-4 h-16 border-b border-midnight-600/30 shrink-0">
        <span class="text-2xl shrink-0">🍓</span>
        <transition name="fade">
          <span
            v-if="!sidebarCollapsed"
            class="font-heading text-lg text-forest-400 whitespace-nowrap overflow-hidden"
          >
            StrawSim V1
          </span>
        </transition>
      </div>

      <!-- 导航列表 -->
      <nav class="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="isActive(item.path) ? 'nav-item-active-v1' : 'nav-item'"
        >
          <component :is="item.icon" :size="20" class="shrink-0" />
          <transition name="fade">
            <span v-if="!sidebarCollapsed" class="text-sm whitespace-nowrap overflow-hidden">
              {{ item.label }}
            </span>
          </transition>
        </router-link>
      </nav>

      <!-- 折叠按钮 -->
      <div class="p-2 border-t border-midnight-600/30 shrink-0">
        <button
          class="w-full flex items-center justify-center p-2 rounded-lg text-midnight-400 hover:text-midnight-200 hover:bg-midnight-700/40 transition-all duration-200"
          @click="toggleSidebar"
        >
          <component :is="sidebarCollapsed ? ChevronRight : ChevronLeft" :size="18" />
        </button>
      </div>
    </aside>

    <!-- 主内容区域 -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- 顶部头栏 -->
      <header class="h-16 flex items-center justify-between px-6 border-b border-midnight-600/30 bg-midnight-800/60 backdrop-blur-md shrink-0">
        <!-- 左侧标题 -->
        <div class="flex items-center gap-4">
          <h1 class="font-heading text-xl text-midnight-50">{{ currentPageTitle }}</h1>
        </div>

        <!-- 右侧操作 -->
        <div class="flex items-center gap-3">
          <!-- 查看手册 -->
          <button
            class="ghost-btn flex items-center gap-1.5 text-sm"
            @click="showManual = true"
          >
            <BookOpen :size="14" />
            <span>使用手册</span>
          </button>
          <!-- 返回版本选择 -->
          <button
            class="ghost-btn flex items-center gap-1.5 text-sm"
            @click="router.push('/')"
          >
            <ArrowLeft :size="14" />
            <span>返回版本选择</span>
          </button>
        </div>
      </header>

      <!-- 路由视图 -->
      <main class="flex-1 overflow-y-auto p-6">
        <router-view />
      </main>
    </div>

    <!-- 手册抽屉 -->
    <ManualDrawer
      v-if="showManual"
      :visible="showManual"
      version="v1"
      @close="showManual = false"
    />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* V1 激活导航项 - 使用 forest 绿色 */
.nav-item-active-v1 {
  @apply flex items-center gap-3 px-4 py-3 rounded-lg
         text-forest-400 bg-forest-500/10
         border-l-2 border-forest-500 cursor-pointer;
}
</style>
