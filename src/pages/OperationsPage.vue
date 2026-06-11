<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'
import { useSimulation } from '@/composables/useSimulation'
import type { OperationType, OperationPriority } from '@/engine/types'

const simStore = useSimulationStore()
const configStore = useConfigStore()
const { runChainSimulation, isRunning } = useSimulation()

/* 重新计算 */
function handleRecalculate() {
  runChainSimulation()
}

/* 是否有配置但无结果 */
const hasConfigNoResult = computed(() => {
  return configStore.selectedCultivarFull && configStore.selectedRegion && !hasData.value
})

/* 是否有模拟数据 */
const hasData = computed(() => simStore.farmOperations.length > 0)

/* 参数卡片数据 - 从配置动态生成 */
const paramCards = computed(() => {
  const irrigationLabels: Record<string, string> = {
    'drip-mulch': '膜下滴灌', 'sprinkler': '喷灌', 'flood': '漫灌', 'rainfed': '雨养',
  }
  const fertilityLabels: Record<string, string> = {
    'low': '低肥力·有机质<1%', 'medium': '中肥力·有机质1-2%', 'high': '高肥力·有机质>2%',
  }
  return [
    { icon: '💧', label: '灌溉方式', value: irrigationLabels[configStore.irrigationMode] || '膜下滴灌', note: '省肥·节水·高效' },
    { icon: '🧪', label: '建议施N量', value: configStore.soilFertility === 'high' ? '120-150' : configStore.soilFertility === 'low' ? '180-220' : '150-200', note: 'kg N/ha·分次施用' },
    { icon: '🎬', label: '覆膜', value: configStore.cultivationMode === 'open-field' ? '黑膜' : configStore.cultivationMode === 'greenhouse' ? '银黑双面膜' : '黑膜', note: '提温+控草+降湿' },
    { icon: '🌱', label: '密度', value: `${(configStore.plantingDensity / 1000).toFixed(1)} 株/m²`, note: '行距30cm 株距12cm' },
  ]
})

/* 月份标签 - 从模拟数据动态生成 */
const months = computed(() => {
  if (!hasData.value) return ['9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月']
  const ops = simStore.farmOperations
  if (ops.length === 0) return ['9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月']
  // Get date range from operations
  const dates = ops.map(op => {
    const d = op.plannedDate
    if (typeof d === 'string') return parseInt(d.replace(/-/g, ''))
    return d
  }).filter(d => d > 0)
  if (dates.length === 0) return ['9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月']
  const minDate = Math.min(...dates)
  const maxDate = Math.max(...dates)
  const startMonth = Math.floor((minDate % 10000) / 100)
  const startYear = Math.floor(minDate / 10000)
  const endMonth = Math.floor((maxDate % 10000) / 100)
  const endYear = Math.floor(maxDate / 10000)
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const result: string[] = []
  let y = startYear, m = startMonth
  while (y < endYear || (y === endYear && m <= endMonth)) {
    result.push(monthNames[m - 1])
    m++
    if (m > 12) { m = 1; y++ }
  }
  return result.length > 0 ? result : ['9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月']
})

/* 操作类型对应的颜色类 */
function stageClassFromType(type: OperationType): string {
  const map: Record<OperationType, string> = {
    irrigation: 'light-green',
    fertilizer: 'yellow',
    pruning: 'green',
    pest_control: 'red',
    harvest: 'orange',
    planting: 'green',
    monitoring: 'light-green',
  }
  return map[type] ?? 'green'
}

/* 优先级对应的标签 */
function priorityLabel(priority: OperationPriority): string {
  const map: Record<OperationPriority, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  }
  return map[priority] ?? '中'
}

/* 操作卡片数据 - 从store获取 */
const operationCards = computed(() => {
  if (!hasData.value) return []
  return simStore.farmOperations.map(op => ({
    period: op.plannedDate,
    stage: op.relatedStage,
    stageClass: stageClassFromType(op.type),
    content: `${priorityLabel(op.priority)} | ${op.description}`,
  }))
})

