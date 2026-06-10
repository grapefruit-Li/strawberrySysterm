<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'
import { useChart } from '@/composables/useChart'
import VChart from 'vue-echarts'
import { TrendingUp, ListOrdered } from 'lucide-vue-next'

const simulation = useSimulationStore()
const config = useConfigStore()
const { yieldCurveOption, donutChartOption } = useChart()

/* 是否有数据 */
const hasData = computed(() => simulation.results.length > 0)

/* 品种信息 */
const cultivarName = computed(() => config.selectedCultivarFull?.name ?? config.cultivarName ?? '-')
const firstFlushRatio = computed(() => config.selectedCultivarFull?.firstFlushRatio ?? 0.6)
const secondFlushRatio = computed(() => config.selectedCultivarFull?.secondFlushRatio ?? 0.4)

/* 预估总产 t/ha */
const totalYieldTha = computed(() => {
  const kg = simulation.yieldResult.totalFruitWeight
  return (kg / 1000).toFixed(1)
})

/* 关键指标卡片 */
const keyMetrics = computed(() => {
  const totalKg = simulation.yieldResult.totalFruitWeight
  const totalTha = (totalKg / 1000).toFixed(1)
  const density = config.plantingDensity || 10000
  const avgFruit = config.selectedCultivarFull?.keyParams?.avgFruitWeight ?? simulation.yieldResult.avgFruitWeight ?? 22
  const firstRatio = firstFlushRatio.value
  const harvestDays = simulation.qualityResults.length || simulation.results.filter(r => r.fruitWeight > 0).length || 80

  return [
    {
      label: '鲜果总产',
      value: `${totalTha} t/ha`,
      borderClass: 'border-l-4 border-forest-400',
      textClass: 'text-forest-400',
    },
    {
      label: '单果重',
      value: `${avgFruit} g`,
      borderClass: 'border-l-4 border-amber-600',
      textClass: 'text-amber-600',
    },
    {
      label: '第一茬占比',
      value: `${Math.round(firstRatio * 100)}%`,
      borderClass: 'border-l-4 border-orange-400',
      textClass: 'text-orange-400',
    },
    {
      label: '采收天数',
      value: `${harvestDays} 天`,
      borderClass: 'border-l-4 border-purple-400',
      textClass: 'text-purple-400',
    },
  ]
})

/* 逐日产量折线图 */
const yieldLineOption = computed(() => {
  if (!hasData.value) {
    return {
      backgroundColor: 'transparent',
      xAxis: { type: 'category' as const, data: [] },
      yAxis: { type: 'value' as const },
      series: [],
    }
  }

  const fruitDays = simulation.results.filter(r => r.fruitWeight > 0)
  const dates = fruitDays.map(r => r.date.slice(5))
  const dailyYield = fruitDays.map(r => Math.round(r.fruitWeight * 0.12 * 10) / 10)

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(26, 27, 46, 0.9)',
      borderColor: 'rgba(45, 49, 66, 0.5)',
      textStyle: { color: '#F3F4F6' },
    },
    grid: { left: 60, right: 30, top: 30, bottom: 40 },
    xAxis: {
      type: 'category' as const,
      data: dates,
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9CA3AF', fontSize: 11 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      name: 'kg/ha',
      nameTextStyle: { color: '#9CA3AF' },
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9CA3AF' },
      splitLine: { lineStyle: { color: 'rgba(55, 65, 81, 0.5)' } },
    },
    series: [
      {
        name: '日产量',
        type: 'line' as const,
        data: dailyYield,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, color: '#E63946' },
        itemStyle: { color: '#E63946' },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#E6394630' },
              { offset: 1, color: '#E6394605' },
            ],
          },
        },
      },
    ],
  }
})

/* 第一/二茬占比环形图 */
const donutOption = computed(() => {
  const totalKg = simulation.yieldResult.totalFruitWeight
  const totalTha = totalKg / 1000
  const firstYield = Math.round(totalTha * firstFlushRatio.value * 10) / 10
  const secondYield = Math.round(totalTha * secondFlushRatio.value * 10) / 10

  return donutChartOption([
    { name: '第一茬', value: firstYield, color: '#E63946' },
    { name: '第二茬', value: secondYield, color: '#F59E0B' },
  ])
})

