<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  visible: boolean
  version: string
}>()

const emit = defineEmits<{
  close: []
}>()

const activeSection = ref('overview')

const sections = [
  { id: 'overview', label: '概述', icon: '📖' },
  { id: 'config', label: '基础配置', icon: '📋' },
  { id: 'phenology', label: '物候方案', icon: '🌱' },
  { id: 'pest', label: '植保IPM', icon: '🛡️' },
  { id: 'operations', label: '农事操作', icon: '🚜' },
  { id: 'yield', label: '产量预测', icon: '📊' },
]

const manualContent: Record<string, { title: string; items: string[] }> = {
  overview: {
    title: '系统概述',
    items: [
      '本系统基于DSSAT CROPGRO-Strawberry模型，提供草莓种植决策支持',
      '涵盖品种选择、物候预测、病虫害防治、农事操作和产量预估',
      '所有预测结果基于积温模型和光周期响应计算',
    ],
  },
  config: {
    title: '基础信息配置',
    items: [
      '选择品种：系统内置Florida Radiance和Florida Brilliance两个品种',
      '选择区域：不同区域对应不同的气象和土壤条件',
      '定植密度：推荐范围4.0-5.0株/m²',
      '灌溉条件：滴灌为推荐方式',
      '气象文件：支持上传DSSAT格式.WTH文件',
    ],
  },
  phenology: {
    title: '物候方案',
    items: [
      '基于积温模型预测全年物候时间轴',
      '包含营养生长期、花芽分化-开花、第一茬果、采收结束4个阶段',
      '关键节点：定植→花芽分化→始花→坐果→第一茬采收→高峰→拉秧',
    ],
  },
  pest: {
    title: '植保IPM',
    items: [
      '综合病虫害管理方案基于物候期风险预测',
      '主要风险：灰霉病、蚜虫、红蜘蛛、白粉病',
      '月度风险指数图表展示各病虫害风险变化趋势',
    ],
  },
  operations: {
    title: '农事操作',
    items: [
      '全生育期农事操作日历与执行标准',
      '包含灌溉、施肥、覆膜、密度等关键参数',
      '按阶段提供详细操作指导',
    ],
  },
  yield: {
    title: '产量预测',
    items: [
      '基于品种潜力和环境条件的产量预估',
      '预测逐日产量曲线和茬次占比',
      '包含鲜果总产、单果重、采收天数等关键指标',
    ],
  },
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="visible" class="drawer-overlay" @click.self="emit('close')">
        <div class="drawer-panel">
          <div class="drawer-header">
            <h2 style="font-size: 18px; font-weight: 600; color: var(--text-primary)">
              📖 使用手册
            </h2>
            <span class="card-badge" style="margin-left: 8px">V{{ version }}</span>
            <button class="drawer-close" @click="emit('close')">✕</button>
          </div>

          <div class="drawer-body">
            <div class="drawer-nav">
              <button
                v-for="section in sections"
                :key="section.id"
                :class="['drawer-nav-item', { active: activeSection === section.id }]"
                @click="activeSection = section.id"
              >
                <span>{{ section.icon }}</span>
                <span>{{ section.label }}</span>
              </button>
            </div>

            <div class="drawer-content">
              <h3 style="font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 16px">
                {{ manualContent[activeSection]?.title }}
              </h3>
              <ul style="list-style: none; padding: 0; margin: 0">
                <li
                  v-for="(item, idx) in manualContent[activeSection]?.items"
                  :key="idx"
                  style="padding: 10px 0; border-bottom: 1px solid var(--border-color); color: var(--text-secondary); font-size: 14px; line-height: 1.6"
                >
                  {{ item }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.drawer-panel {
  width: 520px;
  height: 100%;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
}

.drawer-header {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.drawer-close {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.drawer-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.drawer-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.drawer-nav {
  width: 180px;
  padding: 16px 12px;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.drawer-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.drawer-nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.drawer-nav-item.active {
  background: var(--highlight-bg);
  color: var(--accent-blue);
}

.drawer-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(100%);
}
</style>
