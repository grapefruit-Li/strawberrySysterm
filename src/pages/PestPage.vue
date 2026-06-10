<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useChart } from '@/composables/useChart'
import type { RiskLevel } from '@/engine/types'
import VChart from 'vue-echarts'
import {
  Shield,
  AlertTriangle,
  Clock,
  Bug,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Info,
  Calendar,
} from 'lucide-vue-next'

const simulation = useSimulationStore()
const { riskIndexOption, riskColors } = useChart()

/* 病虫害风险列表 */
const pestRisks = computed(() => simulation.pestRisks)

/* 当前风险等级 */
const overallRiskLevel = computed<RiskLevel>(() => {
  if (pestRisks.value.length === 0) return 'low'
  const hasCritical = pestRisks.value.some(p => p.riskLevel === 'critical')
  const hasHigh = pestRisks.value.some(p => p.riskLevel === 'high')
  const hasMedium = pestRisks.value.some(p => p.riskLevel === 'medium')
  if (hasCritical) return 'critical'
  if (hasHigh) return 'high'
  if (hasMedium) return 'medium'
  return 'low'
})

/* 高风险病虫害数 */
const highRiskCount = computed(() =>
  pestRisks.value.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length
)

/* 摘要卡片 */
const summaryCards = computed(() => [
  {
    label: '当前风险等级',
    value: riskLevelLabel(overallRiskLevel.value),
    icon: overallRiskLevel.value === 'critical' || overallRiskLevel.value === 'high' ? ShieldAlert : ShieldCheck,
    color: riskColors[overallRiskLevel.value],
  },
  {
    label: '高风险病虫害数',
    value: `${highRiskCount.value}`,
    icon: Bug,
    color: highRiskCount.value > 0 ? '#E63946' : '#4ADE80',
  },
  {
    label: '预警总数',
    value: `${pestRisks.value.length}`,
    icon: Clock,
    color: '#F59E0B',
  },
])

/* 风险等级中文标签 */
function riskLevelLabel(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
    critical: '极高风险',
  }
  return map[level]
}

/* 风险等级徽章样式 */
function riskBadgeClass(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    low: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-orange-500/20 text-orange-400',
    critical: 'bg-red-500/20 text-red-400',
  }
  return map[level]
}

/* 风险图标 */
function riskIcon(level: RiskLevel) {
  const map: Record<RiskLevel, any> = {
    low: ShieldCheck,
    medium: Shield,
    high: ShieldAlert,
    critical: ShieldX,
  }
  return map[level]
}

/* 风险指数图表选项 */
const riskChartOption = computed(() => riskIndexOption(pestRisks.value))

/* 关联阶段显示（relatedStage已是string） */
</script>

