<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'
import { useChart } from '@/composables/useChart'
import type { PestRiskRecord, RiskLevel } from '@/engine/types'
import VChart from 'vue-echarts'
import {
  Shield,
  Bug,
  AlertTriangle,
  Info,
  Thermometer,
  Wind,
  CheckCircle2,
  Eye,
  SprayCan,
  BookOpen,
  ShieldCheck,
  Calendar,
} from 'lucide-vue-next'

const simulation = useSimulationStore()
const config = useConfigStore()
const { riskIndexLightOption } = useChart()

const pestRisks = computed<PestRiskRecord[]>(() => simulation.pestRisks)

/* 风险摘要卡片 */
const riskSummary = computed(() => {
  const risks = pestRisks.value
  const highCount = risks.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length
  const maxRiskLevel = risks.reduce<RiskLevel>((max, r) => {
    const level = { low: 0, medium: 1, high: 2, critical: 3 }
    return level[r.riskLevel] > level[max] ? r.riskLevel : max
  }, 'low')

  const levelMap: Record<string, { label: string; class: string }> = {
    low: { label: '低风险', class: 'v2-accent-green' },
    medium: { label: '中等风险', class: 'v2-accent-orange' },
    high: { label: '高风险', class: 'v2-accent-red' },
    critical: { label: '严重风险', class: 'v2-accent-purple' },
  }

  const info = levelMap[maxRiskLevel] || levelMap.low

  return [
    { label: '风险等级', value: info.label, sub: '综合评估', accent: info.class, icon: Shield },
    { label: '高风险数', value: `${highCount}`, sub: `共 ${risks.length} 项`, accent: 'v2-accent-red', icon: AlertTriangle },
    { label: '预警总数', value: `${risks.length}`, sub: '病虫害项', accent: 'v2-accent-blue', icon: Bug },
  ]
})

/* 风险指数图配置 */
const riskChartOption = computed(() => {
  if (pestRisks.value.length === 0) {
    return riskIndexLightOption([])
  }
  return riskIndexLightOption(pestRisks.value)
})

/* 风险徽章 */
function riskBadge(level: PestRiskRecord['riskLevel']): { class: string; text: string } {
  const map: Record<string, { class: string; text: string }> = {
    low: { class: 'bg-green-100 text-green-700 border border-green-200', text: '低风险' },
    medium: { class: 'bg-yellow-100 text-yellow-700 border border-yellow-200', text: '中等风险' },
    high: { class: 'bg-orange-100 text-orange-700 border border-orange-200', text: '高风险' },
    critical: { class: 'bg-red-100 text-red-700 border border-red-200', text: '严重风险' },
  }
  return map[level] || map.low
}

/* 阶段名称 */
function stageName(stageName: string): string {
  return stageName
}
</script>

