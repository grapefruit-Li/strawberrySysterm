<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useChart } from '@/composables/useChart'
import { useFileParser } from '@/composables/useFileParser'
import VChart from 'vue-echarts'
import { Download, FileJson, FileSpreadsheet } from 'lucide-vue-next'

const simulation = useSimulationStore()
const { createLineChartOption, createBarChartOption, createScatterChartOption, colors } = useChart()
const { exportConfig, exportCSV } = useFileParser()

/* 当前激活的标签页 */
const activeTab = ref<'growth' | 'yield' | 'quality' | 'compare'>('growth')

/* 生长曲线图表选项 */
const growthChartOption = computed(() => {
  if (simulation.results.length === 0) return createLineChartOption('生长曲线', [], [])
  const xData = simulation.results.map(r => r.date)
  return createLineChartOption('生长曲线', xData, [
    { name: 'LAI', data: simulation.results.map(r => r.lai), color: colors.forest },
    { name: '总生物量', data: simulation.results.map(r => r.totalBiomass / 100), color: colors.strawberry },
    { name: '叶片重', data: simulation.results.map(r => r.leafWeight / 100), color: colors.blue },
    { name: '茎重', data: simulation.results.map(r => r.stemWeight / 100), color: colors.amber },
    { name: '根重', data: simulation.results.map(r => r.rootWeight / 100), color: colors.purple },
    { name: '果实重', data: simulation.results.map(r => r.fruitWeight / 100), color: colors.pink },
  ])
})

/* 产量分析图表选项 */
const yieldChartOption = computed(() => {
  if (simulation.results.length === 0) return createBarChartOption('产量分析', [], [])
  // 按月汇总产量
  const monthData: Record<string, number> = {}
  simulation.results.forEach(r => {
    if (r.fruitWeight > 0) {
      const month = r.date.substring(0, 7)
      monthData[month] = (monthData[month] || 0) + r.fruitWeight / 100
    }
  })
  const months = Object.keys(monthData).sort()
  return createBarChartOption('月度产量分析', months, [
    { name: '产量 (kg/ha ÷ 100)', data: months.map(m => Math.round(monthData[m])), color: colors.strawberry },
  ])
})

/* 品质预测散点图选项 */
const qualityChartOption = computed(() => {
  const qualityData = simulation.qualityResults
  if (qualityData.length === 0) {
    return createScatterChartOption('品质预测', [])
  }
  // 使用日期序号作为X轴
  const sscData: [number, number][] = qualityData.map((q, i) => [i, q.ssc])
  const acidityData: [number, number][] = qualityData.map((q, i) => [i, q.acidity * 10])
  const firmnessData: [number, number][] = qualityData.map((q, i) => [i, q.firmness])
  return createScatterChartOption('品质预测', [
    { name: '可溶性固形物 (%)', data: sscData, color: colors.strawberry },
    { name: '酸度 (×10)', data: acidityData, color: colors.amber },
    { name: '硬度 (kg/cm²)', data: firmnessData, color: colors.forest },
  ])
})

/* 导出 CSV */
function handleExportCSV() {
  if (simulation.results.length === 0) return
  const headers = ['日期', '天数', '生育阶段', 'LAI', '总生物量', '叶片重', '茎重', '根重', '果实重', '水分胁迫', '氮素胁迫']
  const rows = simulation.results.map(r => [
    r.date, String(r.day), r.growthStage, String(r.lai),
    String(r.totalBiomass), String(r.leafWeight), String(r.stemWeight),
    String(r.rootWeight), String(r.fruitWeight), String(r.waterStress),
    String(r.nitrogenStress),
  ])
  exportCSV(headers, rows, 'strawsim-results.csv')
}

/* 导出 JSON */
function handleExportJSON() {
  exportConfig({ results: simulation.results }, 'strawsim-results.json')
}
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <h2 class="section-title mb-0">结果分析</h2>
      <div class="flex items-center gap-2">
        <button class="ghost-btn flex items-center gap-1.5 text-sm" @click="handleExportCSV">
          <FileSpreadsheet :size="14" />
          CSV
        </button>
        <button class="ghost-btn flex items-center gap-1.5 text-sm" @click="handleExportJSON">
          <FileJson :size="14" />
          JSON
        </button>
      </div>
    </div>

    <!-- 无数据提示 -->
    <div v-if="simulation.results.length === 0" class="glass-card p-12 text-center">
      <BarChart3 :size="48" class="mx-auto mb-4 text-midnight-400" />
      <p class="text-midnight-300 mb-2">暂无模拟结果</p>
      <p class="text-sm text-midnight-400">请先完成模拟运行后查看结果分析</p>
      <router-link to="/" class="strawberry-btn inline-block mt-4">前往配置</router-link>
    </div>

    <!-- 有数据时显示 -->
    <template v-else>
      <!-- 标签页导航 -->
      <div class="flex gap-1 border-b border-midnight-600/30">
        <button
          :class="activeTab === 'growth' ? 'tab-item-active' : 'tab-item'"
          @click="activeTab = 'growth'"
        >
          生长曲线
        </button>
        <button
          :class="activeTab === 'yield' ? 'tab-item-active' : 'tab-item'"
          @click="activeTab = 'yield'"
        >
          产量分析
        </button>
        <button
          :class="activeTab === 'quality' ? 'tab-item-active' : 'tab-item'"
          @click="activeTab = 'quality'"
        >
          品质预测
        </button>
        <button
          :class="activeTab === 'compare' ? 'tab-item-active' : 'tab-item'"
          @click="activeTab = 'compare'"
        >
          策略对比
        </button>
      </div>

      <!-- 生长曲线 -->
      <div v-if="activeTab === 'growth'" class="glass-card p-4">
        <v-chart :option="growthChartOption" autoresize style="height: 450px" />
      </div>

      <!-- 产量分析 -->
      <div v-if="activeTab === 'yield'" class="space-y-4">
        <!-- 产量摘要 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="stat-card">
            <div class="stat-label">总产量</div>
            <div class="stat-value text-strawberry-400">{{ simulation.yieldResult.totalFruitWeight }}</div>
            <div class="text-xs text-midnight-400">kg/ha</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">果实数量</div>
            <div class="stat-value">{{ simulation.yieldResult.fruitCount }}</div>
            <div class="text-xs text-midnight-400">个/ha</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">平均果重</div>
            <div class="stat-value">{{ simulation.yieldResult.avgFruitWeight }}</div>
            <div class="text-xs text-midnight-400">g</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">采收日期</div>
            <div class="stat-value text-base">{{ simulation.yieldResult.harvestDate }}</div>
          </div>
        </div>
        <!-- 产量图表 -->
        <div class="glass-card p-4">
          <v-chart :option="yieldChartOption" autoresize style="height: 350px" />
        </div>
      </div>

      <!-- 品质预测 -->
      <div v-if="activeTab === 'quality'" class="glass-card p-4">
        <v-chart :option="qualityChartOption" autoresize style="height: 450px" />
      </div>

      <!-- 策略对比 -->
      <div v-if="activeTab === 'compare'" class="glass-card p-12 text-center">
        <p class="text-midnight-300 mb-2">策略对比功能</p>
        <p class="text-sm text-midnight-400">此功能将支持多次模拟运行的结果对比，敬请期待</p>
      </div>
    </template>
  </div>
</template>