<template>
  <div class="space-y-6">
    <!-- 无数据提示 -->
    <div
      v-if="simulation.status === 'idle'"
      class="glass-card p-12 text-center"
    >
      <Shield :size="48" class="mx-auto text-midnight-500 mb-4" />
      <h3 class="font-heading text-xl text-midnight-300 mb-2">尚未运行模拟</h3>
      <p class="text-midnight-500">请先在基础信息页面完成配置并生成方案</p>
    </div>

    <template v-else>
      <!-- 顶部风险摘要卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="card in summaryCards"
          :key="card.label"
          class="stat-card"
        >
          <div class="flex items-center gap-2 mb-1">
            <component :is="card.icon" :size="14" :style="{ color: card.color }" />
            <span class="stat-label">{{ card.label }}</span>
          </div>
          <span class="stat-value text-lg">{{ card.value }}</span>
        </div>
      </div>

      <!-- 风险指数折线图 -->
      <div class="glass-card p-5">
        <h2 class="section-title">风险预警</h2>
        <v-chart
          :option="riskChartOption"
          autoresize
          class="w-full h-80"
        />
      </div>

      <!-- 病虫害预警卡片 + 侧面板 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 预警卡片 -->
        <div class="lg:col-span-2 glass-card p-5">
          <h2 class="section-title">病虫害预警</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="(pest, idx) in pestRisks"
              :key="idx"
              class="p-4 rounded-lg border bg-midnight-800/40"
              :class="pest.riskLevel === 'critical'
                ? 'border-red-500/40'
                : pest.riskLevel === 'high'
                  ? 'border-orange-500/30'
                  : 'border-midnight-600/20'"
            >
              <!-- 头部 -->
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <component
                    :is="riskIcon(pest.riskLevel)"
                    :size="18"
                    :style="{ color: riskColors[pest.riskLevel] }"
                  />
                  <span class="font-heading text-midnight-50">{{ pest.name }}</span>
                </div>
                <span
                  class="text-xs px-2 py-0.5 rounded-full"
                  :class="riskBadgeClass(pest.riskLevel)"
                >
                  {{ riskLevelLabel(pest.riskLevel) }}
                </span>
              </div>

              <!-- 描述 -->
              <p class="text-sm text-midnight-400 mb-2">{{ pest.description }}</p>

              <!-- 关联阶段 -->
              <div class="text-xs text-midnight-500 mb-2">
                关联阶段: {{ pest.relatedStage }}
              </div>

              <!-- 日期 -->
              <div class="text-xs text-midnight-500 mb-2">
                预警日期: {{ pest.nextAlertDate }}
              </div>

              <!-- 防治建议 -->
              <div class="p-2 rounded bg-midnight-900/40 border border-midnight-600/20">
                <div class="text-xs text-midnight-300 mb-1">防治建议:</div>
                <p class="text-xs text-midnight-200">{{ pest.controlRecommendation }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 侧面板：IPM策略 -->
        <div class="space-y-6">
          <!-- IPM策略概述 -->
          <div class="glass-card p-5">
            <h2 class="section-title flex items-center gap-2">
              <Info :size="18" class="text-blue-400" />
              IPM策略概述
            </h2>
            <div class="space-y-3 text-sm text-midnight-300">
              <div class="p-3 rounded-lg bg-midnight-800/40 border border-midnight-600/20">
                <h4 class="text-midnight-200 font-medium mb-1">预防为主</h4>
                <p class="text-xs text-midnight-400">选用抗病品种，合理密植，保持通风透光</p>
              </div>
              <div class="p-3 rounded-lg bg-midnight-800/40 border border-midnight-600/20">
                <h4 class="text-midnight-200 font-medium mb-1">监测预警</h4>
                <p class="text-xs text-midnight-400">定期巡查，结合气象数据预判病虫害发生</p>
              </div>
              <div class="p-3 rounded-lg bg-midnight-800/40 border border-midnight-600/20">
                <h4 class="text-midnight-200 font-medium mb-1">综合防治</h4>
                <p class="text-xs text-midnight-400">优先使用生物防治和物理防治，必要时使用化学防治</p>
              </div>
              <div class="p-3 rounded-lg bg-midnight-800/40 border border-midnight-600/20">
                <h4 class="text-midnight-200 font-medium mb-1">安全间隔</h4>
                <p class="text-xs text-midnight-400">采收前严格遵守农药安全间隔期</p>
              </div>
            </div>
          </div>

          <!-- 防治日历 -->
          <div class="glass-card p-5">
            <h2 class="section-title flex items-center gap-2">
              <Calendar :size="18" class="text-amber-400" />
              防治日历
            </h2>
            <div class="space-y-3 max-h-80 overflow-y-auto">
              <div
                v-for="(pest, idx) in pestRisks.filter(p => p.riskLevel !== 'low')"
                :key="idx"
                class="flex items-center gap-2 text-xs"
              >
                <span
                  class="w-2 h-2 rounded-full shrink-0"
                  :style="{ backgroundColor: riskColors[pest.riskLevel] }"
                />
                <span class="text-midnight-400">{{ pest.nextAlertDate }}</span>
                <span class="text-midnight-300">{{ pest.name }}</span>
                <span
                  class="text-xs px-1.5 py-0.5 rounded"
                  :class="riskBadgeClass(pest.riskLevel)"
                >
                  {{ riskLevelLabel(pest.riskLevel) }}
                </span>
              </div>

              <!-- 无日历数据 -->
              <div
                v-if="pestRisks.filter(p => p.riskLevel !== 'low').length === 0"
                class="text-center py-4 text-midnight-500 text-sm"
              >
                暂无防治日历数据
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
