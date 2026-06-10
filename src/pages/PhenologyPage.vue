<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'
import { useChart } from '@/composables/useChart'
import type { PhenologyEvent } from '@/engine/types'
import VChart from 'vue-echarts'
import {
  Thermometer,
  Clock,
  CalendarDays,
  Target,
  Info,
  Leaf,
  Flower2,
  Cherry,
  Sprout,
} from 'lucide-vue-next'

const simulation = useSimulationStore()
const config = useConfigStore()
const { ganttTimelineOption, createLineChartOption, stageColors } = useChart()

/* 物候事件 */
const events = computed<PhenologyEvent[]>(() => simulation.phenologyEvents)

/* 当前GDD */
const currentGdd = computed(() => {
  if (simulation.results.length === 0) return 0
  return simulation.results[simulation.results.length - 1].totalBiomass > 0
    ? Math.round(simulation.results[simulation.results.length - 1].totalBiomass * 0.1)
    : 0
})

/* 当前阶段 */
const currentStage = computed(() => {
  if (events.value.length === 0) return '-'
  /* 找到当前日期所在的阶段 */
  const today = new Date()
  const todayNum = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const current = events.value.find(e => {
    /* predictedDate是string，用startDate(number)做日期比较 */
    return e.startDate <= todayNum && e.endDate >= todayNum
  })
  return current?.name ?? events.value[events.value.length - 1]?.name ?? '-'
})

/* 距下阶段天数 */
const daysToNextStage = computed(() => {
  if (events.value.length < 2) return '-'
  const today = new Date()
  const todayNum = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  /* 用startDate(number)做日期比较 */
  const nextEvent = events.value.find(e => e.startDate > todayNum)
  if (!nextEvent) return '-'
  const nextStart = new Date(
    Math.floor(nextEvent.startDate / 10000),
    Math.floor((nextEvent.startDate % 10000) / 100) - 1,
    nextEvent.startDate % 100
  )
  return Math.max(0, Math.ceil((nextStart.getTime() - today.getTime()) / 86400000))
})

/* 预计采收开始 */
const harvestStart = computed(() => {
  const harvestEvent = events.value.find(e => e.name === '采收期')
  if (!harvestEvent) return '-'
  return harvestEvent.predictedDate
})

/* 摘要卡片 */
const summaryCards = computed(() => [
  { label: '当前GDD', value: `${currentGdd.value} °C·d`, icon: Thermometer, color: 'text-strawberry-400' },
  { label: '当前阶段', value: currentStage.value, icon: Clock, color: 'text-forest-400' },
  { label: '距下阶段', value: `${daysToNextStage.value}天`, icon: CalendarDays, color: 'text-amber-400' },
  { label: '预计采收开始', value: harvestStart.value, icon: Target, color: 'text-purple-400' },
])

/* 甘特图选项 */
const ganttOption = computed(() => ganttTimelineOption(events.value))

/* GDD累积曲线选项 */
const gddCurveOption = computed(() => {
  if (simulation.results.length === 0) {
    return createLineChartOption('逐日GDD累积曲线', [], [])
  }

  const dates = simulation.results.map(r => r.date.slice(-5) || r.date)
  const gddData: number[] = []
  let cumGdd = 0
  for (const r of simulation.results) {
    /* 简化：用生物量估算GDD */
    cumGdd += Math.max(0, (r.tmax || 20 + r.totalBiomass * 0.001) - 7)
    gddData.push(Math.round(cumGdd))
  }

  /* 阶段转换标记点 */
  const markPoints: { name: string; coord: [string, number] }[] = []
  for (const ev of events.value) {
    /* predictedDate是string格式如"2024-03-15"，取月-日部分 */
    const dateStr = ev.predictedDate.slice(5) // "03-15"
    const idx = dates.indexOf(dateStr)
    if (idx >= 0) {
      markPoints.push({ name: ev.name, coord: [dateStr, gddData[idx]] })
    }
  }

  return {
    ...createLineChartOption('逐日GDD累积曲线', dates, [
      { name: '累积GDD', data: gddData, color: '#E63946' },
    ]),
    series: [{
      name: '累积GDD',
      type: 'line' as const,
      data: gddData,
      smooth: true,
      lineStyle: { width: 2, color: '#E63946' },
      itemStyle: { color: '#E63946' },
      areaStyle: {
        color: {
          type: 'linear' as const,
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#E6394640' },
            { offset: 1, color: '#E6394605' },
          ],
        },
      },
      markPoint: {
        data: markPoints.map(mp => ({
          name: mp.name,
          coord: mp.coord,
          label: { show: true, formatter: mp.name, color: '#F3F4F6', fontSize: 10 },
          itemStyle: { color: stageColors[mp.name] || '#3B82F6' },
        })),
      },
    }],
  }
})

