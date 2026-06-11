<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'
import type { OperationType, OperationPriority } from '@/engine/types'

const simStore = useSimulationStore()
const configStore = useConfigStore()

/* 是否有模拟数据 */
const hasData = computed(() => simStore.farmOperations.length > 0)

/* 参数卡片数据 */
const paramCards = [
  { icon: '💧', label: '灌溉方式', value: '膜下滴灌', note: '省肥·节水·高效' },
  { icon: '🧪', label: '建议施N量', value: '150-200 kg N/ha', note: '分6-12次施用' },
  { icon: '🎬', label: '覆膜', value: '黑膜', note: '提温+控草+降湿' },
  { icon: '🌱', label: '密度', value: '4.3 株/m²', note: '行距30cm 株距12cm' },
]

/* 月份标签 */
const months = ['9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月']

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

/* 灌溉施肥方案表格数据 */
const irrigationFertilizerPlans = [
  { month: '9月', stage: '定植-缓苗', irrigation: '5-8mm', frequency: '1次/天', npk: '20-20-20', amount: '5kg×2' },
  { month: '9月', stage: '营养生长', irrigation: '5-8mm', frequency: '1次/天', npk: '20-20-20', amount: '5kg×2' },
  { month: '10月', stage: '花芽分化-开花', irrigation: '4-6mm', frequency: '1次/天', npk: '10-30-20', amount: '8kg×2' },
  { month: '11月', stage: '第一茬果', irrigation: '6-8mm', frequency: '1-2次/天', npk: '15-15-30', amount: '8kg×3' },
  { month: '12月', stage: '采收高峰', irrigation: '6-10mm', frequency: '2次/天', npk: '16-8-32+Ca', amount: '8kg×4' },
  { month: '1月', stage: '采收后期', irrigation: '6-8mm', frequency: '1-2次/天', npk: '16-8-32+B', amount: '8kg×2' },
]
</script>

<template>
  <div class="operations-page">
    <div class="page-header">
      <h2 class="page-title">🚜 农事操作</h2>
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

    <!-- 无数据提示 -->
    <div v-if="!hasData" class="timeline-section">
      <p style="text-align:center;color:var(--text-muted);padding:20px 0;">💡 尚无模拟数据，请先在基础信息页生成年度种植方案</p>
    </div>

    <template v-else>
    <!-- 时间轴 -->
    <div class="timeline-section">
      <h3 class="section-title">农事操作时间线</h3>
      <div class="ops-timeline">
        <div class="ops-timeline-bar">
          <div class="ops-segment green" style="width: 15%">整地</div>
          <div class="ops-segment light-green" style="width: 20%">营养管理</div>
          <div class="ops-segment yellow" style="width: 15%">促花</div>
          <div class="ops-segment orange" style="width: 20%">第一茬</div>
          <div class="ops-segment red" style="width: 20%">高峰</div>
          <div class="ops-segment brown" style="width: 10%">拉秧</div>
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
  max-width: 1100px;
}

.page-header {
  margin-bottom: 24px;
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
