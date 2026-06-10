<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'
import { useChart } from '@/composables/useChart'
import type { FarmOperation, OperationType, OperationPriority } from '@/engine/types'
import { stageTimelines } from '@/data/stage-timelines'
import VChart from 'vue-echarts'
import {
  Droplets,
  Fertilizer,
  Scissors,
  Shield,
  Sprout,
  Cherry,
  CalendarCheck,
  AlertCircle,
  CheckCircle2,
  ListChecks,
  Info,
  Thermometer,
  Wind,
  LayoutGrid,
} from 'lucide-vue-next'

const simulation = useSimulationStore()
const config = useConfigStore()
const { createLightBarChartOption, colors } = useChart()

const operations = computed<FarmOperation[]>(() => simulation.farmOperations)

/* 顶部关键指标卡片 */
const summaryCards = computed(() => {
  const irrigationOps = operations.value.filter(o => o.type === 'irrigation')
  const fertOps = operations.value.filter(o => o.type === 'fertilizer')
  const totalN = fertOps.reduce((sum, o) => sum + (Number(o.params.n) || 0), 0)
  return [
    {
      label: '灌溉方式',
      value: '膜下滴灌',
      sub: '推荐节水高效',
      accent: 'v2-accent-blue',
      icon: Droplets,
    },
    {
      label: '建议施N量',
      value: `${Math.round(totalN / 10) * 10}-${Math.round(totalN / 10) * 10 + 50} kg N/ha`,
      sub: '分8-12次',
      accent: 'v2-accent-green',
      icon: Fertilizer,
    },
    {
      label: '覆膜',
      value: '黑膜',
      sub: '提温+控草+降湿',
      accent: 'v2-accent-gray',
      icon: LayoutGrid,
    },
    {
      label: '密度',
      value: `${(config.plantingDensity / 10000).toFixed(1)} 株/m²`,
      sub: `行距30cm 株距12cm`,
      accent: 'v2-accent-purple',
      icon: Sprout,
    },
  ]
})

/* 阶段时间轴配置 */
const stageBarConfig = computed(() => {
  const plantingDate = new Date(config.plantingDate)
  return stageTimelines.map(s => {
    const start = new Date(plantingDate)
    start.setMonth(start.getMonth() + (s.startMonth - 9))
    const end = new Date(plantingDate)
    end.setMonth(end.getMonth() + (s.endMonth - 9))
    return {
      name: s.name,
      color: s.color,
      startDate: start,
      endDate: end,
      operations: s.operations,
    }
  })
})

/* 操作类型图标 */
function typeIcon(type: OperationType) {
  const map: Record<OperationType, any> = {
    irrigation: Droplets,
    fertilizer: Sprout,
    pruning: Scissors,
    pest_control: Shield,
    harvest: Cherry,
    planting: Sprout,
    monitoring: ListChecks,
  }
  return map[type] || ListChecks
}

