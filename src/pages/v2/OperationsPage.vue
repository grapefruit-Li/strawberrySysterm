<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'
import { Sprout, Droplets } from 'lucide-vue-next'
import type { FarmOperation, OperationType, OperationPriority } from '@/engine/types'

const simulation = useSimulationStore()
const config = useConfigStore()

const operations = computed<FarmOperation[]>(() => simulation.farmOperations)

/* 方案天数 */
const planDays = computed(() => config.simulationDays || 180)

/* 顶部关键指标卡片 */
const summaryCards = computed(() => {
  const fertOps = operations.value.filter(o => o.type === 'fertilizer')
  const totalN = fertOps.reduce((sum, o) => sum + (Number(o.params.n) || 0), 0)
  const nLow = Math.round(totalN / 10) * 10 || 150
  const nHigh = nLow + 50
  return [
    {
      label: '灌溉方式',
      value: '膜下滴灌',
      sub: '推荐节水高效',
      borderClass: 'border-l-blue-400',
    },
    {
      label: '建议施N量',
      value: `${nLow}-${nHigh} kg N/ha`,
      sub: '分8-12次',
      borderClass: 'border-l-forest-400',
    },
    {
      label: '覆膜',
      value: '黑膜',
      sub: '提温+控草+降湿',
      borderClass: 'border-l-midnight-300',
    },
    {
      label: '密度',
      value: `${(config.plantingDensity / 10000).toFixed(1)} 株/m²`,
      sub: '行距30cm 株距12cm',
      borderClass: 'border-l-purple-400',
    },
  ]
})

/* 时间线阶段配置 */
const timelineStages = [
  { name: '整地', months: '8-9月', bg: 'bg-green-500/30', text: 'text-green-300' },
  { name: '营养管理', months: '9-10月', bg: 'bg-green-600/30', text: 'text-green-400' },
  { name: '促花', months: '10-11月', bg: 'bg-yellow-500/30', text: 'text-yellow-300' },
  { name: '第一茬', months: '11-12月', bg: 'bg-orange-500/30', text: 'text-orange-300' },
  { name: '高峰', months: '12-3月', bg: 'bg-red-500/30', text: 'text-red-300' },
  { name: '拉秧', months: '3-4月', bg: 'bg-amber-800/30', text: 'text-amber-400' },
]

/* 农事操作卡片 - 按阶段分组 */
const operationCards = computed(() => {
  if (operations.value.length === 0) {
    return defaultOperationCards
  }
  const groups = new Map<string, FarmOperation[]>()
  for (const op of operations.value) {
    const stage = op.relatedStage
    if (!groups.has(stage)) groups.set(stage, [])
    groups.get(stage)!.push(op)
  }
  return [...groups.entries()].map(([stage, ops]) => ({
    stage,
    ops,
    borderColor: getStageBorderColor(stage),
  }))
})

