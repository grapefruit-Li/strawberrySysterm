<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useChart } from '@/composables/useChart'
import VChart from 'vue-echarts'
import {
  Play,
  Pause,
  RotateCcw,
  CalendarDays,
  Sprout,
  Leaf,
  Scale,
  Cherry,
  Droplets,
  FlaskConical,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-vue-next'

const simulation = useSimulationStore()
const { createLineChartOption, colors } = useChart()

/* LAI 趋势图表选项 */
const laiChartOption = computed(() => {
  if (simulation.results.length === 0) {
    return createLineChartOption('LAI 趋势', [], [])
  }
  const xData = simulation.results.map(r => r.date)
  const laiData = simulation.results.map(r => r.lai)
  return createLineChartOption('LAI 趋势', xData, [
    { name: 'LAI', data: laiData, color: colors.forest },
  ])
})

/* 事件日志图标 */
function getLogIcon(type: string) {
  switch (type) {
    case 'warning': return AlertTriangle
    case 'success': return CheckCircle2
    default: return Info
  }
}

/* 事件日志颜色 */
function getLogColor(type: string) {
  switch (type) {
    case 'warning': return 'text-amber-500'
    case 'success': return 'text-forest-400'
    default: return 'text-blue-400'
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <h2 class="section-title">模拟运行</h2>

    <!-- 控制面板 -->
    <div class="glass-card p-5">
      <div class="flex flex-wrap items-center gap-4">
        <!-- 控制按钮 -->
        <div class="flex items-center gap-2">
          <button
            v-if="simulation.status === 'idle' || simulation.status === 'paused'"
            class="strawberry-btn flex items-center gap-2"
            @click="simulation.status === 'idle' ? simulation.startSimulation() : simulation.resumeSimulation()"
          >
            <Play :size="16" />
            {{ simulation.status === 'idle' ? '开始' : '继续' }}
          </button>
          <button
            v-if="simulation.status === 'running'"
            class="ghost-btn flex items-center gap-2 border-amber-500/40 text-amber-400"
            @click="simulation.pauseSimulation()"
          >
            <Pause :size="16" />
            暂停
          </button>
          <button
            v-if="simulation.status !== 'idle'"
            class="ghost-btn flex items-center gap-2"
            @click="simulation.resetSimulation()"
          >
            <RotateCcw :size="16" />
            重置
          </button>
        </div>

        <!-- 速度控制 -->
        <div class="flex items-center gap-2 ml-auto">
          <span class="text-xs text-midnight-400">速度</span>
          <input
            v-model.number="simulation.speed"
            type="range"
            min="1"
            max="10"
            class="w-24 accent-strawberry-500"
          />
          <span class="text-xs text-midnight-300 w-8">{{ simulation.speed }}x</span>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="mt-4">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs text-midnight-400">模拟进度</span>
          <span class="text-xs text-midnight-300">{{ simulation.progress }}%</span>
        </div>
        <div class="h-2 bg-midnight-700 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-strawberry-600 to-strawberry-400 rounded-full transition-all duration-500"
            :style="{ width: simulation.progress + '%' }"
          />
        </div>
      </div>
    </div>

    <!-- 统计卡片网格 -->
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      <div class="stat-card">
        <div class="stat-label flex items-center gap-1">
          <CalendarDays :size="12" />
          当前天数
        </div>
        <div class="stat-value">{{ simulation.currentDay }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label flex items-center gap-1">
          <Sprout :size="12" />
          生育阶段
        </div>
        <div class="stat-value text-base">{{ simulation.currentGrowthStage }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label flex items-center gap-1">
          <Leaf :size="12" />
          LAI
        </div>
        <div class="stat-value">{{ simulation.currentLai }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label flex items-center gap-1">
          <Scale :size="12" />
          总生物量
        </div>
        <div class="stat-value">{{ simulation.currentBiomass }}</div>
        <div class="text-xs text-midnight-400">kg/ha</div>
      </div>
      <div class="stat-card">
        <div class="stat-label flex items-center gap-1">
          <Cherry :size="12" />
          果实重
        </div>
        <div class="stat-value text-strawberry-400">{{ simulation.currentFruitWeight }}</div>
        <div class="text-xs text-midnight-400">kg/ha</div>
      </div>
      <div class="stat-card">
        <div class="stat-label flex items-center gap-1">
          <Droplets :size="12" />
          水分胁迫
        </div>
        <div class="stat-value" :class="Number(simulation.currentWaterStress) > 0.2 ? 'text-amber-400' : 'text-forest-400'">
          {{ simulation.currentWaterStress }}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label flex items-center gap-1">
          <FlaskConical :size="12" />
          氮素胁迫
        </div>
        <div class="stat-value" :class="Number(simulation.currentNitrogenStress) > 0.2 ? 'text-amber-400' : 'text-forest-400'">
          {{ simulation.currentNitrogenStress }}
        </div>
      </div>
    </div>

    <!-- 图表和日志 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- LAI 趋势图 -->
      <div class="lg:col-span-2 glass-card p-4">
        <v-chart
          v-if="simulation.results.length > 0"
          :option="laiChartOption"
          autoresize
          style="height: 300px"
        />
        <div v-else class="h-[300px] flex items-center justify-center text-midnight-400">
          <div class="text-center">
            <Leaf :size="32" class="mx-auto mb-2 opacity-50" />
            <p class="text-sm">运行模拟后显示 LAI 趋势图</p>
          </div>
        </div>
      </div>

      <!-- 事件日志 -->
      <div class="glass-card p-4 flex flex-col">
        <h3 class="text-sm font-semibold text-midnight-200 mb-3">事件日志</h3>
        <div class="flex-1 overflow-y-auto space-y-2 max-h-[260px]">
          <div
            v-for="(log, idx) in simulation.eventLog"
            :key="idx"
            class="flex items-start gap-2 p-2 rounded-lg bg-midnight-700/30"
          >
            <component :is="getLogIcon(log.type)" :size="14" :class="getLogColor(log.type)" class="mt-0.5 shrink-0" />
            <div class="min-w-0">
              <p class="text-xs text-midnight-200">{{ log.message }}</p>
              <p class="text-xs text-midnight-500">{{ log.time }}</p>
            </div>
          </div>
          <div v-if="simulation.eventLog.length === 0" class="text-center py-8 text-midnight-400">
            <Info :size="24" class="mx-auto mb-2 opacity-50" />
            <p class="text-sm">暂无事件</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