/* 产量详细预测表 */
const yieldDetailTable = computed(() => {
  const totalKg = simulation.yieldResult.totalFruitWeight
  const totalTha = (totalKg / 1000).toFixed(1)
  const density = config.plantingDensity || 10000
  const plantsPerM2 = density / 10000
  const avgFruit = config.selectedCultivarFull?.keyParams?.avgFruitWeight ?? simulation.yieldResult.avgFruitWeight ?? 22
  const firstRatio = firstFlushRatio.value
  const secondRatio = secondFlushRatio.value
  const firstYield = (Number(totalTha) * firstRatio).toFixed(1)
  const secondYield = (Number(totalTha) * secondRatio).toFixed(1)
  const perPlant = totalKg > 0 ? Math.round(totalKg * 1000 / density) : '-'
  const fruitPerPlant = totalKg > 0 ? Math.round(totalKg * 1000 * 1000 / avgFruit / density) : '-'
  const fruitPerM2 = fruitPerPlant !== '-' ? Math.round(Number(fruitPerPlant) * plantsPerM2) : '-'

  /* 第一茬起始日期 - 从物候事件或采收数据中获取 */
  const harvestStart = simulation.yieldResult.harvestDate !== '-'
    ? simulation.yieldResult.harvestDate
    : '-'

  /* 采收高峰 - 日产量最大的日期 */
  const fruitDays = simulation.results.filter(r => r.fruitWeight > 0)
  let peakDate = '-'
  if (fruitDays.length > 0) {
    const peak = fruitDays.reduce((max, r) => r.fruitWeight > max.fruitWeight ? r : max, fruitDays[0])
    peakDate = peak.date
  }

  return [
    { label: '鲜果总产 (t/ha)', value: totalTha, note: '全生育期鲜果总产量' },
    { label: '单株产量 (g)', value: perPlant, note: `密度 ${plantsPerM2.toFixed(1)} 株/m²` },
    { label: '单果重 (g)', value: avgFruit, note: '平均单果鲜重' },
    { label: '果数/株', value: fruitPerPlant, note: '单株累计结果数' },
    { label: '果数/m²', value: fruitPerM2, note: '单位面积结果数' },
    { label: '第一茬果 (t/ha)', value: firstYield, note: `约${Math.round(firstRatio * 100)}%` },
    { label: '第二茬果 (t/ha)', value: secondYield, note: `约${Math.round(secondRatio * 100)}%` },
    { label: '第一茬起始', value: harvestStart !== '-' ? harvestStart.slice(5) : '-', note: '第一茬采收开始日期' },
    { label: '采收高峰', value: peakDate !== '-' ? peakDate.slice(5) : '-', note: '产量最高时期' },
  ]
})
</script>

<template>
  <div class="space-y-6">
    <!-- 无数据提示 -->
    <div
      v-if="!hasData"
      class="glass-card p-12 text-center"
    >
      <TrendingUp :size="48" class="mx-auto mb-4 text-midnight-500" />
      <p class="text-midnight-300 mb-2">尚未运行模拟</p>
      <p class="text-sm text-midnight-400">请先完成配置并运行模拟以查看产量预测</p>
    </div>

    <template v-else>
      <!-- 1. 顶部标题区 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <TrendingUp :size="24" class="text-strawberry-400" />
          <div>
            <h1 class="text-xl font-heading text-midnight-50">产量预测</h1>
            <p class="text-sm text-midnight-400">基于品种潜力和环境条件的产量预估</p>
          </div>
        </div>
        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-strawberry-500/20 text-strawberry-300">
          {{ cultivarName }} · 预估 {{ totalYieldTha }} t/ha
        </span>
      </div>

      <!-- 2. 关键指标卡片区 -->
      <div class="grid grid-cols-4 gap-4">
        <div
          v-for="metric in keyMetrics"
          :key="metric.label"
          class="glass-card p-4"
          :class="metric.borderClass"
        >
          <p class="text-xs text-midnight-400 uppercase tracking-wider mb-1">{{ metric.label }}</p>
          <p class="text-2xl font-bold font-heading" :class="metric.textClass">{{ metric.value }}</p>
        </div>
      </div>

      <!-- 3. 图表展示区 -->
      <div class="grid grid-cols-2 gap-6">
        <!-- 左侧 - 折线图：预测逐日产量 -->
        <div class="glass-card p-5">
          <h2 class="v2-section-title flex items-center gap-2">
            <TrendingUp :size="18" class="text-strawberry-400" />
            预测逐日产量
          </h2>
          <v-chart
            :option="yieldLineOption"
            autoresize
            class="w-full h-80"
          />
        </div>

        <!-- 右侧 - 环形图：第一/二茬占比 -->
        <div class="glass-card p-5">
          <h2 class="v2-section-title flex items-center gap-2">
            <ListOrdered :size="18" class="text-amber-400" />
            第一/二茬占比
          </h2>
          <v-chart
            :option="donutOption"
            autoresize
            class="w-full h-80"
          />
        </div>
      </div>

      <!-- 4. 产量详细预测表格区 -->
      <div class="glass-card p-5">
        <h2 class="v2-section-title flex items-center gap-2">
          <ListOrdered :size="18" class="text-purple-400" />
          产量详细预测
        </h2>
        <div class="overflow-x-auto">
          <table class="v2-table">
            <thead>
              <tr>
                <th class="text-left">指标</th>
                <th class="text-center">预测值</th>
                <th class="text-left">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in yieldDetailTable" :key="idx">
                <td class="font-medium text-midnight-100">{{ row.label }}</td>
                <td class="text-center font-bold text-midnight-50">{{ row.value }}</td>
                <td class="text-midnight-400 text-sm">{{ row.note }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
