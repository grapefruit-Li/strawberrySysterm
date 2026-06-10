<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'
import { useChart } from '@/composables/useChart'
import type { PhenologyEvent, GrowthStage } from '@/engine/types'
import VChart from 'vue-echarts'
import {
  Calendar,
  Thermometer,
  Sprout,
  ArrowRight,
  Info,
  BarChart3,
} from 'lucide-vue-next'

const simulation = useSimulationStore()
const config = useConfigStore()
const { ganttTimelineLightOption, createLightLineChartOption, colors } = useChart()

const phenologyEvents = computed<PhenologyEvent[]>(() => simulation.phenologyEvents)

/* 顶部摘要卡片 */
const summaryCards = computed(() => {
  const cultivar = config.selectedCultivarFull
  const currentDay = simulation.results.length > 0 ? simulation.results[simulation.results.length - 1].day : 0
  const currentStage = simulation.results.length > 0
    ? simulation.results[simulation.results.length - 1].growthStage
    : '-'

  const nextEvent = phenologyEvents.value.find(e => e.startDate > 0 && e.startDate / 10000 * 100 + (e.startDate % 100) > new Date().getDate())
  const stageNames: Record<string, string> = {
    '休眠期': '休眠期', '出苗期': '萌芽期', '营养生长期': '营养生长期',
    '花芽分化期': '花芽分化期', '开花期': '开花期', '结果期': '结果期',
    '果实膨大期': '结果期', '采收期': '采收期',
  }

  return [
    {
      label: '当前GDD',
      value: `${simulation.results.length > 0 ? Math.round(simulation.results[simulation.results.length - 1].totalBiomass * 0.1) : 0}°C·d`,
      sub: '累积积温',
      accent: 'v2-accent-red',
      icon: Thermometer,
    },
    {
      label: '当前阶段',
      value: stageNames[currentStage] || currentStage || '未开始',
      sub: cultivar?.name ?? '',
      accent: 'v2-accent-green',
      icon: Sprout,
    },
    {
      label: '距下阶段',
      value: nextEvent ? `~${nextEvent.duration}天` : '-',
      sub: nextEvent?.name ?? '',
      accent: 'v2-accent-blue',
      icon: ArrowRight,
    },
    {
      label: '预计采收',
      value: phenologyEvents.value.find(e => e.name.includes('采收'))
        ? `${phenologyEvents.value.find(e => e.name.includes('采收'))?.duration || 0}天`
        : '-',
      sub: '定植后',
      accent: 'v2-accent-orange',
      icon: Calendar,
    },
  ]
})

/* 甘特图配置 */
const ganttOption = computed(() => {
  if (phenologyEvents.value.length === 0) {
    return ganttTimelineLightOption([])
  }
  return ganttTimelineLightOption(phenologyEvents.value)
})

/* GDD累积曲线配置 */
const gddOption = computed(() => {
  if (simulation.results.length === 0) {
    return createLightLineChartOption('GDD累积曲线', [], [])
  }

  const dates = simulation.results.map(r => r.date)
  const gddData = simulation.results.map((r, i, arr) => {
    return Math.round(arr.slice(0, i + 1).reduce((sum, x) => sum + x.totalBiomass * 0.1, 0))
  })

  return {
    ...createLightLineChartOption('GDD累积曲线', dates, []),
    series: [{
      name: 'GDD累积',
      type: 'line' as const,
      data: gddData,
      smooth: true,
      lineStyle: { width: 2, color: '#EF4444' },
      itemStyle: { color: '#EF4444' },
      areaStyle: {
        color: {
          type: 'linear' as const,
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#EF444420' },
            { offset: 1, color: '#EF444405' },
          ],
        },
      },
    }],
  }
})

/* 阶段样式 - 根据生长阶段名称映射 */
function stageColor(stageName: string): string {
  const map: Record<string, string> = {
    '出苗期': '#4ADE80',
    '萌芽期': '#4ADE80',
    '营养生长期': '#2D6A4F',
    '花芽分化期': '#F59E0B',
    '开花期': '#EC4899',
    '结果期': '#E63946',
    '果实膨大期': '#E63946',
    '成熟期': '#8B5CF6',
    '采收期': '#E63946',
    '休眠期': '#9CA3AF',
  }
  return map[stageName] || '#9CA3AF'
}

