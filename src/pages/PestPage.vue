<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'
import { useSimulation } from '@/composables/useSimulation'
import { useChart } from '@/composables/useChart'
import VChart from 'vue-echarts'
import type { RiskLevel } from '@/engine/types'

const simStore = useSimulationStore()
const configStore = useConfigStore()
const { runChainSimulation, isRunning } = useSimulation()
const { riskIndexOption } = useChart()

/* 重新计算 */
function handleRecalculate() {
  runChainSimulation()
}

/* 是否有配置但无结果 */
const hasConfigNoResult = computed(() => {
  return configStore.selectedCultivarFull && configStore.selectedRegion && !hasData.value
})

/* 是否有模拟数据 */
const hasData = computed(() => simStore.pestRisks.length > 0)

/* 风险等级对应的颜色类 */
function riskColorClass(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    low: 'green',
    medium: 'orange',
    high: 'pink',
    critical: 'purple',
  }
  return map[level] ?? 'green'
}

/* 风险等级对应的图标 */
function riskIcon(name: string): string {
  const iconMap: Record<string, string> = {
    '灰霉病': '🦠',
    '白粉病': '🍄',
    '红蜘蛛': '🕷️',
    '蚜虫': '🐛',
    '炭疽病': '⚫',
  }
  return iconMap[name] ?? '🔬'
}

/* 风险卡片数据 - 从store获取 */
const pestRisks = computed(() => {
  if (!hasData.value) return []
  return simStore.pestRisks.map(r => ({
    icon: riskIcon(r.name),
    name: r.name,
    dateRange: r.relatedStage,
    note: r.description,
    colorClass: riskColorClass(r.riskLevel),
  }))
})

/* 图例数据 - 从pest risk数据派生 */
const chartLegends = computed(() => {
  if (!hasData.value) return []
  const colorMap: Record<string, string> = {
    '灰霉病': '#6b7280',
    '白粉病': '#22c55e',
    '红蜘蛛': '#eab308',
    '蚜虫': '#f97316',
    '炭疽病': '#ef4444',
  }
  return simStore.pestRisks.map(r => ({
    color: colorMap[r.name] ?? '#6b7280',
    label: r.name,
  }))
})

/* 防治方案表格数据 */
const controlPlans = [
  { pest: '🐛 蚜虫', period: '9/30~11/2', threshold: '>5头/叶', drug: '吡虫啉·螺虫乙酯' },
  { pest: '🕷️ 二斑叶螨', period: '12/30~2/22', threshold: '>3头/叶', drug: '丁醚脲·联苯肼酯' },
  { pest: '🪲 西花蓟马', period: '9/30~11/20', threshold: '>8头/花', drug: '乙基多杀菌素' },
  { pest: '🦠 灰霉病', period: '11/2~2/22', threshold: '开花期预防', drug: '嘧霉胺·异菌脲' },
  { pest: '🍄 白粉病', period: '11/2~1/19', threshold: '烧叶预防', drug: '醚菌酯·硫磺' },
  { pest: '⚫ 炭疽病', period: '9/30~11/2', threshold: '苗期预防', drug: '咪鲜胺·代森锰锌' },
]

/* IPM核心原则 */
const ipmPrinciples = [
  { num: '①', title: '监测', desc: '黄板20+蓝板10块/亩 每周调查' },
  { num: '②', title: '生防', desc: '智利小植绥螨防红蜘蛛' },
  { num: '③', title: '化防', desc: '花期避用高毒药' },
  { num: '④', title: '栽培', desc: '棚下滴灌降温' },
]
</script>

