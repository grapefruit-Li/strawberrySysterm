<script setup lang="ts">
import { computed } from 'vue'
import { Info, Sprout, Flower2, Apple, Flag } from 'lucide-vue-next'
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'
import { useChart } from '@/composables/useChart'
import VChart from 'vue-echarts'
import type { PhenologyEvent } from '@/engine/types'

const simulationStore = useSimulationStore()
const configStore = useConfigStore()
const { ganttTimelineOption } = useChart()

const events = computed(() => simulationStore.phenologyEvents)
const hasData = computed(() => events.value.length > 0)

/* 品种名和定植日期 */
const cultivarName = computed(() => configStore.cultivarName || '未选择')
const plantingDate = computed(() => configStore.plantingDate || '未设置')

/* 将 YYYYMMDD 数字转为可读日期 */
function formatDate(dateNum: number): string {
  const s = String(dateNum)
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

/* 4个阶段指标卡片数据 */
const stageCards = computed(() => {
  if (!hasData.value) return []
  const ev = events.value
  return [
    {
      label: '营养生长期',
      icon: Sprout,
      color: 'border-green-500',
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      event: ev.find(e => e.name === '营养生长期'),
    },
    {
      label: '花芽分化~开花',
      icon: Flower2,
      color: 'border-yellow-500',
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      event: ev.find(e => e.name === '花芽分化期') || ev.find(e => e.name === '开花期'),
    },
    {
      label: '第一茬果',
      icon: Apple,
      color: 'border-red-500',
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      event: ev.find(e => e.name === '果实膨大期') || ev.find(e => e.name === '结果期'),
    },
    {
      label: '采收结束',
      icon: Flag,
      color: 'border-purple-500',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      event: ev.find(e => e.name === '采收期') || ev[ev.length - 1],
    },
  ]
})

/* 关键节点时间线 */
const keyNodes = computed(() => {
  if (!hasData.value) return []
  const nodeNames = ['定植', '花芽分化', '始花', '坐果', '第一茬采收', '高峰', '拉秧']
  const evMap = new Map(events.value.map(e => [e.name, e]))
  return nodeNames.map((name, i) => {
    const ev = evMap.get(name) || events.value[i]
    return {
      label: name,
      date: ev ? formatDate(ev.startDate) : '-',
      order: i + 1,
    }
  })
})

/* 甘特图选项 */
const ganttOption = computed(() => ganttTimelineOption(events.value))

/* 参数表数据 */
const tableRows = computed(() => {
  if (!hasData.value) return []
  return events.value.map(ev => ({
    name: ev.name,
    start: formatDate(ev.startDate),
    end: formatDate(ev.endDate),
    duration: ev.duration,
    avgTemp: ev.envRequirements?.match(/(\d+\.?\d*)\s*°C/)?.[1] ?? '-',
    dayLength: ev.envRequirements?.match(/(\d+\.?\d*)\s*hr/)?.[1] ?? '-',
  }))
})

/* 品种特性说明 */
const cultivarTip = computed(() => {
  const name = cultivarName.value
  if (name === '未选择') return '请先在基础信息页选择品种，系统将基于品种特性生成物候预测。'
  return `${name}：基于品种积温需求和光周期响应特性，结合区域气象数据预测各物候阶段时间节点。实际物候可能因田间管理、微气候差异而有所偏差，建议结合田间观测校准。`
})
</script>

<template>
  <div class="space-y-6">
    <!-- 头部 -->
    <div class="flex items-center gap-3 flex-wrap">
      <h2 class="v2-section-title mb-0">物候方案</h2>
      <span class="bg-strawberry-500/20 text-strawberry-300 rounded-full px-3 py-1 text-xs font-medium">
        {{ cultivarName }}·{{ plantingDate }}定植
      </span>
    </div>
    <p class="text-sm text-midnight-400 -mt-3">基于积温模型 + 光周期响应预测的全年物候时间轴</p>

    <!-- 空状态 -->
    <div v-if="!hasData" class="glass-card p-12 text-center">
      <Info :size="48" class="mx-auto mb-4 text-midnight-500" />
      <p class="text-midnight-300 mb-2">暂无物候数据</p>
      <p class="text-sm text-midnight-400">请先完成品种选择和模拟运行，系统将自动生成物候预测时间轴</p>
    </div>

    <template v-else>
      <!-- 4个阶段指标卡片 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="card in stageCards"
          :key="card.label"
          class="glass-card p-4 border-l-4 flex items-start gap-3"
          :class="card.color"
        >
          <div class="rounded-lg p-2 shrink-0" :class="card.bg">
            <component :is="card.icon" :size="20" :class="card.text" />
          </div>
          <div class="min-w-0">
            <p class="text-xs text-midnight-400 mb-1">{{ card.label }}</p>
            <p class="text-xl font-bold font-heading text-midnight-50">
              {{ card.event?.duration ?? '-' }}<span class="text-sm font-normal text-midnight-300 ml-1">天</span>
            </p>
            <p class="text-xs text-midnight-300 mt-1 truncate">
              {{ card.event ? formatDate(card.event.startDate) : '-' }} ~ {{ card.event ? formatDate(card.event.endDate) : '-' }}
            </p>
          </div>
        </div>
      </div>

      <!-- 甘特图时间轴 -->
      <div class="glass-card p-4">
        <h3 class="text-sm font-medium text-midnight-200 mb-3">全生育期时间轴</h3>
        <VChart :option="ganttOption" autoresize style="height: 320px" />
      </div>

      <!-- 关键节点时间线 -->
      <div class="glass-card p-5">
        <h3 class="text-sm font-medium text-midnight-200 mb-5">关键物候节点</h3>
        <div class="relative overflow-x-auto">
          <!-- 横线 -->
          <div class="absolute top-3 left-0 right-0 h-0.5 bg-midnight-600/50"></div>
          <div class="flex items-start justify-between gap-2 relative min-w-max">
            <div
              v-for="node in keyNodes"
              :key="node.order"
              class="flex flex-col items-center w-24 shrink-0"
            >
              <!-- 圆点 -->
              <div class="w-6 h-6 rounded-full bg-midnight-800 border-2 border-strawberry-500 flex items-center justify-center z-10 relative">
                <span class="text-[10px] text-strawberry-300">⭐</span>
              </div>
              <!-- 标签 -->
              <p class="text-xs font-medium text-midnight-100 mt-2 text-center">
                {{ node.order }}{{ node.label }}
              </p>
              <p class="text-[10px] text-midnight-400 mt-0.5 text-center">{{ node.date }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 各物候阶段参数表 -->
      <div class="glass-card p-4 overflow-x-auto">
        <h3 class="text-sm font-medium text-midnight-200 mb-3">物候阶段参数</h3>
        <table class="v2-table">
          <thead>
            <tr>
              <th>阶段</th>
              <th>起始日期</th>
              <th>结束日期</th>
              <th>天数</th>
              <th>日均温 °C</th>
              <th>日长 hr</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in tableRows" :key="row.name">
              <td class="font-medium text-midnight-100">{{ row.name }}</td>
              <td>{{ row.start }}</td>
              <td>{{ row.end }}</td>
              <td>{{ row.duration }}</td>
              <td>{{ row.avgTemp }}</td>
              <td>{{ row.dayLength }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 底部黄色提示框 -->
      <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <p class="text-sm text-amber-200">
          💡 {{ cultivarTip }}
        </p>
      </div>
    </template>
  </div>
</template>
