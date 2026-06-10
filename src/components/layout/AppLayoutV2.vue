<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Settings,
  CalendarDays,
  Shield,
  Sprout,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

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

/* V2 导航项配置 */
const navItems = [
  { path: '/v2', label: '基础信息', icon: Settings },
  { path: '/v2/phenology', label: '物候方案', icon: CalendarDays },
  { path: '/v2/pest', label: '植保IPM', icon: Shield },
  { path: '/v2/operations', label: '农事操作', icon: Sprout },
  { path: '/v2/yield', label: '产量预测', icon: TrendingUp },
]

/* 判断当前路由是否激活 */
function isActive(path: string): boolean {
  if (path === '/v2') return route.path === '/v2'
  return route.path.startsWith(path)
}

/* 当前页面标题 */
const currentPageTitle = computed(() => {
  const item = navItems.find(item => isActive(item.path))
  return item?.label || '决策引擎模式'
})
</script>

<template>
  <div class="h-screen flex bg-gray-50 overflow-hidden">
    <!-- 侧边栏 -->
    <aside
      class="h-full flex flex-col bg-gradient-to-b from-violet-950 via-purple-900 to-indigo-950 border-r border-purple-800/30 transition-all duration-300 ease-in-out relative"
      :class="sidebarCollapsed ? 'w-16' : 'w-60'"
    >
      <!-- 品牌 Logo -->
      <div class="flex items-center gap-3 px-4 h-16 border-b border-purple-700/30 shrink-0">
        <span class="text-2xl shrink-0">🍓</span>
        <transition name="fade">
          <span
            v-if="!sidebarCollapsed"
            class="font-heading text-lg text-red-400 whitespace-nowrap overflow-hidden"
          >
            StrawSim V2
          </span>
        </transition>
      </div>

      <!-- 导航列表 -->
      <nav class="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
          :class="isActive(item.path)
            ? 'text-white bg-white/15 border-l-2 border-red-400'
            : 'text-purple-300 hover:text-white hover:bg-white/10'"
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
      <div class="p-2 border-t border-purple-700/30 shrink-0">
        <button
          class="w-full flex items-center justify-center p-2 rounded-lg text-purple-300 hover:text-white hover:bg-white/10 transition-all duration-200"
          @click="toggleSidebar"
        >
          <component :is="sidebarCollapsed ? ChevronRight : ChevronLeft" :size="18" />
        </button>
      </div>
    </aside>

    <!-- 主内容区域 -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- 顶部头栏 -->
      <header class="h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-white shrink-0">
        <!-- 左侧标题 -->
        <div class="flex items-center gap-4">
          <h1 class="font-heading text-xl text-gray-800">{{ currentPageTitle }}</h1>
        </div>

        <!-- 右侧操作 -->
        <div class="flex items-center gap-3">
          <!-- 返回版本选择 -->
          <button
            class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-all duration-200"
            @click="router.push('/')"
          >
            <ArrowLeft :size="14" />
            <span>返回版本选择</span>
          </button>
        </div>
      </header>

      <!-- 路由视图 -->
      <main class="flex-1 overflow-y-auto p-6 bg-gray-50">
        <router-view />
      </main>
    </div>
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
</style>