<template>
  <div class="space-y-6">
    <!-- 无数据提示 -->
    <div
      v-if="simulation.status === 'idle'"
      class="v2-card p-12 text-center"
    >
      <Shield :size="48" class="mx-auto text-midnight-400 mb-4" />
      <h3 class="text-xl text-midnight-300 mb-2">尚未运行模拟</h3>
      <p class="text-midnight-300">请先在基础信息页面完成配置并生成方案</p>
    </div>

    <template v-else>
      <!-- 风险摘要卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div
          v-for="(card, idx) in riskSummary"
          :key="card.label"
          class="v2-stat-card"
        >
          <div :class="['absolute top-0 left-0 right-0 h-1', card.accent]"></div>
          <div class="flex items-center gap-2 mb-1">
            <component :is="card.icon" :size="14" class="text-midnight-300" />
            <span class="text-xs text-midnight-300 uppercase tracking-wider">{{ card.label }}</span>
          </div>
          <span class="text-2xl font-bold text-midnight-100">{{ card.value }}</span>
          <span class="text-xs text-midnight-400 mt-1">{{ card.sub }}</span>
        </div>
      </div>

      <!-- 风险指数图 -->
      <div class="v2-card p-5">
        <h2 class="v2-section-title flex items-center gap-2">
          <Bug :size="18" class="text-orange-500" />
          风险预警指数
        </h2>
        <v-chart
          :option="riskChartOption"
          autoresize
          class="w-full h-72"
        />
      </div>

      <!-- 病虫害预警卡片 + IPM策略面板 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 病虫害预警卡片 -->
        <div class="lg:col-span-2 v2-card p-5">
          <h2 class="v2-section-title flex items-center gap-2">
            <AlertTriangle :size="18" class="text-red-500" />
            病虫害预警
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="(risk, idx) in pestRisks"
              :key="risk.name + idx"
              class="p-4 rounded-lg border-2"
              :class="risk.riskLevel === 'critical'
                ? 'border-red-300 bg-red-50/50'
                : risk.riskLevel === 'high'
                  ? 'border-orange-300 bg-orange-50/50'
                  : 'border-gray-200 bg-white'"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <Bug :size="16" class="text-midnight-300" />
                  <span class="font-medium text-midnight-100">{{ risk.name }}</span>
                </div>
                <span
                  class="text-xs px-2 py-0.5 rounded-full"
                  :class="riskBadge(risk.riskLevel).class"
                >
                  {{ riskBadge(risk.riskLevel).text }}
                </span>
              </div>

              <p class="text-xs text-midnight-300 mb-3">{{ risk.description }}</p>

              <div class="space-y-1 text-xs text-midnight-300">
                <div class="flex items-center gap-2">
                  <Thermometer :size="12" />
                  <span>适宜温度: {{ risk.dailyRiskIndex[0]?.index || '-' }}°C</span>
                </div>
                <div class="flex items-center gap-2">
                  <Wind :size="12" />
                  <span>风险指数: {{ risk.riskIndex }}</span>
                </div>
              </div>

              <div class="mt-3 pt-3 border-t border-gray-200">
                <div class="flex items-center gap-2 text-xs text-midnight-300 mb-1">
                  <span>关联阶段: {{ stageName(risk.relatedStage) }}</span>
                </div>
                <div class="flex items-center gap-2 text-xs text-midnight-300">
                  <span>下次预警: {{ risk.nextAlertDate }}</span>
                </div>
              </div>

              <div class="mt-3 p-2 rounded bg-midnight-700/30">
                <div class="text-xs font-medium text-midnight-200 mb-1">防治建议</div>
                <p class="text-xs text-midnight-300">{{ risk.controlRecommendation }}</p>
              </div>
            </div>

            <div
              v-if="pestRisks.length === 0"
              class="col-span-full text-center py-8 text-midnight-400 text-sm"
            >
              暂无病虫害风险
            </div>
          </div>
        </div>

        <!-- IPM策略面板 -->
        <div class="space-y-4">
          <div class="v2-card p-5">
            <h2 class="v2-section-title flex items-center gap-2">
              <ShieldCheck :size="18" class="text-green-500" />
              IPM策略
            </h2>
            <div class="space-y-3">
              <div class="flex items-start gap-3 p-3 rounded-lg bg-green-50">
                <CheckCircle2 :size="16" class="text-green-500 shrink-0 mt-0.5" />
                <div>
                  <div class="text-sm font-medium text-green-800">预防为主</div>
                  <p class="text-xs text-green-600 mt-1">优先采用农业措施和物理防控</p>
                </div>
              </div>
              <div class="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
                <Eye :size="16" class="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <div class="text-sm font-medium text-blue-800">监测预警</div>
                  <p class="text-xs text-blue-600 mt-1">定期巡查，早发现早处理</p>
                </div>
              </div>
              <div class="flex items-start gap-3 p-3 rounded-lg bg-orange-50">
                <SprayCan :size="16" class="text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <div class="text-sm font-medium text-orange-800">综合防治</div>
                  <p class="text-xs text-orange-600 mt-1">生物、化学、物理方法结合</p>
                </div>
              </div>
              <div class="flex items-start gap-3 p-3 rounded-lg bg-purple-50">
                <BookOpen :size="16" class="text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <div class="text-sm font-medium text-purple-800">安全间隔</div>
                  <p class="text-xs text-purple-600 mt-1">遵守农药安全使用规范</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 防治日历 -->
          <div class="v2-card p-5">
            <h2 class="v2-section-title flex items-center gap-2">
              <Calendar :size="18" class="text-blue-500" />
              防治日历
            </h2>
            <div class="space-y-2 text-sm">
              <div v-for="(risk, idx) in pestRisks.slice(0, 4)" :key="idx" class="flex items-center justify-between py-1">
                <span class="text-midnight-200">{{ risk.name }}</span>
                <span class="text-midnight-300 text-xs">{{ risk.nextAlertDate }}</span>
              </div>
              <div v-if="pestRisks.length === 0" class="text-center text-midnight-400 text-xs py-4">
                暂无防治安排
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
