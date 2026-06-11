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
  <div class="v1-layout">
    <!-- 侧边栏 -->
    <aside
      class="sidebar"
      :class="{ collapsed: sidebarCollapsed }"
    >
      <!-- 品牌 Logo -->
      <div class="sidebar-header">
        <div style="font-size: 28px; margin-bottom: 8px">🍓</div>
        <transition name="fade">
          <div v-if="!sidebarCollapsed" class="sidebar-header-text">
            <div class="sidebar-title">StrawSim V1</div>
            <div class="sidebar-subtitle">DSSAT CROPGRO 模型</div>
            <div class="sidebar-badge">模拟器模式</div>
          </div>
        </transition>
      </div>

      <!-- 导航列表 -->
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="['nav-item', { active: isActive(item.path) }]"
        >
          <component :is="item.icon" :size="20" class="nav-icon-lucide" />
          <transition name="fade">
            <span v-if="!sidebarCollapsed" class="nav-label">{{ item.label }}</span>
          </transition>
        </router-link>
      </nav>

      <!-- 折叠按钮 -->
      <div class="sidebar-toggle">
        <button class="toggle-btn" @click="toggleSidebar">
          <component :is="sidebarCollapsed ? ChevronRight : ChevronLeft" :size="18" />
        </button>
      </div>

      <!-- 底部版本信息 -->
      <div class="sidebar-footer">
        <div style="font-size: 11px; color: var(--text-muted)">v1.0 · DSSAT CROPGRO</div>
      </div>
    </aside>

    <!-- 主内容区域 -->
    <div class="main-area">
      <!-- 顶部头栏 -->
      <header class="top-bar">
        <div class="top-bar-left">
          <span style="font-size: 14px; color: var(--text-secondary)">
            {{ currentPageTitle }}
          </span>
        </div>
        <div class="top-bar-right">
          <button class="ghost-btn" @click="showManual = true">
            <BookOpen :size="14" />
            <span>使用手册</span>
          </button>
          <button class="ghost-btn" @click="router.push('/')">
            <ArrowLeft :size="14" />
            <span>返回版本选择</span>
          </button>
        </div>
      </header>

      <!-- 路由视图 -->
      <main class="content-area">
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
.v1-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-primary);
}

/* 侧边栏 */
.sidebar {
  width: 240px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.3s ease-in-out;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  padding: 24px 20px 20px;
  border-bottom: 1px solid var(--border-color);
  text-align: center;
  flex-shrink: 0;
}

.sidebar.collapsed .sidebar-header {
  padding: 16px 8px;
}

.sidebar-header-text {
  text-align: center;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.sidebar-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.sidebar-badge {
  display: inline-block;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 10px;
  background: var(--highlight-bg);
  color: var(--accent-blue);
  font-weight: 500;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
}

.nav-icon-lucide {
  flex-shrink: 0;
  color: var(--text-secondary);
}

.nav-label {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-toggle {
  padding: 8px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

.toggle-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  color: var(--text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  text-align: center;
  flex-shrink: 0;
}

.sidebar.collapsed .sidebar-footer {
  display: none;
}

/* 主内容区域 */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.top-bar {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  background: var(--bg-primary);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
