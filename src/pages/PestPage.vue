<script setup lang="ts">
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'
import { useChart } from '@/composables/useChart'
import VChart from 'vue-echarts'

const simStore = useSimulationStore()
const configStore = useConfigStore()
const { riskIndexOption } = useChart()

/* 风险卡片数据 */
const pestRisks = [
  { icon: '🦠', name: '灰霉病', dateRange: '11/2~2/22', note: '开花-采收-高湿易发', colorClass: 'purple' },
  { icon: '🐛', name: '蚜虫', dateRange: '9/30~11/2', note: '定植后立即防控', colorClass: 'orange' },
  { icon: '🕷️', name: '红蜘蛛', dateRange: '12/30~2/22', note: '气温回升-干燥高发', colorClass: 'green' },
  { icon: '🍄', name: '白粉病', dateRange: '11/2~1/19', note: '昼夜温差大', colorClass: 'pink' },
]

/* 图例数据 */
const chartLegends = [
  { color: '#6b7280', label: '灰霉病' },
  { color: '#22c55e', label: '白粉病' },
  { color: '#eab308', label: '红蜘蛛' },
  { color: '#f97316', label: '蚜虫' },
]

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
      <h2 class="page-title">植保 IPM</h2>
      <p class="page-subtitle">基于物候期的综合病虫害防治方案 · 112天风险期</p>
    </div>

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
        <VChart :option="riskIndexOption()" class="echarts-container" style="height: 300px" />
      </div>
    </div>

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