/* 默认操作卡片（无数据时展示） */
const defaultOperationCards = [
  {
    stage: '整地定植',
    ops: [
      { name: '整地起垄', plannedDate: '9月上旬', type: 'planting' as OperationType, priority: 'high' as OperationPriority, description: '深翻30cm，起垄高25-30cm，垄面宽50cm' },
      { name: '土壤消毒', plannedDate: '9月上旬', type: 'pest_control' as OperationType, priority: 'high' as OperationPriority, description: '太阳能消毒或化学消毒，杀灭土传病菌' },
    ],
    borderColor: 'border-t-green-500/60',
  },
  {
    stage: '定植',
    ops: [
      { name: '移栽定植', plannedDate: '9月中旬', type: 'planting' as OperationType, priority: 'urgent' as OperationPriority, description: '选壮苗，带土移栽，浇足定植水' },
    ],
    borderColor: 'border-t-green-600/60',
  },
  {
    stage: '缓苗期',
    ops: [
      { name: '遮阳缓苗', plannedDate: '9月中旬', type: 'monitoring' as OperationType, priority: 'medium' as OperationPriority, description: '遮阳网覆盖3-5天，保持土壤湿润' },
      { name: '查苗补苗', plannedDate: '9月下旬', type: 'monitoring' as OperationType, priority: 'medium' as OperationPriority, description: '检查成活率，及时补栽缺苗' },
    ],
    borderColor: 'border-t-green-400/60',
  },
  {
    stage: '营养生长',
    ops: [
      { name: '追施氮肥', plannedDate: '10月上旬', type: 'fertilizer' as OperationType, priority: 'high' as OperationPriority, description: '亩施尿素5kg，促进营养生长' },
      { name: '摘除老叶', plannedDate: '10月中旬', type: 'pruning' as OperationType, priority: 'medium' as OperationPriority, description: '摘除下部老叶、病叶，保持通风透光' },
    ],
    borderColor: 'border-t-emerald-500/60',
  },
  {
    stage: '花芽分化',
    ops: [
      { name: '控旺促花', plannedDate: '10月下旬', type: 'fertilizer' as OperationType, priority: 'high' as OperationPriority, description: '控氮增磷钾，叶面喷施0.2%磷酸二氢钾' },
    ],
    borderColor: 'border-t-yellow-500/60',
  },
  {
    stage: '开花坐果',
    ops: [
      { name: '放蜂授粉', plannedDate: '11月上旬', type: 'monitoring' as OperationType, priority: 'high' as OperationPriority, description: '每亩放置1箱蜜蜂，提高坐果率' },
      { name: '疏花疏果', plannedDate: '11月中旬', type: 'pruning' as OperationType, priority: 'medium' as OperationPriority, description: '每株保留4-5个果，去除畸形果' },
    ],
    borderColor: 'border-t-pink-500/60',
  },
  {
    stage: '果实发育',
    ops: [
      { name: '追施钾肥', plannedDate: '12月上旬', type: 'fertilizer' as OperationType, priority: 'high' as OperationPriority, description: '亩施硫酸钾8kg，促进果实膨大着色' },
      { name: '温湿度管理', plannedDate: '12月中旬', type: 'monitoring' as OperationType, priority: 'high' as OperationPriority, description: '昼温20-25℃，夜温8-12℃，湿度60-70%' },
    ],
    borderColor: 'border-t-orange-500/60',
  },
  {
    stage: '采收期',
    ops: [
      { name: '适时采收', plannedDate: '1月上旬', type: 'harvest' as OperationType, priority: 'high' as OperationPriority, description: '果面8成着色时采收，轻拿轻放' },
      { name: '追肥复壮', plannedDate: '1月下旬', type: 'fertilizer' as OperationType, priority: 'medium' as OperationPriority, description: '亩施复合肥10kg，恢复植株长势' },
    ],
    borderColor: 'border-t-red-500/60',
  },
  {
    stage: '拉秧清园',
    ops: [
      { name: '拉秧清园', plannedDate: '3月下旬', type: 'pruning' as OperationType, priority: 'low' as OperationPriority, description: '清除残株落叶，土壤深翻晒垡' },
    ],
    borderColor: 'border-t-amber-700/60',
  },
]

/* 阶段对应边框颜色 */
function getStageBorderColor(stage: string): string {
  const map: Record<string, string> = {
    '整地定植': 'border-t-green-500/60',
    '定植': 'border-t-green-600/60',
    '缓苗期': 'border-t-green-400/60',
    '营养生长': 'border-t-emerald-500/60',
    '花芽分化': 'border-t-yellow-500/60',
    '开花坐果': 'border-t-pink-500/60',
    '果实发育': 'border-t-orange-500/60',
    '采收期': 'border-t-red-500/60',
    '拉秧清园': 'border-t-amber-700/60',
  }
  return map[stage] || 'border-t-midnight-400/60'
}

/* 优先级样式 */
function priorityClass(priority: OperationPriority): string {
  const map: Record<OperationPriority, string> = {
    urgent: 'bg-strawberry-500/20 text-strawberry-300',
    high: 'bg-orange-500/20 text-orange-300',
    medium: 'bg-amber-500/20 text-amber-300',
    low: 'bg-forest-500/20 text-forest-300',
  }
  return map[priority]
}

/* 优先级中文名 */
function priorityName(priority: OperationPriority): string {
  const map: Record<OperationPriority, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  }
  return map[priority]
}

/* 操作类型中文名 */
function typeName(type: OperationType): string {
  const map: Record<OperationType, string> = {
    irrigation: '灌溉',
    fertilizer: '施肥',
    pruning: '修剪',
    pest_control: '植保',
    harvest: '采收',
    planting: '种植',
    monitoring: '监测',
  }
  return map[type] || type
}

/* 灌溉与施肥方案表格数据 */
const irrigationFertTable = [
  { month: '9月', stage: '整地定植', irrigation: '30mm', frequency: '1次', npk: '20-10-10', usage: '150kg' },
  { month: '10月', stage: '营养生长', irrigation: '20mm', frequency: '5-7天', npk: '20-10-10', usage: '100kg' },
  { month: '11月', stage: '花芽分化', irrigation: '15mm', frequency: '7-10天', npk: '10-30-20', usage: '100kg' },
  { month: '12月', stage: '开花坐果', irrigation: '25mm', frequency: '5-7天', npk: '5-15-30', usage: '120kg' },
  { month: '1月', stage: '果实发育', irrigation: '25mm', frequency: '5-7天', npk: '5-15-30', usage: '120kg' },
  { month: '2月', stage: '采收期', irrigation: '15mm', frequency: '7-10天', npk: '10-10-30', usage: '80kg' },
]