/* 操作类型颜色 */
function typeColor(type: OperationType): string {
  const map: Record<OperationType, string> = {
    irrigation: '#3B82F6',
    fertilizer: '#2D6A4F',
    pruning: '#8B5CF6',
    pest_control: '#F59E0B',
    harvest: '#E63946',
    planting: '#4ADE80',
    monitoring: '#9CA3AF',
  }
  return map[type] || '#9CA3AF'
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

/* 优先级样式 */
function priorityClass(priority: OperationPriority): string {
  const map: Record<OperationPriority, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-amber-100 text-amber-700',
    urgent: 'bg-red-100 text-red-700',
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

/* 按阶段分组操作 */
const groupedByStage = computed(() => {
  const groups = new Map<string, FarmOperation[]>()
  for (const op of operations.value) {
    const stageStr = op.relatedStage
    if (!groups.has(stageStr)) {
      groups.set(stageStr, [])
    }
    groups.get(stageStr)!.push(op)
  }
  return [...groups.entries()]
})

/* 灌溉与施肥方案表格数据 */
const irrigationFertTable = computed(() => {
  const irrOps = operations.value.filter(o => o.type === 'irrigation')
  const fertOps = operations.value.filter(o => o.type === 'fertilizer')

  const months = ['9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月']
  const stages = ['定植-缓苗', '营养生长', '花芽分化-开花', '第一茬果', '采收高峰', '采收末期', '拉秧', '-']
  const irrigation = ['5-8mm', '5-8mm', '4-6mm', '6-8mm', '6-10mm', '6-8mm', '4-6mm', '-']
  const frequency = ['1次/天', '1次/天', '1次/天', '1-2次/天', '2次/天', '1-2次/天', '1次/天', '-']
  const nPK = ['20-20-20', '20-20-20', '10-30-20', '15-15-30', '16-8-32+Ca', '10-10-20+K', '5-5-5', '-']
  const usage = ['5kg×2次', '5kg×2次', '8kg×2次', '8kg×3次', '8kg×4次', '6kg×2次', '3kg×1次', '-']

  return months.map((m, i) => ({
    month: m,
    stage: stages[i],
    irrigation: irrigation[i],
    frequency: frequency[i],
    nPK: nPK[i],
    usage: usage[i],
  }))
})

/* 阶段色条样式 */
function getStageBarStyle(stage: typeof stageBarConfig.value[0]) {
  return {
    background: stage.color,
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- 无数据提示 -->
    <div
      v-if="simulation.status === 'idle'"
      class="v2-card p-12 text-center"
    >
      <Sprout :size="48" class="mx-auto text-gray-400 mb-4" />
      <h3 class="text-xl text-gray-600 mb-2">尚未运行模拟</h3>
      <p class="text-gray-500">请先在基础信息页面完成配置并生成方案</p>
    </div>

    <template v-else>
      <!-- 顶部关键指标卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div
          v-for="(card, idx) in summaryCards"
          :key="card.label"
          class="v2-stat-card"
        >
          <div :class="['absolute top-0 left-0 right-0 h-1', card.accent]"></div>
          <div class="flex items-center gap-2 mb-1">
            <component :is="card.icon" :size="14" class="text-gray-500" />
            <span class="text-xs text-gray-500 uppercase tracking-wider">{{ card.label }}</span>
          </div>
          <span class="text-2xl font-bold text-gray-800">{{ card.value }}</span>
          <span class="text-xs text-gray-400 mt-1">{{ card.sub }}</span>
        </div>
      </div>

      <!-- 农事操作时间轴色条 -->
      <div class="v2-card p-5">
        <h2 class="v2-section-title">农事操作时间轴</h2>
        <div class="flex h-8 rounded-lg overflow-hidden mb-3">
          <div
            v-for="(stage, idx) in stageBarConfig"
            :key="idx"
            class="flex items-center justify-center text-white text-xs font-medium transition-all"
            :style="getStageBarStyle(stage)"
            :class="idx === 0 ? 'rounded-l-lg' : ''"
            :class="idx === stageBarConfig.length - 1 ? 'rounded-r-lg' : ''"
            style="min-width: 60px;"
          >
            <span class="truncate px-1">{{ stage.name }}</span>
          </div>
        </div>
        <!-- 月份刻度 -->
        <div class="flex text-xs text-gray-400 justify-between px-1">
          <span v-for="m in ['9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月']" :key="m">
            {{ m }}
          </span>
        </div>
      </div>

      <!-- 操作卡片网格 -->
      <div class="v2-card p-5">
        <h2 class="v2-section-title">全生育期农事操作日历与执行标准</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="[stage, ops] in groupedByStage"
            :key="stage"
            class="border border-gray-200 rounded-lg overflow-hidden"
          >
            <!-- 阶段标题条 -->
            <div class="px-4 py-2 text-white text-sm font-medium flex items-center gap-2"
                 :style="{ background: stageBarConfig.find(s => s.name === stage)?.color || '#6B7280' }">
              <component
                :is="ops.length > 0 ? typeIcon(ops[0].type) : Info"
                :size="16"
              />
              {{ stage }}
            </div>
            <!-- 操作列表 -->
            <div class="p-4 space-y-3">
              <div
                v-for="(op, idx) in ops"
                :key="`${op.plannedDate}-${op.type}-${idx}`"
                class="p-3 rounded-lg bg-gray-50 border border-gray-100"
              >
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center gap-2">
                    <component
                      :is="typeIcon(op.type)"
                      :size="14"
                      :style="{ color: typeColor(op.type) }"
                    />
                    <span class="text-sm font-medium text-gray-800">{{ op.name }}</span>
                  </div>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full"
                    :class="priorityClass(op.priority)"
                  >
                    {{ priorityName(op.priority) }}
                  </span>
                </div>
                <p class="text-xs text-gray-600 mb-1">{{ op.description }}</p>
                <div class="flex items-center gap-3 text-xs text-gray-400">
                  <span class="flex items-center gap-1">
                    <CalendarCheck :size="10" />
                    {{ op.plannedDate }}
                  </span>
                  <span>{{ typeName(op.type) }}</span>
                </div>
                <div
                  v-if="op.params && Object.keys(op.params).length > 0"
                  class="mt-2 flex flex-wrap gap-1"
                >
                  <span
                    v-for="(val, key) in op.params"
                    :key="key"
                    class="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600"
                  >
                    {{ key }}: {{ val }}
                  </span>
                </div>
              </div>

              <div
                v-if="ops.length === 0"
                class="text-center py-4 text-gray-400 text-sm"
              >
                暂无操作
              </div>
            </div>
          </div>

          <div
            v-if="groupedByStage.length === 0"
            class="col-span-full text-center py-8 text-gray-400 text-sm"
          >
            暂无农事操作建议
          </div>
        </div>
      </div>

      <!-- 灌溉与施肥方案表格 -->
      <div class="v2-card p-5">
        <h2 class="v2-section-title flex items-center gap-2">
          <Droplets :size="18" class="text-blue-500" />
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
                <th class="v2-table th">N-P₂O-K₂O</th>
                <th class="v2-table th">用量/亩</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in irrigationFertTable"
                :key="idx"
                class="border-b border-gray-100"
                :class="idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
              >
                <td class="py-2 px-3 text-gray-700 font-medium">{{ row.month }}</td>
                <td class="py-2 px-3 text-gray-600">{{ row.stage }}</td>
                <td class="py-2 px-3 text-gray-600">{{ row.irrigation }}</td>
                <td class="py-2 px-3 text-gray-600">{{ row.frequency }}</td>
                <td class="py-2 px-3 text-gray-700 font-medium">{{ row.nPK }}</td>
                <td class="py-2 px-3 text-gray-600">{{ row.usage }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