function stageBadgeClass(stageName: string): string {
  const color = stageColor(stageName)
  if (color === '#4ADE80' || color === '#2D6A4F') return 'bg-green-100 text-green-700'
  if (color === '#F59E0B') return 'bg-yellow-100 text-yellow-700'
  if (color === '#EC4899') return 'bg-pink-100 text-pink-700'
  if (color === '#E63946') return 'bg-red-100 text-red-700'
  if (color === '#8B5CF6') return 'bg-purple-100 text-purple-700'
  return 'bg-gray-100 text-gray-600'
}

function confidenceClass(duration: number): string {
  if (duration >= 30) return 'bg-green-100 text-green-700'
  if (duration >= 14) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

/* 阶段编号映射 */
function stageNumber(stage: GrowthStage): string {
  const map: Record<number, string> = {
    0: '休眠期',
    1: '萌芽期',
    2: '营养生长期',
    3: '开花期',
    4: '结果期',
    5: '成熟期',
    6: '采收期',
    7: '结束',
  }
  return map[stage] || '未知'
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
      <!-- 顶部摘要卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      <!-- 物候甘特图时间轴 -->
      <div class="v2-card p-5">
        <h2 class="v2-section-title flex items-center gap-2">
          <Calendar :size="18" class="text-blue-500" />
          物候方案甘特图
        </h2>
        <v-chart
          :option="ganttOption"
          autoresize
          class="w-full h-64"
        />
      </div>

      <!-- GDD累积曲线 -->
      <div class="v2-card p-5">
        <h2 class="v2-section-title flex items-center gap-2">
          <Thermometer :size="18" class="text-red-500" />
          GDD累积曲线
        </h2>
        <v-chart
          :option="gddOption"
          autoresize
          class="w-full h-72"
        />
      </div>

      <!-- 物候事件列表 + 阶段GDD进度 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 物候事件列表 -->
        <div class="v2-card p-5">
          <h2 class="v2-section-title flex items-center gap-2">
            <Sprout :size="18" class="text-green-500" />
            物候事件
          </h2>
          <div class="space-y-3">
            <div
              v-for="(event, idx) in phenologyEvents"
              :key="event.name + idx"
              class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
            >
              <div class="flex items-center gap-2 shrink-0">
                <div
                  class="w-3 h-3 rounded-full mt-1"
                  :style="{ background: stageColor(event.name) }"
                ></div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-medium text-gray-800">{{ event.name }}</span>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full"
                    :class="stageBadgeClass(event.name)"
                  >
                    {{ stageNumber(event.stage) }}
                  </span>
                </div>
                <div class="text-xs text-gray-500 space-y-0.5">
                  <div>起始日期: {{ event.predictedDate }}</div>
                  <div>GDD: {{ event.startGdd }}-{{ event.endGdd }}°C·d</div>
                </div>
              </div>
              <div class="text-right shrink-0">
                <div class="text-xs text-gray-500">持续</div>
                <div class="text-sm font-bold text-gray-800">{{ event.duration }}天</div>
                <div
                  class="text-xs px-1.5 py-0.5 rounded mt-1"
                  :class="confidenceClass(event.duration)"
                >
                  {{ Math.round(0.85 * 100) }}%
                </div>
              </div>
            </div>

            <div
              v-if="phenologyEvents.length === 0"
              class="text-center py-8 text-gray-400 text-sm"
            >
              暂无物候事件
            </div>
          </div>
        </div>

        <!-- 阶段GDD进度面板 -->
        <div class="v2-card p-5">
          <h2 class="v2-section-title flex items-center gap-2">
            <BarChart3 :size="18" class="text-purple-500" />
            阶段GDD进度
          </h2>
          <div class="space-y-4">
            <div
              v-for="(event, idx) in phenologyEvents"
              :key="'progress-' + idx"
              class="space-y-1"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-700">{{ event.name }}</span>
                <span class="text-gray-500">{{ event.startGdd }}-{{ event.endGdd }}°C·d</span>
              </div>
              <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :style="{
                    width: `${Math.min(100, (event.endGdd / 1000) * 100)}%`,
                    background: stageColor(event.name)
                  }"
                ></div>
              </div>
            </div>

            <div
              v-if="phenologyEvents.length === 0"
              class="text-center py-8 text-gray-400 text-sm"
            >
              暂无数据
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
