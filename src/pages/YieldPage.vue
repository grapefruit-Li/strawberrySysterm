<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'
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
  PieChart,
  Info,
} from 'lucide-vue-next'

const simulation = useSimulationStore()
const config = useConfigStore()
const { exportResults } = useSimulation()
const { donutChartOption, createLightLineChartOption, colors } = useChart()

const dailyOutputs = computed<DailyOutput[]>(() => {
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

/* 关键指标卡片 */
const keyMetrics = computed(() => {
  const totalYield = Math.round(simulation.yieldResult.totalFruitWeight)
  const density = config.plantingDensity || 10000
  const plantsPerHa = density
  const perPlant = totalYield > 0 ? Math.round(totalYield * 1000 / plantsPerHa) : 0
  const cultivar = config.selectedCultivarFull
  const firstRatio = cultivar?.firstFlushRatio ?? 0.6
  const secondRatio = cultivar?.secondFlushRatio ?? 0.4
  const firstYield = Math.round(totalYield * firstRatio / 1000)
  const secondYield = Math.round(totalYield * secondRatio / 1000)

  return [
    {
      label: '鲜果总产',
      value: `${totalYield} t/ha`,
      sub: `≈ ${perPlant} g/株`,
      accent: 'v2-accent-red',
      icon: TrendingUp,
    },
    {
      label: '单果重',
      value: `${cultivar?.keyParams.avgFruitWeight ?? 22} g`,
      sub: `一级果 ≥${Math.round((cultivar?.keyParams.avgFruitWeight ?? 22) * 0.8)}g`,
      accent: 'v2-accent-orange',
      icon: Weight,
    },
    {
      label: '第一茬占比',
      value: `${Math.round(firstRatio * 100)}%`,
      sub: '品质最佳期',
      accent: 'v2-accent-green',
      icon: PieChart,
    },
    {
      label: '采收天数',
      value: `${simulation.qualityResults.length || 80} 天`,
      sub: `${cultivar?.name ?? ''} 起`,
      accent: 'v2-accent-blue',
      icon: CalendarDays,
    },
  ]
})

/* 预测逐日产量折线图 */
const dailyYieldOption = computed(() => {
  if (dailyOutputs.value.length === 0) {
    return createLightLineChartOption('预测逐日产量', [], [])
  }

  function formatDate(dateNum: number): string {
    const s = String(dateNum)
    return `${s.slice(4, 6)}-${s.slice(6, 8)}`
  }

  const dates = dailyOutputs.value.map(d => formatDate(d.day))
  const dailyYield = dailyOutputs.value.map(d => d.fruitWt > 0 ? Math.round(d.fruitWt * 0.12 * 10) / 10 : 0)

  return {
    ...createLightLineChartOption('预测逐日产量', dates, []),
    series: [{
      name: '日产量',
      type: 'line' as const,
      data: dailyYield,
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
    yAxis: [{
      type: 'value' as const,
      name: 'kg/ha/天',
      axisLine: { lineStyle: { color: '#D1D5DB' } },
      axisLabel: { color: '#6B7280' },
      splitLine: { lineStyle: { color: '#F3F4F6' } },
    }],
  }
})

/* 第一/二茬占比环形图 */
const donutOption = computed(() => {
  const cultivar = config.selectedCultivarFull
  const firstRatio = cultivar?.firstFlushRatio ?? 0.6
  const secondRatio = cultivar?.secondFlushRatio ?? 0.4
  const totalYield = Math.round(simulation.yieldResult.totalFruitWeight / 1000)

  const firstYield = Math.round(totalYield * firstRatio)
  const secondYield = Math.round(totalYield * secondRatio)

  return donutChartOption([
    { name: '第一茬', value: firstYield, color: '#EF4444' },
    { name: '第二茬', value: secondYield, color: '#FBBF24' },
  ])
})

/* 产量详细预测表 */
const yieldDetailTable = computed(() => {
  const totalYield = Math.round(simulation.yieldResult.totalFruitWeight / 1000)
  const density = config.plantingDensity || 10000
  const plantsPerHa = density
  const plantsPerM2 = density / 10000
  const cultivar = config.selectedCultivarFull
  const avgFruit = cultivar?.keyParams.avgFruitWeight ?? 22
  const firstRatio = cultivar?.firstFlushRatio ?? 0.6
  const secondRatio = cultivar?.secondFlushRatio ?? 0.4
  const firstYield = Math.round(totalYield * firstRatio * 10) / 10
  const secondYield = Math.round(totalYield * secondRatio * 10) / 10
  const fruitPerPlant = totalYield > 0 ? Math.round(totalYield * 1000 * 1000 / avgFruit / plantsPerHa) : 0
  const fruitPerM2 = Math.round(fruitPerPlant * plantsPerM2)
  const harvestDays = simulation.qualityResults.length || 80
  const harvestStart = harvests.value.length > 0
    ? harvests.value[0].date
    : '-'

  return [
    { label: '鲜果总产 (t/ha)', value: `${totalYield}`, note: '' },
    { label: '单株产量 (g)', value: `${totalYield > 0 ? Math.round(totalYield * 1000 * 1000 / plantsPerHa) : '-'}`, note: `密度 ${plantsPerM2.toFixed(1)} 株/m²` },
    { label: '单果重 (g)', value: `${avgFruit}`, note: '商品果标准' },
    { label: '果数/株', value: `${fruitPerPlant}`, note: '' },
    { label: '果数/m²', value: `${fruitPerM2}`, note: '' },
    { label: '第一茬果 (t/ha)', value: `${firstYield}`, note: `约${Math.round(firstRatio * 100)}%` },
    { label: '第二茬果 (t/ha)', value: `${secondYield}`, note: `约${Math.round(secondRatio * 100)}%` },
    { label: '第一茬起始', value: harvestStart !== '-' ? String(harvestStart).slice(4, 6) + '/' + String(harvestStart).slice(6, 8) : '-', note: `定植后${harvestDays}天` },
    { label: '采收高峰', value: '-', note: '日产量最大' },
  ]
})

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
      class="v2-card p-12 text-center"
    >
      <TrendingUp :size="48" class="mx-auto text-midnight-400 mb-4" />
      <h3 class="text-xl text-midnight-300 mb-2">尚未运行模拟</h3>
      <p class="text-midnight-300">请先在基础信息页面完成配置并生成方案</p>
    </div>

    <template v-else>
      <!-- 顶部关键指标卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="(metric, idx) in keyMetrics"
          :key="metric.label"
          class="v2-stat-card"
        >
          <div :class="['absolute top-0 left-0 right-0 h-1', metric.accent]"></div>
          <div class="flex items-center gap-2 mb-1">
            <component :is="metric.icon" :size="14" class="text-midnight-300" />
            <span class="text-xs text-midnight-300 uppercase tracking-wider">{{ metric.label }}</span>
          </div>
          <span class="text-2xl font-bold text-midnight-100">{{ metric.value }}</span>
          <span class="text-xs text-midnight-400 mt-1">{{ metric.sub }}</span>
        </div>
      </div>

      <!-- 预测逐日产量 + 第一/二茬占比 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 预测逐日产量折线图 -->
        <div class="v2-card p-5">
          <h2 class="v2-section-title flex items-center gap-2">
            <TrendingUp :size="18" class="text-red-500" />
            预测逐日产量
          </h2>
          <v-chart
            :option="dailyYieldOption"
            autoresize
            class="w-full h-80"
          />
        </div>

        <!-- 第一/二茬占比环形图 -->
        <div class="v2-card p-5">
          <h2 class="v2-section-title flex items-center gap-2">
            <PieChart :size="18" class="text-amber-500" />
            第一/二茬占比
          </h2>
          <v-chart
            :option="donutOption"
            autoresize
            class="w-full h-80"
          />
        </div>
      </div>

      <!-- 产量详细预测表 -->
      <div class="v2-card p-5">
        <h2 class="v2-section-title flex items-center gap-2">
          <BarChart3 :size="18" class="text-purple-500" />
          产量详细预测
        </h2>
        <div class="overflow-x-auto">
          <table class="v2-table">
            <thead>
              <tr>
                <th class="v2-table th">指标</th>
                <th class="v2-table th text-center">预测值</th>
                <th class="v2-table th">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in yieldDetailTable"
                :key="idx"
                class="border-b border-gray-100"
                :class="idx % 2 === 0 ? 'bg-white' : 'bg-midnight-800/80'"
              >
                <td class="py-2 px-3 text-midnight-200 font-medium">{{ row.label }}</td>
                <td class="py-2 px-3 text-center text-midnight-100 font-bold">{{ row.value }}</td>
                <td class="py-2 px-3 text-midnight-300 text-sm">{{ row.note }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 底部导出按钮 -->
      <div class="flex justify-center gap-4">
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-lg border border-midnight-600/40 text-midnight-300 hover:bg-midnight-800/80 transition-all duration-200"
          @click="exportAs('csv')"
        >
          <FileSpreadsheet :size="16" />
          导出 CSV
        </button>
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-lg border border-midnight-600/40 text-midnight-300 hover:bg-midnight-800/80 transition-all duration-200"
          @click="exportAs('json')"
        >
          <FileJson :size="16" />
          导出 JSON
        </button>
      </div>
    </template>
  </div>
</template>