/* 按生长阶段分组的操作 */
const operationsByStage = computed(() => {
  if (!hasData.value) return []
  const groups: Record<string, typeof simStore.farmOperations> = {}
  for (const op of simStore.farmOperations) {
    if (!groups[op.relatedStage]) groups[op.relatedStage] = []
    groups[op.relatedStage].push(op)
  }
  return Object.entries(groups).map(([stage, ops]) => ({ stage, ops }))
})

/* 灌溉施肥方案表格数据 - 从模拟数据动态生成 */
const irrigationFertilizerPlans = computed(() => {
  if (!hasData.value) return []
  // Generate from farm operations grouped by month
  const monthStageMap: Record<string, string> = {}
  const monthIrrigation: Record<string, string[]> = {}
  const monthFertilizer: Record<string, string[]> = {}
  for (const op of simStore.farmOperations) {
    const d = typeof op.plannedDate === 'string' ? parseInt(op.plannedDate.replace(/-/g, '')) : op.plannedDate
    const month = Math.floor((d % 10000) / 100)
    const monthKey = `${month}月`
    if (!monthStageMap[monthKey]) monthStageMap[monthKey] = op.relatedStage
    if (op.type === 'irrigation') {
      if (!monthIrrigation[monthKey]) monthIrrigation[monthKey] = []
      monthIrrigation[monthKey].push(op.description)
    }
    if (op.type === 'fertilizer') {
      if (!monthFertilizer[monthKey]) monthFertilizer[monthKey] = []
      monthFertilizer[monthKey].push(op.description)
    }
  }
  const npkMap: Record<string, string> = {
    '萌芽期': '20-20-20', '营养生长期': '20-20-20', '花芽分化期': '10-30-20',
    '开花期': '10-30-20', '结果期': '15-15-30', '果实膨大期': '15-15-30',
    '采收期': '16-8-32+Ca', '成熟期': '16-8-32+B',
  }
  return Object.entries(monthStageMap).map(([month, stage]) => ({
    month,
    stage,
    irrigation: monthIrrigation[month]?.[0] || '5-8mm',
    frequency: '1-2次/天',
    npk: npkMap[stage] || '15-15-30',
    amount: monthFertilizer[month]?.[0] || '8kg×2',
  }))
})

/* 农事操作时间线段 - 从模拟数据动态生成 */
const opsTimelineSegments = computed(() => {
  if (!hasData.value) return [
    { name: '整地', width: 15, colorClass: 'green' },
    { name: '营养管理', width: 20, colorClass: 'light-green' },
    { name: '促花', width: 15, colorClass: 'yellow' },
    { name: '第一茬', width: 20, colorClass: 'orange' },
    { name: '高峰', width: 20, colorClass: 'red' },
    { name: '拉秧', width: 10, colorClass: 'brown' },
  ]
  // Group operations by stage and calculate widths
  const stageGroups: Record<string, number> = {}
  for (const op of simStore.farmOperations) {
    if (!stageGroups[op.relatedStage]) stageGroups[op.relatedStage] = 0
    stageGroups[op.relatedStage]++
  }
  const total = Object.values(stageGroups).reduce((s, c) => s + c, 0) || 1
  const stageColorMap: Record<string, string> = {
    '萌芽期': 'green', '营养生长期': 'light-green', '花芽分化期': 'yellow',
    '开花期': 'yellow', '结果期': 'orange', '果实膨大期': 'orange',
    '采收期': 'red', '成熟期': 'red',
  }
  return Object.entries(stageGroups).map(([stage, count]) => ({
    name: stage,
    width: Math.max(8, Math.round((count / total) * 100)),
    colorClass: stageColorMap[stage] || 'green',
  }))
})
</script>

