<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'
import { useChart } from '@/composables/useChart'
import VChart from 'vue-echarts'

const simStore = useSimulationStore()
const configStore = useConfigStore()
const { yieldCurveOption, donutChartOption } = useChart()

/* 指标卡片数据 */
const metricCards = computed(() => [
  {
    emoji: '🏆',
    label: '鲜果总产',
    value: '32',
    unit: 't/ha',
    note: '基于品种潜力预估',
    borderColor: 'var(--accent-green)',
  },
  {
    emoji: '⚖️',
    label: '单果重',
    value: '22',
    unit: 'g',
    note: '平均鲜果重',
    borderColor: 'var(--accent-blue)',
  },
  {
    emoji: '📈',
    label: '第一茬占比',
    value: '62',
    unit: '%',
    note: '主产期产量占比',
    borderColor: 'var(--accent-orange)',
  },
  {
    emoji: '📅',
    label: '采收天数',
    value: '68',
    unit: '天',
    note: '1/2 - 3/10',
    borderColor: '#8B5CF6',
  },
])

/* 详细预测表格数据 */
const yieldDetails = [
  { period: '12月下旬', week: '第12周', yieldPerDay: 50, cumulative: 350, fruitWeight: 18, ssc: 8.5 },
  { period: '1月上旬', week: '第14周', yieldPerDay: 120, cumulative: 1200, fruitWeight: 20, ssc: 9.0 },
  { period: '1月中旬', week: '第16周', yieldPerDay: 250, cumulative: 3500, fruitWeight: 22, ssc: 9.5 },
  { period: '1月下旬', week: '第18周', yieldPerDay: 400, cumulative: 6800, fruitWeight: 23, ssc: 10.0 },
  { period: '2月上旬', week: '第20周', yieldPerDay: 580, cumulative: 11500, fruitWeight: 24, ssc: 10.2 },
  { period: '2月中旬', week: '第22周', yieldPerDay: 750, cumulative: 17500, fruitWeight: 23, ssc: 10.5 },
  { period: '2月下旬', week: '第24周', yieldPerDay: 900, cumulative: 24000, fruitWeight: 22, ssc: 10.8 },
  { period: '3月上旬', week: '第26周', yieldPerDay: 700, cumulative: 29000, fruitWeight: 21, ssc: 11.0 },
  { period: '3月中旬', week: '第28周', yieldPerDay: 450, cumulative: 32000, fruitWeight: 20, ssc: 11.2 },
]
</script>

<template>
  <div class="yield-page">
    <!-- 页面标题 -->
    <div style="margin-bottom: 24px">
      <h1 class="page-title">🏆 产量预测</h1>
      <p class="page-subtitle">预估 32 t/ha · 基于品种潜力和环境条件的产量预估</p>
    </div>

    <!-- 4个指标卡片 -->
    <div class="metric-cards-row">
      <div
        v-for="card in metricCards"
        :key="card.label"
        class="metric-card"
        :style="{ borderLeftWidth: '4px', borderLeftColor: card.borderColor }"
      >
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 10px">
          <span style="font-size: 18px">{{ card.emoji }}</span>
          <span style="font-size: 13px; color: var(--text-secondary)">{{ card.label }}</span>
        </div>
        <div style="display: flex; align-items: baseline; gap: 4px">
          <span style="font-size: 32px; font-weight: 700; color: var(--text-primary)">{{ card.value }}</span>
          <span style="font-size: 14px; color: var(--text-muted)">{{ card.unit }}</span>
        </div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 6px">{{ card.note }}</div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-row">
      <!-- 折线图 -->
      <div class="chart-card">
        <h2 class="section-title">预测逐日产量</h2>
        <VChart :option="yieldCurveOption" class="echarts-container" style="height: 320px" />
      </div>
      <!-- 环形图 -->
      <div class="chart-card">
        <h2 class="section-title">第一/二茬占比</h2>
        <VChart :option="donutChartOption" class="echarts-container" style="height: 320px" />
      </div>
    </div>

    <!-- 详细预测表格 -->
    <div class="section-block">
      <h2 class="section-title">详细预测数据</h2>
      <div style="overflow-x: auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>时段</th>
              <th>周次</th>
              <th>日均产量 (kg/ha)</th>
              <th>累计产量 (kg/ha)</th>
              <th>平均果重 (g)</th>
              <th>可溶性固形物 (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in yieldDetails" :key="row.period">
              <td>{{ row.period }}</td>
              <td>{{ row.week }}</td>
              <td>{{ row.yieldPerDay }}</td>
              <td>{{ row.cumulative.toLocaleString() }}</td>
              <td>{{ row.fruitWeight }}</td>
              <td>{{ row.ssc }}</td>
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

/* 指标卡片行 */
.metric-cards-row {
  display: flex;
  gap: 16px;
  margin-bottom: 28px;
}

.metric-card {
  flex: 1;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 20px;
  transition: all 0.2s;
}

.metric-card:hover {
  border-color: var(--border-light);
  box-shadow: var(--shadow);
}

/* 图表区域 */
.charts-row {
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

/* 区块 */
.section-block {
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 20px;
  margin-bottom: 20px;
}
</style>