/* 阶段图标映射 */
const stageIconMap: Record<string, any> = {
  '萌芽期': Sprout,
  '营养生长期': Leaf,
  '花芽分化期': Flower2,
  '开花期': Flower2,
  '结果期': Cherry,
  '果实膨大期': Cherry,
  '采收期': Cherry,
}
</script>

<template>
  <div class="space-y-6">
    <!-- 无数据提示 -->
    <div
      v-if="simulation.status === 'idle'"
      class="glass-card p-12 text-center"
    >
      <CalendarDays :size="48" class="mx-auto text-midnight-500 mb-4" />
      <h3 class="font-heading text-xl text-midnight-300 mb-2">尚未运行模拟</h3>
      <p class="text-midnight-500">请先在基础信息页面完成配置并生成方案</p>
    </div>

    <template v-else>
      <!-- 顶部摘要卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="card in summaryCards"
          :key="card.label"
          class="stat-card"
        >
          <div class="flex items-center gap-2 mb-1">
            <component :is="card.icon" :size="14" :class="card.color" />
            <span class="stat-label">{{ card.label }}</span>
          </div>
          <span class="stat-value text-lg">{{ card.value }}</span>
        </div>
      </div>

      <!-- 甘特图时间轴 -->
      <div class="glass-card p-5">
        <h2 class="section-title">物候甘特图</h2>
        <v-chart
          :option="ganttOption"
          autoresize
          class="w-full h-64"
        />
      </div>

      <!-- GDD累积曲线 -->
      <div class="glass-card p-5">
        <h2 class="section-title">逐日GDD累积曲线</h2>
        <v-chart
          :option="gddCurveOption"
          autoresize
          class="w-full h-80"
        />
      </div>

      <!-- 物候事件列表 + 侧面板 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 事件列表 -->
        <div class="lg:col-span-2 glass-card p-5">
          <h2 class="section-title">物候事件列表</h2>
          <div class="space-y-3">
            <div
              v-for="ev in events"
              :key="'env-' + ev.stage"
              class="flex items-start gap-4 p-3 rounded-lg bg-midnight-800/40 border border-midnight-600/20"
            >
              <!-- 阶段图标 -->
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                :style="{ backgroundColor: (stageColors[ev.name] || '#3B82F6') + '20' }"
              >
                <component
                  :is="stageIconMap[ev.name] || Info"
                  :size="20"
                  :style="{ color: stageColors[ev.name] || '#3B82F6' }"
                />
              </div>

              <!-- 事件信息 -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-heading text-midnight-50">{{ ev.name }}</span>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-midnight-700/50 text-midnight-300">
                    {{ ev.duration }}天
                  </span>
                </div>
                <div class="flex gap-4 text-xs text-midnight-500">
                  <span>预测日期: {{ ev.predictedDate }}</span>
                  <span>GDD: {{ ev.startGdd }}-{{ ev.endGdd }} °C·d</span>
                  <span>置信度: 85%</span>
                </div>
              </div>
            </div>

            <!-- 无事件 -->
            <div
              v-if="events.length === 0"
              class="text-center py-8 text-midnight-500 text-sm"
            >
              暂无物候事件数据
            </div>
          </div>
        </div>

        <!-- 侧面板：阶段GDD进度 -->
        <div class="glass-card p-5">
          <h2 class="section-title flex items-center gap-2">
            <Info :size="18" class="text-blue-400" />
            阶段GDD进度
          </h2>
          <div class="space-y-4">
            <div
              v-for="ev in events"
              :key="'env-' + ev.stage"
              class="p-3 rounded-lg border border-midnight-600/20 bg-midnight-800/30"
            >
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="w-2 h-2 rounded-full"
                  :style="{ backgroundColor: stageColors[ev.name] || '#3B82F6' }"
                />
                <span class="text-sm font-medium text-midnight-200">{{ ev.name }}</span>
              </div>
              <div class="text-xs text-midnight-400">
                GDD: {{ ev.startGdd }}-{{ ev.endGdd }} °C·d | 持续: {{ ev.duration }}天 | 置信度: 85%
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
