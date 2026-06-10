<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useSimulation } from '@/composables/useSimulation'
import { useChart } from '@/composables/useChart'
import type { DailyOutput, HarvestRecord } from '@/engine/types'
import VChart from 'vue-echarts'
import {
  TrendingUp,
  Weight,
  CalendarDays,
  Thermometer,
  Download,
  FileJson,
  FileSpreadsheet,
  BarChart3,
} from 'lucide-vue-next'

const simulation = useSimulationStore()
const { exportResults } = useSimulation()
const { yieldCurveOption, qualityScatterOption, createBarChartOption, colors } = useChart()

/* 模拟结果 */
const dailyOutputs = computed<DailyOutput[]>(() => {
  /* 从store的results转换为DailyOutput格式（简化） */
  return simulation.results.map(r => ({
    day: parseInt(r.date) || 0,
    das: r.day,
    lai: r.lai,
    biomass: r.totalBiomass,
    leafWt: r.leafWeight,
    stemWt: r.stemWeight,
    rootWt: r.rootWeight,
    fruitWt: r.fruitWeight,
    swfac: r.waterStress,
    nstres: r.nitrogenStress,
    tfac: 1.0,
    stage: 0,
    gdd: Math.round(r.totalBiomass * 0.1),
    rootDepth: 30,
    rain: r.rain,
    irrig: 0,
    et: 3,
    runoff: 0,
    drainage: 0,
    tmax: r.tmax,
    tmin: r.tmin,
    srad: r.srad,
    activeTrusses: 0,
    fruitNum: 0,
    carbh2o: 0,
    plantN: 0,
  }))
})

/* 收获记录 - 从品质预测数据构建 */
const harvests = computed<HarvestRecord[]>(() => {
  return simulation.qualityResults.map(q => ({
    date: parseInt(q.date.replace(/-/g, '')) || 0,
    freshWt: simulation.yieldResult.totalFruitWeight / Math.max(1, simulation.qualityResults.length),
    dryWt: simulation.yieldResult.totalFruitWeight / Math.max(1, simulation.qualityResults.length) * 0.12,
    fruitNum: Math.round(simulation.yieldResult.fruitCount / Math.max(1, simulation.qualityResults.length)),
    ssc: q.ssc,
    acidity: q.acidity,
    firmness: q.firmness,
  }))
})

/* 关键指标 */
const keyMetrics = computed(() => [
  {
    label: '预计总产量',
    value: `${Math.round(simulation.yieldResult.totalFruitWeight)} kg/ha`,
    icon: TrendingUp,
    color: 'text-strawberry-400',
  },
  {
    label: '预计单果重',
    value: `${simulation.yieldResult.avgFruitWeight}g`,
    icon: Weight,
    color: 'text-forest-400',
  },
  {
    label: '采收天数',
    value: `${simulation.qualityResults.length}天`,
    icon: CalendarDays,
    color: 'text-amber-400',
  },
  {
    label: '平均SSC',
    value: simulation.qualityResults.length > 0
      ? `${(simulation.qualityResults.reduce((s, q) => s + q.ssc, 0) / simulation.qualityResults.length).toFixed(1)}%`
      : '-',
    icon: Thermometer,
    color: 'text-purple-400',
  },
])

/* 产量曲线图选项 */
const yieldOption = computed(() => yieldCurveOption(dailyOutputs.value, harvests.value))

/* 产量分布图选项 - 按月统计 */
const yieldDistOption = computed(() => {
  if (simulation.qualityResults.length === 0) {
    return createBarChartOption('产量分布', [], [])
  }

  /* 按月聚合 */
  const monthMap = new Map<string, number>()
  for (const q of simulation.qualityResults) {
    const month = q.date.slice(0, 7) // YYYY-MM
    monthMap.set(month, (monthMap.get(month) || 0) + simulation.yieldResult.totalFruitWeight / simulation.qualityResults.length)
  }

  const months = [...monthMap.keys()].sort()
  const values = months.map(m => Math.round(monthMap.get(m)!))

  return createBarChartOption('月度产量分布', months, [
    { name: '产量 (kg/ha)', data: values, color: colors.strawberry },
  ])
})

/* 品质散点图选项 */
const qualityOption = computed(() => qualityScatterOption(harvests.value))

/* 导出格式 */
function exportAs(format: 'json' | 'csv') {
  const content = exportResults(format)
  const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `yield-report.${format}`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="space-y-6">
    <!-- 无数据提示 -->
    <div
      v-if="simulation.status === 'idle'"
      class="glass-card p-12 text-center"
    >
      <TrendingUp :size="48" class="mx-auto text-midnight-500 mb-4" />
      <h3 class="font-heading text-xl text-midnight-300 mb-2">尚未运行模拟</h3>
      <p class="text-midnight-500">请先在基础信息页面完成配置并生成方案</p>
    </div>

    <template v-else>
      <!-- 顶部关键指标卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="metric in keyMetrics"
          :key="metric.label"
          class="stat-card"
        >
          <div class="flex items-center gap-2 mb-1">
            <component :is="metric.icon" :size="14" :class="metric.color" />
            <span class="stat-label">{{ metric.label }}</span>
          </div>
          <span class="stat-value text-lg">{{ metric.value }}</span>
        </div>
      </div>

      <!-- 逐日产量曲线 -->
      <div class="glass-card p-5">
        <h2 class="section-title">逐日产量曲线</h2>
        <v-chart
          :option="yieldOption"
          autoresize
          class="w-full h-80"
        />
      </div>

      <!-- 产量分布 + 品质预测 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 产量分布图 -->
        <div class="glass-card p-5">
          <h2 class="section-title">产量分布图</h2>
          <v-chart
            :option="yieldDistOption"
            autoresize
            class="w-full h-72"
          />
        </div>

        <!-- 品质预测图 -->
        <div class="glass-card p-5">
          <h2 class="section-title">品质预测图</h2>
          <v-chart
            :option="qualityOption"
            autoresize
            class="w-full h-72"
          />
        </div>
      </div>

      <!-- 品质详细数据表 -->
      <div class="glass-card p-5">
        <h2 class="section-title flex items-center gap-2">
          <BarChart3 :size="18" class="text-purple-400" />
          品质数据明细
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-midnight-600/30">
                <th class="text-left py-2 px-3 text-midnight-400 font-medium">日期</th>
                <th class="text-right py-2 px-3 text-midnight-400 font-medium">SSC (%)</th>
                <th class="text-right py-2 px-3 text-midnight-400 font-medium">酸度 (%)</th>
                <th class="text-right py-2 px-3 text-midnight-400 font-medium">硬度 (N)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(q, i) in simulation.qualityResults"
                :key="i"
                class="border-b border-midnight-600/10 hover:bg-midnight-800/30"
              >
                <td class="py-1.5 px-3 text-midnight-200">{{ q.date }}</td>
                <td class="py-1.5 px-3 text-right text-midnight-200">{{ q.ssc.toFixed(1) }}</td>
                <td class="py-1.5 px-3 text-right text-midnight-200">{{ q.acidity.toFixed(2) }}</td>
                <td class="py-1.5 px-3 text-right text-midnight-200">{{ q.firmness.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 底部导出按钮 -->
      <div class="flex justify-center gap-4">
        <button
          class="ghost-btn flex items-center gap-2"
          @click="exportAs('csv')"
        >
          <FileSpreadsheet :size="16" />
          导出 CSV
        </button>
        <button
          class="ghost-btn flex items-center gap-2"
          @click="exportAs('json')"
        >
          <FileJson :size="16" />
          导出 JSON
        </button>
      </div>
    </template>
  </div>
</template>
