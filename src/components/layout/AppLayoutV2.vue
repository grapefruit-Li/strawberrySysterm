<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

/* 导航项配置 */
const navItems = [
  { path: '/v2', label: '基础信息', icon: '📋' },
  { path: '/v2/phenology', label: '物候方案', icon: '🌱' },
  { path: '/v2/yield', label: '产量预测', icon: '📊' },
  { path: '/v2/pest', label: '植保IPM', icon: '🛡️' },
  { path: '/v2/operations', label: '农事操作', icon: '🚜' },
]

/* 判断当前路由是否激活 */
function isActive(path: string): boolean {
  return route.path === path
}

/* 返回版本选择 */
function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="v2-layout">
    <!-- 侧边栏 -->
    <aside
      class="sidebar"
      :class="{ collapsed: sidebarCollapsed }"
    >
      <!-- 头部 -->
      <div class="sidebar-header">
        <div style="font-size: 28px; margin-bottom: 8px">🍓</div>
        <transition name="fade">
          <div v-if="!sidebarCollapsed" class="sidebar-header-text">
            <div class="sidebar-title">草莓 Strawberry</div>
            <div class="sidebar-subtitle">DSSAT CROPGRO 模型</div>
            <div class="sidebar-badge">决策支持系统</div>
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
          <span class="nav-icon">{{ item.icon }}</span>
          <transition name="fade">
            <span v-if="!sidebarCollapsed">{{ item.label }}</span>
          </transition>
        </router-link>
      </nav>

      <!-- 折叠按钮 -->
      <div class="sidebar-toggle">
        <button class="toggle-btn" @click="toggleSidebar">
          {{ sidebarCollapsed ? '→' : '←' }}
        </button>
      </div>

      <!-- 底部 -->
      <div class="sidebar-footer">
        <div style="font-size: 11px; color: var(--text-muted)">v2.0 · DSSAT CROPGRO</div>
      </div>
    </aside>

    <!-- 主内容区域 -->
    <div class="main-area">
      <!-- 顶部头栏 -->
      <header class="top-bar">
        <div class="top-bar-left">
          <span style="font-size: 14px; color: var(--text-secondary)">
            {{ navItems.find(i => isActive(i.path))?.label || '草莓决策支持系统' }}
          </span>
        </div>
        <div class="top-bar-right">
          <button class="ghost-btn" @click="showManual = true">
            📖 使用手册
          </button>
          <button class="ghost-btn" @click="goBack">
            ← 返回版本选择
          </button>
        </div>
      </header>

      <!-- 路由视图 -->
      <main class="content-area">
        <router-view />
      </main>
    </div>

    <!-- 使用手册抽屉 -->
    <ManualDrawer
      :visible="showManual"
      version="v2"
      @close="showManual = false"
    />
  </div>
</template>

<style scoped>
.v2-layout {
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

.nav-icon {
  font-size: 16px;
  flex-shrink: 0;
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
  font-size: 14px;
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
