<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'

const simStore = useSimulationStore()
const configStore = useConfigStore()

/* 物候阶段数据 */
const phenologyStages = computed(() => [
  {
    emoji: '🌿',
    name: '营养生长期',
    days: 45,
    dateRange: '10/1 - 11/14',
    topColor: 'var(--accent-green)',
    gdd: '0-320 °C·d',
  },
  {
    emoji: '🌸',
    name: '花芽分化-开花',
    days: 21,
    dateRange: '11/15 - 12/5',
    topColor: '#EC4899',
    gdd: '320-540 °C·d',
  },
  {
    emoji: '🍎',
    name: '第一茬果',
    days: 28,
    dateRange: '12/6 - 1/2',
    topColor: 'var(--accent-orange)',
    gdd: '540-770 °C·d',
  },
  {
    emoji: '📦',
    name: '采收结束',
    days: 66,
    dateRange: '1/3 - 3/10',
    topColor: '#8B5CF6',
    gdd: '770-1200 °C·d',
  },
])

/* 时间轴关键节点 */
const timelineNodes = [
  { num: 1, name: '定植', date: '9/30', color: 'var(--accent-green)' },
  { num: 2, name: '花芽分化', date: '11/14', color: 'var(--accent-green)' },
  { num: 3, name: '始花', date: '11/28', color: '#EC4899' },
  { num: 4, name: '坐果', date: '12/10', color: 'var(--accent-orange)' },
  { num: 5, name: '第一茬采收', date: '1/2', color: 'var(--accent-orange)' },
  { num: 6, name: '高峰', date: '2/5', color: 'var(--accent-red)' },
  { num: 7, name: '拉秧', date: '3/10', color: '#78716c' },
]

/* 月份标签 */
const months = ['10月', '11月', '12月', '1月', '2月', '3月']

/* 各物候阶段参数表格数据 */
const phenologyParams = [
  { stage: '营养生长期', gddStart: 0, gddEnd: 320, tbase: 7, topt: 22, duration: 45, lai: '0.5-4.2' },
  { stage: '花芽分化期', gddStart: 320, gddEnd: 450, tbase: 7, topt: 20, duration: 14, lai: '4.2-4.5' },
  { stage: '开花期', gddStart: 450, gddEnd: 540, tbase: 7, topt: 22, duration: 10, lai: '4.0-4.3' },
  { stage: '结果期', gddStart: 540, gddEnd: 770, tbase: 7, topt: 24, duration: 28, lai: '3.5-4.0' },
  { stage: '采收期', gddStart: 770, gddEnd: 1200, tbase: 7, topt: 22, duration: 66, lai: '2.5-3.5' },
]

/* 定植日期显示 */
const plantingDateDisplay = computed(() => {
  return configStore.plantingDate || '9/30'
})
</script>

<template>
  <div class="phenology-page">
    <!-- 页面标题 -->
    <div style="margin-bottom: 24px">
      <h1 class="page-title">物候方案</h1>
      <p class="page-subtitle">基于积温模型 + 光周期响应预测的全年物候时间轴 · {{ plantingDateDisplay }}定植</p>
    </div>

    <!-- 4个阶段卡片 -->
    <div class="stages-row">
      <div
        v-for="stage in phenologyStages"
        :key="stage.name"
        class="stage-card"
      >
        <div class="stage-top" :style="{ backgroundColor: stage.topColor }"></div>
        <div class="stage-body">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px">
            <span>{{ stage.emoji }}</span>
            <span style="font-size: 13px; font-weight: 500; color: var(--text-primary)">{{ stage.name }}</span>
          </div>
          <div style="font-size: 28px; font-weight: 700; color: var(--text-primary)">{{ stage.days }}</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px">天</div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 8px">{{ stage.dateRange }}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px">{{ stage.gdd }}</div>
        </div>
      </div>
    </div>

    <!-- 全生育期时间轴 -->
    <div class="section-block">
      <h2 class="section-title">全生育期时间轴</h2>

      <!-- 月份标签行 -->
      <div class="month-labels">
        <div v-for="month in months" :key="month" class="month-label">{{ month }}</div>
      </div>

      <!-- 彩色进度条 -->
      <div class="timeline-bar">
        <div class="timeline-segment green" style="width: 23%">营养生长</div>
        <div class="timeline-segment yellow" style="width: 11%">花芽</div>
        <div class="timeline-segment red" style="width: 66%">采收期</div>
      </div>

      <!-- 关键节点流程 -->
      <div class="nodes-flow">
        <template v-for="(node, idx) in timelineNodes" :key="node.num">
          <div class="flow-node">
            <div class="node-circle" :style="{ backgroundColor: node.color }">{{ node.num }}</div>
            <div class="node-name">{{ node.name }}</div>
            <div class="node-date">{{ node.date }}</div>
          </div>
          <div v-if="idx < timelineNodes.length - 1" class="flow-arrow">→</div>
        </template>
      </div>
    </div>

    <!-- 各物候阶段参数表格 -->
    <div class="section-block">
      <h2 class="section-title">各物候阶段参数</h2>
      <div style="overflow-x: auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>阶段</th>
              <th>GDD起始</th>
              <th>GDD结束</th>
              <th>基温(°C)</th>
              <th>适温(°C)</th>
              <th>持续天数</th>
              <th>LAI范围</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in phenologyParams" :key="row.stage">
              <td>{{ row.stage }}</td>
              <td>{{ row.gddStart }}</td>
              <td>{{ row.gddEnd }}</td>
              <td>{{ row.tbase }}</td>
              <td>{{ row.topt }}</td>
              <td>{{ row.duration }}</td>
              <td>{{ row.lai }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 底部提示框 -->
    <div class="note-box" style="margin-top: 24px">
      ⚠️ 物候时间轴基于历史气象数据和品种参数预测，实际生长可能因年度气候差异而有所偏移。建议结合田间观测及时调整管理方案。
    </div>
  </div>
</template>

<style scoped>
.phenology-page {
  max-width: 1100px;
}

/* 阶段卡片行 */
.stages-row {
  display: flex;
  gap: 16px;
  margin-bottom: 28px;
}

.stage-card {
  flex: 1;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: all 0.2s;
}

.stage-card:hover {
  border-color: var(--border-light);
  box-shadow: var(--shadow);
}

.stage-top {
  height: 4px;
}

.stage-body {
  padding: 16px;
}

/* 区块 */
.section-block {
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 20px;
  margin-bottom: 20px;
}

/* 月份标签行 */
.month-labels {
  display: flex;
  margin-bottom: 8px;
}

.month-label {
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

/* 时间轴进度条 */
.timeline-bar {
  display: flex;
  border-radius: 6px;
  overflow: hidden;
  height: 28px;
  margin-bottom: 24px;
}

/* 关键节点流程 */
.nodes-flow {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0;
  flex-wrap: wrap;
}

.flow-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 70px;
}

.node-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: white;
  margin-bottom: 6px;
}

.node-name {
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
}

.node-date {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.flow-arrow {
  color: var(--text-muted);
  font-size: 16px;
  margin: 4px 4px 0;
  align-self: flex-start;
  line-height: 28px;
}
</style>