<template>
  <div class="operations-page">
    <div class="page-header">
      <div class="page-header-row">
        <h2 class="page-title">🚜 农事操作</h2>
        <button
          class="recalc-btn"
          :disabled="isRunning"
          @click="handleRecalculate"
        >
          <span v-if="isRunning" class="recalc-spinner"></span>
          {{ isRunning ? '计算中...' : '重新计算' }}
        </button>
      </div>
      <p class="page-subtitle">全生育期农事操作日历与执行标准</p>
    </div>

    <!-- 4个参数卡片 flex一行 -->
    <div class="operations-params">
      <div
        v-for="card in paramCards"
        :key="card.label"
        class="param-card"
      >
        <div class="param-icon">{{ card.icon }}</div>
        <div class="param-content">
          <div class="param-label">{{ card.label }}</div>
          <div class="param-value">{{ card.value }}</div>
          <div class="param-note">{{ card.note }}</div>
        </div>
      </div>
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
    <!-- 时间轴 -->
    <div class="timeline-section">
      <h3 class="section-title">农事操作时间线</h3>
      <div class="ops-timeline">
        <div class="ops-timeline-bar">
          <div
            v-for="(seg, idx) in opsTimelineSegments"
            :key="idx"
            class="ops-segment"
            :class="seg.colorClass"
            :style="{ width: seg.width + '%' }"
          >{{ seg.name }}</div>
        </div>
        <div class="ops-timeline-months">
          <span v-for="month in months" :key="month">{{ month }}</span>
        </div>
      </div>
    </div>

    <!-- 操作卡片 5列grid -->
    <div class="operations-cards">
      <div
        v-for="card in operationCards"
        :key="card.period + card.stage"
        class="ops-card"
      >
        <div class="ops-card-header">
          <span class="ops-period">{{ card.period }}</span>
          <span class="ops-stage" :class="card.stageClass">{{ card.stage }}</span>
        </div>
        <div class="ops-card-content">{{ card.content }}</div>
      </div>
    </div>
    </template>

    <!-- 灌溉施肥表格 -->
    <div class="timeline-section">
      <h3 class="section-title">灌溉施肥方案</h3>
      <div style="overflow-x: auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>月份</th>
              <th>阶段</th>
              <th>灌溉/天</th>
              <th>频率</th>
              <th>N-P₂O₅-K₂O</th>
              <th>用量/亩</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in irrigationFertilizerPlans" :key="row.month + row.stage">
              <td>{{ row.month }}</td>
              <td>{{ row.stage }}</td>
              <td>{{ row.irrigation }}</td>
              <td>{{ row.frequency }}</td>
              <td>{{ row.npk }}</td>
              <td>{{ row.amount }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.operations-page {
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

/* 4个参数卡片 flex一行 */
.operations-params {
  display: flex;
  gap: 16px;
  margin-bottom: 28px;
}

.param-card {
  flex: 1;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 20px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  transition: all 0.2s;
}

.param-card:hover {
  border-color: var(--border-light);
  box-shadow: var(--shadow);
}

.param-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.param-content {
  flex: 1;
}

.param-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.param-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.param-note {
  font-size: 11px;
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

/* 时间轴 */
.ops-timeline {
  margin-bottom: 0;
}

.ops-timeline-bar {
  display: flex;
  border-radius: 6px;
  overflow: hidden;
  height: 28px;
  margin-bottom: 8px;
}

.ops-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
  font-weight: 500;
}

.ops-segment.green { background-color: var(--accent-green); }
.ops-segment.light-green { background-color: #4ade80; }
.ops-segment.yellow { background-color: var(--accent-yellow); color: #333; }
.ops-segment.orange { background-color: var(--accent-orange); }
.ops-segment.red { background-color: var(--accent-red); }
.ops-segment.brown { background-color: #78716c; }

.ops-timeline-months {
  display: flex;
}

.ops-timeline-months span {
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

/* 操作卡片 5列grid */
.operations-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.ops-card {
  background: var(--bg-card);
  border-radius: 10px;
  border: 1px solid var(--border-color);
  padding: 16px;
  transition: all 0.2s;
}

.ops-card:hover {
  border-color: var(--border-light);
  box-shadow: var(--shadow);
}

.ops-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.ops-period {
  font-size: 12px;
  color: var(--text-muted);
}

.ops-stage {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  color: white;
  white-space: nowrap;
}

.ops-stage.green { background-color: #22c55e; }
.ops-stage.light-green { background-color: #4ade80; }
.ops-stage.yellow { background-color: #eab308; color: #333; }
.ops-stage.orange { background-color: #f97316; }
.ops-stage.red { background-color: #ef4444; }
.ops-stage.brown { background-color: #78716c; }

.ops-card-content {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}
</style>
