<script setup lang="ts">
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'
import { useChart } from '@/composables/useChart'
import VChart from 'vue-echarts'

const simStore = useSimulationStore()
const configStore = useConfigStore()
const { yieldCurveOption, donutChartOption } = useChart()

/* 指标卡片数据 */
const statCards = [
  { emoji: '🍓', label: '鲜果总产', value: '32', unit: 't/ha', note: '≈ 7 g/株', borderClass: 'green-border' },
  { emoji: '⚖️', label: '单果重', value: '22', unit: 'g', note: '一级果 ≥20g', borderClass: 'blue-border' },
  { emoji: '📊', label: '第一茬占比', value: '60', unit: '%', note: '品质最佳期', borderClass: 'orange-border' },
  { emoji: '📅', label: '采收天数', value: '80', unit: '天', note: '1/3 起', borderClass: 'purple-border' },
]

/* 环形图图例 */
const donutLegends = [
  { colorClass: 'red', label: '第一茬 19.2 t/ha (60%)' },
  { colorClass: 'yellow', label: '第二茬 12.8 t/ha (40%)' },
]

/* 详细预测表格数据 */
const yieldDetails = [
  { metric: '鲜果总产 (t/ha)', value: '32', note: '—' },
  { metric: '单株产量 (g)', value: '624', note: '密度 4.3 株/m²' },
  { metric: '单果重 (g)', value: '22', note: '商品果标准' },
  { metric: '果数/株', value: '28', note: '—' },
  { metric: '果数/m²', value: '122', note: '—' },
  { metric: '第一茬果 (t/ha)', value: '19.2', note: '约60%' },
  { metric: '第二茬果 (t/ha)', value: '12.8', note: '约40%' },
  { metric: '第一茬起始', value: '1/3', note: '定植后95天' },
  { metric: '采收高峰', value: '1/18~2/22', note: '日产量最大' },
]
</script>

<template>
  <div class="yield-page">
    <div class="page-header">
      <h2 class="page-title">🏆 产量预测</h2>
      <p class="page-subtitle">预估 32 t/ha · 基于品种潜力和环境条件的产量预估</p>
    </div>

    <!-- 4个指标卡片 flex一行 -->
    <div class="yield-stats">
      <div
        v-for="card in statCards"
        :key="card.label"
        class="stat-card"
        :class="card.borderClass"
      >
        <div class="stat-label">{{ card.emoji }} {{ card.label }}</div>
        <div class="stat-value">{{ card.value }}<span class="stat-unit">{{ card.unit }}</span></div>
        <div class="stat-note">{{ card.note }}</div>
      </div>
    </div>

    <!-- 图表区域 flex两列 -->
    <div class="yield-charts">
      <div class="chart-card">
        <h3 class="section-title">预测逐日产量</h3>
        <div class="chart-container" style="height: 300px">
          <VChart :option="yieldCurveOption()" class="echarts-container" style="height: 300px" />
        </div>
      </div>
      <div class="chart-card">
        <h3 class="section-title">第一/二茬占比</h3>
        <div class="donut-chart-container">
          <VChart :option="donutChartOption()" class="echarts-container" style="height: 240px" />
          <div class="donut-legend">
            <div class="donut-legend-item">
              <div class="legend-color red"></div>
              <span>第一茬 19.2 t/ha (60%)</span>
            </div>
            <div class="donut-legend-item">
              <div class="legend-color yellow"></div>
              <span>第二茬 12.8 t/ha (40%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细预测表格 -->
    <div class="timeline-section">
      <h3 class="section-title">详细预测</h3>
      <div style="overflow-x: auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>指标</th>
              <th>预测值</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in yieldDetails" :key="row.metric">
              <td>{{ row.metric }}</td>
              <td>{{ row.value }}</td>
              <td>{{ row.note }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yield-page {
  max-width: 1100px;
}

.page-header {
  margin-bottom: 24px;
}

/* 4个指标卡片 flex一行 */
.yield-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  flex: 1;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 20px;
  border-left: 4px solid transparent;
  transition: all 0.2s;
}

.stat-card:hover {
  border-color: var(--border-light);
  box-shadow: var(--shadow);
}

.stat-card.green-border { border-left-color: var(--accent-green); }
.stat-card.blue-border { border-left-color: var(--accent-blue); }
.stat-card.orange-border { border-left-color: var(--accent-orange); }
.stat-card.purple-border { border-left-color: #8B5CF6; }

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-unit {
  font-size: 14px;
  font-weight: 400;
  color: var(--text-muted);
  margin-left: 4px;
}

.stat-note {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 8px;
}

/* 图表区域 flex两列 */
.yield-charts {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.chart-card {
  flex: 1;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 20px;
}

.chart-container {
  width: 100%;
}

/* 环形图容器 */
.donut-chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.donut-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-color.red { background-color: var(--accent-red); }
.legend-color.yellow { background-color: var(--accent-yellow); }

/* 区块 */
.timeline-section {
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 20px;
  margin-bottom: 20px;
}
</style>
