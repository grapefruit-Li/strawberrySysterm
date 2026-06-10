<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Settings,
  Play,
  BarChart3,
  Leaf,
  Database,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next'

/* Props */
defineProps<{
  collapsed: boolean
}>()

/* Emits */
defineEmits<{
  toggle: []
}>()

const route = useRoute()

/* 导航项配置 */
const navItems = [
  { path: '/', label: '配置', icon: Settings },
  { path: '/simulation', label: '模拟', icon: Play },
  { path: '/results', label: '结果', icon: BarChart3 },
  { path: '/cultivars', label: '品种库', icon: Leaf },
  { path: '/data', label: '数据', icon: Database },
]

/* 判断当前路由是否激活 */
function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <aside
    class="h-full flex flex-col bg-midnight-800/80 backdrop-blur-md border-r border-midnight-600/30 transition-all duration-300 ease-in-out relative"
    :class="collapsed ? 'w-16' : 'w-60'"
  >
    <!-- 品牌 Logo -->
    <div class="flex items-center gap-3 px-4 h-16 border-b border-midnight-600/30 shrink-0">
      <span class="text-2xl shrink-0">🍓</span>
      <transition name="fade">
        <span
          v-if="!collapsed"
          class="font-heading text-lg text-strawberry-500 whitespace-nowrap overflow-hidden"
        >
          StrawSim
        </span>
      </transition>
    </div>

    <!-- 导航列表 -->
    <nav class="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="isActive(item.path) ? 'nav-item-active' : 'nav-item'"
      >
        <component :is="item.icon" :size="20" class="shrink-0" />
        <transition name="fade">
          <span v-if="!collapsed" class="text-sm whitespace-nowrap overflow-hidden">
            {{ item.label }}
          </span>
        </transition>
      </router-link>
    </nav>

    <!-- 折叠按钮 -->
    <div class="p-2 border-t border-midnight-600/30 shrink-0">
      <button
        class="w-full flex items-center justify-center p-2 rounded-lg text-midnight-400 hover:text-midnight-200 hover:bg-midnight-700/40 transition-all duration-200"
        @click="$emit('toggle')"
      >
        <component :is="collapsed ? ChevronRight : ChevronLeft" :size="18" />
      </button>
    </div>
  </aside>
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
