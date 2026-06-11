<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'
import { useSimulation } from '@/composables/useSimulation'
import { useChart } from '@/composables/useChart'
import VChart from 'vue-echarts'

const simStore = useSimulationStore()
const configStore = useConfigStore()
const { runChainSimulation, isRunning } = useSimulation()
const { yieldCurveOption, donutChartOption } = useChart()

/* 重新计算 */
function handleRecalculate() {
  runChainSimulation()
}

/* 是否有配置但无结果 */
const hasConfigNoResult = computed(() => {
  return configStore.selectedCultivarFull && configStore.selectedRegion && !hasData.value
})

/* 是否有模拟结果 */
const hasData = computed(() => simStore.results.length > 0 && simStore.yieldResult.totalFruitWeight > 0)

/* 总产量 (t/ha) */
const totalYield = computed(() => {
  if (!hasData.value) return 0
  return (simStore.yieldResult.totalFruitWeight / 1000).toFixed(0)
})

/* 平均单果重 (g) */
const avgFruitWeight = computed(() => {
  if (!hasData.value) return 0
  return simStore.yieldResult.avgFruitWeight.toFixed(0)
})

/* 采收日期 */
const harvestDate = computed(() => {
  if (!hasData.value) return '-'
  return simStore.yieldResult.harvestDate
})

/* 采收天数 */
const harvestDays = computed(() => {
  if (!hasData.value) return 0
  const harvestResults = simStore.results.filter(r => r.fruitWeight > 0)
  return harvestResults.length
})

/* 第一茬占比 */
const firstFlushRatio = computed(() => {
  const ratio = configStore.selectedCultivarFull?.firstFlushRatio
  return ratio ? Math.round(ratio * 100) : 60
})

/* 指标卡片数据 - 从模拟结果派生 */
const statCards = computed(() => {
  if (!hasData.value) return []
  return [
    { emoji: '🍓', label: '鲜果总产', value: totalYield.value, unit: 't/ha', note: `≈ ${((simStore.yieldResult.totalFruitWeight / 1000) / (configStore.plantingDensity / 1000) * 1000).toFixed(0)} g/株`, borderClass: 'green-border' },
    { emoji: '⚖️', label: '单果重', value: avgFruitWeight.value, unit: 'g', note: `一级果 ≥${configStore.selectedCultivarFull?.keyParams.avgFruitWeight ?? 20}g`, borderClass: 'blue-border' },
    { emoji: '📊', label: '第一茬占比', value: String(firstFlushRatio.value), unit: '%', note: '品质最佳期', borderClass: 'orange-border' },
    { emoji: '📅', label: '采收天数', value: String(harvestDays.value), unit: '天', note: harvestDate.value, borderClass: 'purple-border' },
  ]
})

/* 环形图图例 */
const donutLegends = computed(() => {
  if (!hasData.value) return []
  const firstRatio = firstFlushRatio.value / 100
  const secondRatio = 1 - firstRatio
  const totalT = Number(totalYield.value)
  return [
    { colorClass: 'red', label: `第一茬 ${(totalT * firstRatio).toFixed(1)} t/ha (${firstFlushRatio.value}%)` },
    { colorClass: 'yellow', label: `第二茬 ${(totalT * secondRatio).toFixed(1)} t/ha (${Math.round(secondRatio * 100)}%)` },
  ]
})

/* 详细预测表格数据 - 从模拟结果派生 */
const yieldDetails = computed(() => {
  if (!hasData.value) return []
  const density = configStore.plantingDensity / 1000
  const totalFruitKg = simStore.yieldResult.totalFruitWeight
  const avgWeight = simStore.yieldResult.avgFruitWeight
  const fruitCount = totalFruitKg / (avgWeight / 1000)
  const perPlant = density > 0 ? totalFruitKg / density : 0
  const fruitPerM2 = density > 0 ? fruitCount / density : 0
  const fruitPerPlant = density > 0 ? fruitCount / density : 0
  const firstRatio = firstFlushRatio.value / 100

  return [
    { metric: '鲜果总产 (t/ha)', value: totalYield.value, note: '—' },
    { metric: '单株产量 (g)', value: perPlant.toFixed(0), note: `密度 ${density.toFixed(1)} 株/m²` },
    { metric: '单果重 (g)', value: avgFruitWeight.value, note: '商品果标准' },
    { metric: '果数/株', value: fruitPerPlant.toFixed(0), note: '—' },
    { metric: '果数/m²', value: fruitPerM2.toFixed(0), note: '—' },
    { metric: '第一茬果 (t/ha)', value: (Number(totalYield.value) * firstRatio).toFixed(1), note: `约${firstFlushRatio.value}%` },
    { metric: '第二茬果 (t/ha)', value: (Number(totalYield.value) * (1 - firstRatio)).toFixed(1), note: `约${Math.round((1 - firstRatio) * 100)}%` },
    { metric: '第一茬起始', value: harvestDate.value, note: '—' },
    { metric: '采收高峰', value: '—', note: '日产量最大' },
  ]
})
</script>

<template>
  <div class="yield-page">
    <div class="page-header">
      <div class="page-header-row">
        <h2 class="page-title">🏆 产量预测</h2>
        <button
          class="recalc-btn"
          :disabled="isRunning"
          @click="handleRecalculate"
        >
          <span v-if="isRunning" class="recalc-spinner"></span>
          {{ isRunning ? '计算中...' : '重新计算' }}
        </button>
      </div>
      <p class="page-subtitle" v-if="hasData">预估 {{ totalYield }} t/ha · 基于品种潜力和环境条件的产量预估</p>
      <p class="page-subtitle" v-else>基于品种潜力和环境条件的产量预估</p>
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
          <VChart :option="yieldCurveOption(simStore.results)" class="echarts-container" style="height: 300px" />
        </div>
      </div>
      <div class="chart-card">
        <h3 class="section-title">第一/二茬占比</h3>
        <div class="donut-chart-container">
          <VChart :option="donutChartOption([{ name: '第一茬', value: firstFlushRatio, color: '#4CAF50' }, { name: '第二茬', value: 100 - firstFlushRatio, color: '#2196F3' }])" class="echarts-container" style="height: 240px" />
          <div class="donut-legend">
            <div v-for="legend in donutLegends" :key="legend.label" class="donut-legend-item">
              <div class="legend-color" :class="legend.colorClass"></div>
              <span>{{ legend.label }}</span>
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
    </template>
  </div>
</template>

<style scoped>
.yield-page {
  max-width: 100%;
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