/* 是否有数据 */
const hasData = computed(() => simulation.status !== 'idle')
</script>

<template>
  <div class="space-y-6">
    <!-- 无数据提示 -->
    <div
      v-if="!hasData"
      class="glass-card p-12 text-center"
    >
      <Sprout :size="48" class="mx-auto mb-4 text-midnight-500" />
      <p class="text-midnight-300 mb-2">尚未运行模拟</p>
      <p class="text-sm text-midnight-400">请先在基础信息页面完成配置并生成方案</p>
    </div>

    <template v-else>
      <!-- 1. 顶部标题区 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Sprout :size="28" class="text-forest-400" />
          <div>
            <h1 class="text-2xl font-heading text-midnight-50">农事操作</h1>
            <p class="text-sm text-midnight-400 mt-0.5">全生育期农事操作日历与执行标准</p>
          </div>
        </div>
        <span class="px-3 py-1 rounded-full bg-forest-500/20 text-forest-300 text-sm font-medium">
          {{ planDays }}天方案
        </span>
      </div>

      <!-- 2. 关键指标卡片区 -->
      <div class="grid grid-cols-4 gap-4">
        <div
          v-for="card in summaryCards"
          :key="card.label"
          class="glass-card p-4 border-l-4"
          :class="card.borderClass"
        >
          <p class="text-xs text-midnight-400 uppercase tracking-wider mb-1">{{ card.label }}</p>
          <p class="text-xl font-bold text-midnight-100">{{ card.value }}</p>
          <p class="text-xs text-midnight-400 mt-1">{{ card.sub }}</p>
        </div>
      </div>

      <!-- 3. 农事操作时间线区 -->
      <div class="glass-card p-5">
        <h2 class="v2-section-title">农事操作时间线</h2>
        <div class="flex h-10 rounded-lg overflow-hidden">
          <div
            v-for="(stage, idx) in timelineStages"
            :key="idx"
            class="flex flex-col items-center justify-center px-3 transition-all"
            :class="[stage.bg, idx === 0 ? 'rounded-l-lg' : '', idx === timelineStages.length - 1 ? 'rounded-r-lg' : '']"
            style="min-width: 80px; flex: 1;"
          >
            <span class="text-sm font-medium" :class="stage.text">{{ stage.name }}</span>
            <span class="text-xs text-midnight-300">{{ stage.months }}</span>
          </div>
        </div>
      </div>

      <!-- 4. 农事操作卡片区 -->
      <div class="grid grid-cols-5 gap-4">
        <div
          v-for="(card, idx) in operationCards"
          :key="idx"
          class="glass-card border-t-2 overflow-hidden"
          :class="card.borderColor"
        >
          <!-- 阶段标题 -->
          <div class="px-4 pt-3 pb-2">
            <h3 class="text-sm font-semibold text-midnight-100">{{ card.stage }}</h3>
          </div>
          <!-- 操作列表 -->
          <div class="px-4 pb-3 space-y-2">
            <div
              v-for="(op, opIdx) in card.ops"
              :key="opIdx"
              class="p-2.5 rounded-lg bg-midnight-700/30"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-midnight-100">{{ op.name }}</span>
                <span
                  class="text-xs px-2 py-0.5 rounded-full"
                  :class="priorityClass(op.priority)"
                >
                  {{ priorityName(op.priority) }}
                </span>
              </div>
              <p class="text-xs text-midnight-300 mb-1">{{ op.description }}</p>
              <div class="flex items-center gap-2 text-xs text-midnight-400">
                <span>{{ op.plannedDate }}</span>
                <span class="text-midnight-500">|</span>
                <span>{{ typeName(op.type) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. 灌溉与施肥方案表格区 -->
      <div class="glass-card p-5">
        <h2 class="v2-section-title flex items-center gap-2">
          <Droplets :size="18" class="text-blue-400" />
          灌溉与施肥方案
        </h2>
        <div class="overflow-x-auto">
          <table class="v2-table">
            <thead>
              <tr>
                <th class="v2-table th">月份</th>
                <th class="v2-table th">阶段</th>
                <th class="v2-table th">灌溉/天</th>
                <th class="v2-table th">频率</th>
                <th class="v2-table th">N-P₂O₅-K₂O</th>
                <th class="v2-table th">用量/亩</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in irrigationFertTable" :key="idx">
                <td class="v2-table td font-medium text-midnight-100">{{ row.month }}</td>
                <td class="v2-table td">{{ row.stage }}</td>
                <td class="v2-table td">{{ row.irrigation }}</td>
                <td class="v2-table td">{{ row.frequency }}</td>
                <td class="v2-table td font-medium text-midnight-100">{{ row.npk }}</td>
                <td class="v2-table td">{{ row.usage }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
