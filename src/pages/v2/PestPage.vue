<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'
import { useChart } from '@/composables/useChart'
import VChart from 'vue-echarts'
import { Bug, AlertTriangle, Info } from 'lucide-vue-next'
import type { RiskLevel } from '@/engine/types'

const simulation = useSimulationStore()
const config = useConfigStore()
const { riskIndexOption } = useChart()

const pestRisks = computed(() => simulation.pestRisks)
const hasData = computed(() => pestRisks.value.length > 0)

const cultivarName = computed(() => config.cultivarName || '未选择')
const simulationDays = computed(() => config.simulationDays || 180)

const chartOption = computed(() => riskIndexOption(pestRisks.value))

const riskLevelMap: Record<RiskLevel, { label: string; bg: string; text: string; border: string }> = {
  low: { label: '低风险', bg: 'bg-forest-500/20', text: 'text-forest-300', border: 'border-l-green-500' },
  medium: { label: '中风险', bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-l-amber-500' },
  high: { label: '高风险', bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-l-orange-500' },
  critical: { label: '极高风险', bg: 'bg-strawberry-500/20', text: 'text-strawberry-300', border: 'border-l-red-500' },
}

const alertCards = computed(() => {
  const defaults = [
    { name: '灰霉病', riskLevel: 'high' as RiskLevel, riskIndex: 72, trigger: '湿度>85%连续3天', color: 'border-l-red-500' },
    { name: '蚜虫', riskLevel: 'medium' as RiskLevel, riskIndex: 48, trigger: '百叶虫口>50', color: 'border-l-amber-500' },
    { name: '红蜘蛛', riskLevel: 'low' as RiskLevel, riskIndex: 25, trigger: '叶片出现黄点', color: 'border-l-green-500' },
    { name: '白粉病', riskLevel: 'critical' as RiskLevel, riskIndex: 88, trigger: '叶面出现白粉', color: 'border-l-purple-500' },
  ]

  if (pestRisks.value.length >= 4) {
    return pestRisks.value.slice(0, 4).map((p, i) => {
      const colorMap = ['border-l-red-500', 'border-l-amber-500', 'border-l-green-500', 'border-l-purple-500']
      return {
        name: p.name,
        riskLevel: p.riskLevel,
        riskIndex: p.riskIndex,
        trigger: p.description,
        color: colorMap[i % 4],
      }
    })
  }

  return defaults
})

const controlTable = [
  { pest: '灰霉病', period: '开花~采收', threshold: '湿度>85%连续3天', chemical: '嘧霉胺、腐霉利' },
  { pest: '白粉病', period: '营养生长~开花', threshold: '叶面出现白粉', chemical: '硫磺制剂、三唑酮' },
  { pest: '红蜘蛛', period: '营养生长~果实膨大', threshold: '叶片出现黄点', chemical: '阿维菌素、螺螨酯' },
  { pest: '蚜虫', period: '营养生长~开花', threshold: '百叶虫口>50', chemical: '吡虫啉、噻虫嗪' },
  { pest: '炭疽病', period: '结果~采收', threshold: '降雨后高温', chemical: '咪鲜胺、苯醚甲环唑' },
  { pest: '根腐病', period: '定植~营养生长', threshold: '土壤积水', chemical: '恶霉灵、甲霜灵' },
]

const ipmMeasures = [
  { label: '监测', desc: '悬挂黄板和蓝板，每周检查虫口密度' },
  { label: '生防', desc: '释放智利小植绥螨防治红蜘蛛' },
  { label: '花前', desc: '可使用高效低毒药剂预防' },
  { label: '花后', desc: '优先使用生物农药，减少化学残留' },
  { label: '灌溉', desc: '采用膜下滴灌，降低田间湿度' },
  { label: '清园', desc: '及时清除病残体，减少侵染源' },
]
</script>

<template>
  <div class="space-y-6">
    <!-- 头部 -->
    <div class="flex items-center gap-3">
      <Bug :size="24" class="text-strawberry-400" />
      <h2 class="section-title mb-0">植保 IPM</h2>
      <span class="inline-flex items-center rounded-full bg-strawberry-500/20 px-3 py-0.5 text-xs font-medium text-strawberry-300">
        {{ cultivarName }}·{{ simulationDays }}天风险期
      </span>
    </div>
    <p class="text-sm text-midnight-400 -mt-4">基于物候期的综合病虫害防治方案</p>

    <!-- 空状态 -->
    <div v-if="!hasData" class="glass-card p-12 text-center">
      <AlertTriangle :size="48" class="mx-auto mb-4 text-midnight-500" />
      <p class="text-midnight-300 mb-2">暂无病虫害风险数据</p>
      <p class="text-sm text-midnight-400">请先运行模拟以生成病虫害风险预警</p>
    </div>

    <template v-else>
      <!-- 预警卡片 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="card in alertCards"
          :key="card.name"
          class="glass-card border-l-4 p-4 space-y-2"
          :class="card.color"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-midnight-200">{{ card.name }}</span>
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              :class="[riskLevelMap[card.riskLevel].bg, riskLevelMap[card.riskLevel].text]"
            >
              {{ riskLevelMap[card.riskLevel].label }}
            </span>
          </div>
          <div class="text-2xl font-bold text-midnight-100">{{ card.riskIndex }}</div>
          <div class="text-xs text-midnight-400">{{ card.trigger }}</div>
        </div>
      </div>

      <!-- 月度病虫害风险指数折线图 -->
      <div class="glass-card p-4">
        <h3 class="text-sm font-medium text-midnight-200 mb-3">月度病虫害风险指数</h3>
        <VChart :option="chartOption" autoresize style="height: 320px" />
      </div>

      <!-- 防治方案表格 -->
      <div class="glass-card p-4 overflow-x-auto">
        <h3 class="text-sm font-medium text-midnight-200 mb-3">防治方案</h3>
        <table class="v2-table w-full text-sm">
          <thead>
            <tr class="border-b border-midnight-600/30">
              <th class="px-4 py-2 text-left text-midnight-400 font-medium">病虫害</th>
              <th class="px-4 py-2 text-left text-midnight-400 font-medium">高发期</th>
              <th class="px-4 py-2 text-left text-midnight-400 font-medium">阈值</th>
              <th class="px-4 py-2 text-left text-midnight-400 font-medium">推荐药剂</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in controlTable"
              :key="row.pest"
              class="border-b border-midnight-600/20 hover:bg-midnight-700/30 transition-colors"
            >
              <td class="px-4 py-2.5 text-midnight-200">{{ row.pest }}</td>
              <td class="px-4 py-2.5 text-midnight-300">{{ row.period }}</td>
              <td class="px-4 py-2.5 text-midnight-300">{{ row.threshold }}</td>
              <td class="px-4 py-2.5 text-midnight-200">{{ row.chemical }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- IPM核心提示框 -->
      <div class="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4">
        <div class="flex items-center gap-2 mb-3">
          <Info :size="18" class="text-amber-300" />
          <h3 class="text-sm font-medium text-amber-200">IPM核心措施</h3>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="item in ipmMeasures"
            :key="item.label"
            class="flex items-start gap-2"
          >
            <span class="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs font-medium text-amber-300">{{ item.label }}</span>
            <span class="text-sm text-amber-200/80">{{ item.desc }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
