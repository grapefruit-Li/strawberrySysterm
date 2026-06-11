<script setup lang="ts">
import { ref } from 'vue'
import { useConfigStore } from '@/stores/config'
import type { CultivarFullParams } from '@/engine/types'
import {
  ChevronDown,
  ChevronUp,
  Sprout,
  Thermometer,
  ShieldCheck,
} from 'lucide-vue-next'

const config = useConfigStore()

/* 当前展开的品种 code */
const expandedCode = ref<string | null>(null)

/* 品种 DSSAT CROPGRO 参数标签 */
const cultivarParamLabels: Record<string, string> = {
  culCode: '品种代码',
  name: '品种名',
  ecoCode: '生态型代码',
  cropCode: '作物代码',
  p1v: '营养生长1 (°C·d)',
  p1r: '营养生长2 (°C·d)',
  p3: '开花阶段 (°C·d)',
  p4: '结果阶段 (°C·d)',
  laimax: '最大LAI',
  sla: '比叶面积 (cm²/g)',
  photosynmax: '最大光合速率',
  hi: '收获指数',
  fruitdm: '果实干物质含量',
  nfruit: '果实含氮量',
  flrinterval: '花序间隔GDD',
  maxfruitpertruss: '每花序最大果数',
}

/* 生态型参数标签 */
const ecotypeParamLabels: Record<string, string> = {
  ecoCode: '生态型代码',
  name: '生态型名称',
  tbase: '基温 (°C)',
  topt: '最适温度 (°C)',
  tmax: '上限温度 (°C)',
  cphot: '临界光周期 (h)',
  ppfpe: '光周期敏感性',
  laimax: '最大LAI',
  sla: '比叶面积 (cm²/g)',
  photosynmax: '最大光合速率',
  rm25leaf: '叶片呼吸系数',
  rm25stem: '茎呼吸系数',
  rm25root: '根呼吸系数',
  rm25fruit: '果实呼吸系数',
  rg: '生长呼吸系数',
  partleaf: '叶分配系数',
  partstem: '茎分配系数',
  partroot: '根分配系数',
  partfruit: '果分配系数',
  pltdensity: '种植密度 (株/m²)',
  rowspc: '行距 (cm)',
  rtdepinit: '初始根深 (cm)',
  rtdepmax: '最大根深 (cm)',
}

/* 关键参数标签 */
const keyParamLabels: Record<string, string> = {
  avgFruitWeight: '平均果重 (g)',
  ssc: '可溶性固形物 (%)',
  firmness: '硬度 (kg/cm²)',
  harvestIndex: '收获指数',
}

/* 选择品种并跳转到配置 */
function selectCultivar(code: string) {
  const cultivar = config.cultivarList.find((c: CultivarFullParams) => c.code === code)
  if (cultivar) {
    config.setCultivarFull(cultivar)
  }
}

/* 展开/折叠品种详情 */
function toggleExpand(code: string) {
  expandedCode.value = expandedCode.value === code ? null : code
}

/* 可靠性星级 */
function reliabilityStars(level: number): string {
  return '★'.repeat(level) + '☆'.repeat(5 - level)
}
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <h2 class="section-title mb-0">品种参数库</h2>
      <span class="text-xs text-midnight-400">共 {{ config.cultivarList.length }} 个品种</span>
    </div>

    <!-- 品种卡片网格 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="cultivar in config.cultivarList"
        :key="cultivar.code"
        class="glass-card p-5 cursor-pointer transition-all duration-200 hover:border-strawberry-500/30"
        :class="config.selectedCultivar === cultivar.code ? 'border-strawberry-500/50 ring-1 ring-strawberry-500/20' : ''"
        @click="selectCultivar(cultivar.code)"
      >
        <!-- 卡片头部 -->
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="font-heading text-lg text-midnight-50">{{ cultivar.name }}</h3>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs px-2 py-0.5 rounded-full bg-forest-500/20 text-forest-300">
                {{ cultivar.type }}
              </span>
              <span class="text-xs text-midnight-400">{{ cultivar.origin }}</span>
            </div>
          </div>
          <button
            class="text-midnight-400 hover:text-midnight-200 transition-colors"
            @click.stop="toggleExpand(cultivar.code)"
          >
            <component :is="expandedCode === cultivar.code ? ChevronUp : ChevronDown" :size="16" />
          </button>
        </div>

        <!-- 描述 -->
        <p class="text-sm text-midnight-300 mb-3">{{ cultivar.fruitDesc }}</p>

        <!-- 关键参数摘要 -->
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="p-2 rounded-lg bg-midnight-700/30">
            <div class="text-xs text-midnight-400">最大LAI</div>
            <div class="text-sm font-semibold text-midnight-100">{{ cultivar.cultivarParams.laimax }}</div>
          </div>
          <div class="p-2 rounded-lg bg-midnight-700/30">
            <div class="text-xs text-midnight-400">果重</div>
            <div class="text-sm font-semibold text-midnight-100">{{ cultivar.keyParams.avgFruitWeight }}g</div>
          </div>
          <div class="p-2 rounded-lg bg-midnight-700/30">
            <div class="text-xs text-midnight-400">固形物</div>
            <div class="text-sm font-semibold text-midnight-100">{{ cultivar.keyParams.ssc }}%</div>
          </div>
        </div>

        <!-- 展开详情 -->
        <transition name="expand">
          <div v-if="expandedCode === cultivar.code" class="mt-4 pt-4 border-t border-midnight-600/30">
            <!-- 关键品质参数 -->
            <h4 class="text-xs font-semibold text-midnight-300 mb-3">品质参数</h4>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="(value, key) in cultivar.keyParams"
                :key="key"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-midnight-400">{{ keyParamLabels[key] || key }}</span>
                <span class="text-midnight-200 font-medium">{{ value }}</span>
              </div>
            </div>

            <!-- DSSAT CROPGRO 品种参数 -->
            <h4 class="text-xs font-semibold text-midnight-300 mt-4 mb-3">DSSAT CROPGRO 品种参数</h4>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="(value, key) in cultivar.cultivarParams"
                :key="'c-' + key"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-midnight-400">{{ cultivarParamLabels[key] || key }}</span>
                <span class="text-midnight-200 font-medium">{{ value }}</span>
              </div>
            </div>

            <!-- 生态型参数 -->
            <h4 class="text-xs font-semibold text-midnight-300 mt-4 mb-3">生态型参数</h4>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="(value, key) in cultivar.ecotypeParams"
                :key="'e-' + key"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-midnight-400">{{ ecotypeParamLabels[key] || key }}</span>
                <span class="text-midnight-200 font-medium">{{ value }}</span>
              </div>
            </div>

            <!-- 可靠性和耐寒性可视化 -->
            <div class="mt-3 space-y-2">
              <div class="flex items-center gap-2">
                <ShieldCheck :size="12" class="text-forest-400" />
                <span class="text-xs text-midnight-400 w-16">可靠性</span>
                <span class="text-xs text-amber-400">{{ reliabilityStars(cultivar.reliability) }}</span>
              </div>
              <div v-if="cultivar.chillingRequirement" class="flex items-center gap-2">
                <Thermometer :size="12" class="text-blue-400" />
                <span class="text-xs text-midnight-400 w-16">需冷量</span>
                <div class="flex-1 h-2 bg-midnight-700 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-blue-500 rounded-full"
                    :style="{ width: Math.min(100, cultivar.chillingRequirement / 5) + '%' }"
                  />
                </div>
                <span class="text-xs text-midnight-300">{{ cultivar.chillingRequirement }}h</span>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