<template>
  <div class="pest-page">
    <div class="page-header">
      <div class="page-header-row">
        <h2 class="page-title">植保 IPM</h2>
        <button
          class="recalc-btn"
          :disabled="isRunning"
          @click="handleRecalculate"
        >
          <span v-if="isRunning" class="recalc-spinner"></span>
          {{ isRunning ? '计算中...' : '重新计算' }}
        </button>
      </div>
      <p class="page-subtitle">基于物候期的综合病虫害防治方案</p>
    </div>

    <!-- 有配置但无结果提示 -->
    <div v-if="hasConfigNoResult" class="timeline-section">
      <p style="text-align:center;color:var(--text-muted);padding:20px 0;">💡 已选择品种和地区，点击「重新计算」生成年度种植方案</p>
    </div>

    <!-- 无数据提示 -->
    <div v-else-if="!hasData" class="timeline-section">
      <p style="text-align:center;color:var(--text-muted);padding:20px 0;">💡 尚无模拟数据，请先在基础信息页生成年度种植方案</p>
    </div>

    <template v-else>
    <!-- 4个风险卡片 flex一行 -->
    <div class="ipm-risk-cards">
      <div
        v-for="risk in pestRisks"
        :key="risk.name"
        class="ipm-risk-card"
        :class="risk.colorClass"
      >
        <div class="risk-card-header">
          <span class="risk-icon">{{ risk.icon }}</span>
          <span class="risk-name">{{ risk.name }}</span>
        </div>
        <div class="risk-card-date">{{ risk.dateRange }}</div>
        <div class="risk-card-note">{{ risk.note }}</div>
      </div>
    </div>

    <!-- 月度风险指数图表 -->
    <div class="timeline-section">
      <h3 class="section-title">月度病虫害风险指数</h3>
      <div class="chart-legend">
        <div v-for="legend in chartLegends" :key="legend.label" class="legend-item">
          <div class="legend-color" :style="{ backgroundColor: legend.color }"></div>
          <span>{{ legend.label }}</span>
        </div>
      </div>
      <div class="chart-container" style="height: 300px">
        <VChart :option="riskIndexOption(simStore.pestRisks)" class="echarts-container" style="height: 300px" />
      </div>
    </div>
    </template>

    <!-- 防治方案表格 -->
    <div class="timeline-section">
      <h3 class="section-title">防治方案</h3>
      <div style="overflow-x: auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>病虫害</th>
              <th>高发期</th>
              <th>阈值</th>
              <th>推荐药剂</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="plan in controlPlans" :key="plan.pest">
              <td>{{ plan.pest }}</td>
              <td>{{ plan.period }}</td>
              <td>{{ plan.threshold }}</td>
              <td>{{ plan.drug }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- IPM核心原则 -->
    <div class="ipm-principles">
      <h3 class="section-title">IPM 核心</h3>
      <div class="principles-list">
        <div
          v-for="principle in ipmPrinciples"
          :key="principle.num"
          class="principle-item"
        >
          <span class="principle-number">{{ principle.num }}</span>
          <div class="principle-content">
            <span class="principle-title">{{ principle.title }}</span>
            <span class="principle-desc">{{ principle.desc }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pest-page {
  max-width: 1100px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.recalc-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.recalc-btn:hover:not(:disabled) {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.recalc-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.recalc-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid var(--text-muted);
  border-top-color: var(--accent-blue);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 4个风险卡片 flex一行 */
.ipm-risk-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 28px;
}

.ipm-risk-card {
  flex: 1;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 20px;
  transition: all 0.2s;
  border-top: 4px solid transparent;
}

.ipm-risk-card:hover {
  border-color: var(--border-light);
  box-shadow: var(--shadow);
}

.ipm-risk-card.purple { border-top-color: #8B5CF6; }
.ipm-risk-card.orange { border-top-color: var(--accent-orange); }
.ipm-risk-card.green { border-top-color: var(--accent-green); }
.ipm-risk-card.pink { border-top-color: #EC4899; }

.risk-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.risk-icon {
  font-size: 20px;
}

.risk-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.risk-card-date {
  font-size: 13px;
  color: var(--accent-orange);
  font-weight: 500;
  margin-bottom: 6px;
}

.risk-card-note {
  font-size: 12px;
  color: var(--text-muted);
}

/* 区块 */
.timeline-section {
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 20px;
  margin-bottom: 20px;
}

/* 图例 */
.chart-legend {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.chart-container {
  width: 100%;
}

/* IPM核心原则 */
.ipm-principles {
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 20px;
  margin-bottom: 20px;
}

.principles-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.principle-item {
  display: flex;
  gap: 14px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 10px;
  border: 1px solid var(--border-color);
  align-items: flex-start;
}

.principle-number {
  font-size: 16px;
  font-weight: 700;
  color: var(--accent-blue);
  flex-shrink: 0;
}

.principle-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.principle-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.principle-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}
</style>
