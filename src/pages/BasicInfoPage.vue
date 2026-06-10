<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import { useSimulationStore } from '@/stores/simulation'
import { useSimulation } from '@/composables/useSimulation'
import type { CultivarFullParams, RegionConfig } from '@/engine/types'
import {
  Search,
  MapPin,
  Calendar,
  Sprout,
  ChevronRight,
  Star,
  Thermometer,
  Droplets,
  Zap,
  Check,
} from 'lucide-vue-next'

const router = useRouter()
const config = useConfigStore()
const simulation = useSimulationStore()
const { runChainSimulation } = useSimulation()

/* 品种搜索和筛选 */
const cultivarSearch = ref('')
const cultivarFilter = ref<'all' | '短日型' | '日中性'>('all')

/* 内置品种数据 - 使用 strawberryCultivars */
import { strawberryCultivars } from '@/data/cultivars/strawberry-cultivars'

const cultivars = ref<CultivarFullParams[]>(strawberryCultivars)

/* 区域列表 */
const regions = computed(() => config.getRegions())

/* 筛选后的品种列表 */
const filteredCultivars = computed(() => {
  let list = cultivars.value
  if (cultivarFilter.value !== 'all') {
    list = list.filter(c => c.type === cultivarFilter.value)
  }
  if (cultivarSearch.value) {
    const q = cultivarSearch.value.toLowerCase()
    list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.origin.toLowerCase().includes(q) ||
      c.fruitDesc.toLowerCase().includes(q)
    )
  }
  return list
})

/* 选中的品种 */
const selectedCultivarCode = computed(() => config.selectedCultivarFull?.code ?? '')

/* 选中的区域 */
const selectedRegionId = computed(() => config.selectedRegion?.id ?? '')

/* 配置摘要卡片 */
const summaryCards = computed(() => [
  { label: '品种', value: config.cultivarName || '未选择', icon: Sprout },
  { label: '定植日期', value: config.plantingDate || '未设置', icon: Calendar },
  { label: '区域', value: config.selectedRegion?.name || '未选择', icon: MapPin },
  { label: '预计采收天数', value: config.selectedCultivarFull ? `${config.selectedCultivarFull.cultivarParams.p1v + config.selectedCultivarFull.cultivarParams.p3 + config.selectedCultivarFull.cultivarParams.p4} GDD` : '-', icon: Thermometer },
])

/* 是否可以生成方案 */
const canGenerate = computed(() => {
  return config.selectedCultivarFull !== null && config.selectedRegion !== null && config.plantingDate !== ''
})

/* 选择品种 */
function selectCultivar(c: CultivarFullParams) {
  config.setCultivarFull(c)
}

/* 选择区域 */
function selectRegion(r: RegionConfig) {
  config.setRegion(r)
}

/* 生成方案 */
function generatePlan() {
  if (!canGenerate.value) return
  config.loadPreset()
  runChainSimulation()
  router.push('/v2/phenology')
}

/* 可靠度徽章颜色 */
function reliabilityColor(level: number): string {
  if (level >= 5) return 'text-forest-400 bg-forest-500/20'
  if (level >= 4) return 'text-blue-400 bg-blue-500/20'
  if (level >= 3) return 'text-amber-400 bg-amber-500/20'
  return 'text-midnight-400 bg-midnight-500/20'
}

/* 判断品种类型 */
function cultivarType(c: CultivarFullParams): string {
  return c.type
}
</script>

<template>
  <div class="space-y-6">
    <!-- 顶部配置摘要卡片 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        v-for="card in summaryCards"
        :key="card.label"
        class="stat-card"
      >
        <div class="flex items-center gap-2 mb-1">
          <component :is="card.icon" :size="14" class="text-strawberry-400" />
          <span class="stat-label">{{ card.label }}</span>
        </div>
        <span class="stat-value text-lg">{{ card.value }}</span>
      </div>
    </div>

    <!-- 三列主内容 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- 左列：品种选择 -->
      <div class="glass-card p-5">
        <h2 class="section-title flex items-center gap-2">
          <Sprout :size="20" class="text-strawberry-400" />
          品种选择
        </h2>

        <!-- 搜索和筛选 -->
        <div class="flex gap-2 mb-4">
          <div class="relative flex-1">
            <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-midnight-400" />
            <input
              v-model="cultivarSearch"
              type="text"
              placeholder="搜索品种..."
              class="input-field pl-9 text-sm"
            />
          </div>
          <select
            v-model="cultivarFilter"
            class="input-field w-auto text-sm"
          >
            <option value="all">全部</option>
            <option value="短日型">短日型</option>
            <option value="日中性">日中性</option>
          </select>
        </div>

        <!-- 品种卡片列表 -->
        <div class="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          <div
            v-for="c in filteredCultivars"
            :key="c.code"
            class="p-3 rounded-lg border cursor-pointer transition-all duration-200"
            :class="selectedCultivarCode === c.code
              ? 'border-strawberry-500/50 bg-strawberry-500/10'
              : 'border-midnight-600/30 bg-midnight-800/40 hover:border-midnight-500/50'"
            @click="selectCultivar(c)"
          >
            <!-- 品种头部 -->
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="font-heading text-midnight-50">{{ c.name }}</span>
                <span
                  class="text-xs px-2 py-0.5 rounded-full"
                  :class="cultivarType(c) === '短日型' ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'"
                >
                  {{ cultivarType(c) }}
                </span>
              </div>
              <div
                v-if="selectedCultivarCode === c.code"
                class="w-5 h-5 rounded-full bg-strawberry-500 flex items-center justify-center"
              >
                <Check :size="12" class="text-white" />
              </div>
            </div>

            <!-- 英文名 -->
            <p class="text-xs text-midnight-400 mb-2">{{ c.origin }}</p>

            <!-- 关键参数 -->
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex items-center gap-1">
                <span class="text-midnight-500">单果重:</span>
                <span class="text-midnight-200">{{ c.keyParams.avgFruitWeight }}g</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-midnight-500">SSC:</span>
                <span class="text-midnight-200">{{ c.keyParams.ssc }}%</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-midnight-500">硬度:</span>
                <span class="text-midnight-200">{{ c.keyParams.firmness }}N</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-midnight-500">收获指数:</span>
                <span class="text-midnight-200">{{ c.keyParams.harvestIndex }}</span>
              </div>
            </div>

            <!-- 数据可信度 -->
            <div class="flex items-center gap-1 mt-2">
              <span class="text-xs text-midnight-500">数据可信度:</span>
              <span
                class="text-xs px-1.5 py-0.5 rounded"
                :class="reliabilityColor(c.reliability)"
              >
                <Star :size="10" class="inline" /> {{ c.reliability }}/5
              </span>
            </div>
          </div>

          <!-- 无结果 -->
          <div
            v-if="filteredCultivars.length === 0"
            class="text-center py-8 text-midnight-500 text-sm"
          >
            未找到匹配的品种
          </div>
        </div>
      </div>

      <!-- 中列：种植区域 -->
      <div class="glass-card p-5">
        <h2 class="section-title flex items-center gap-2">
          <MapPin :size="20" class="text-forest-400" />
          种植区域
        </h2>

        <div class="space-y-3">
          <div
            v-for="r in regions"
            :key="r.id"
            class="p-4 rounded-lg border cursor-pointer transition-all duration-200"
            :class="selectedRegionId === r.id
              ? 'border-forest-500/50 bg-forest-500/10'
              : 'border-midnight-600/30 bg-midnight-800/40 hover:border-midnight-500/50'"
            @click="selectRegion(r)"
          >
            <!-- 区域头部 -->
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <MapPin :size="16" class="text-forest-400" />
                <span class="font-heading text-midnight-50">{{ r.name }}</span>
                <span class="text-xs text-midnight-400">{{ r.climateType }}</span>
              </div>
              <div
                v-if="selectedRegionId === r.id"
                class="w-5 h-5 rounded-full bg-forest-500 flex items-center justify-center"
              >
                <Check :size="12" class="text-white" />
              </div>
            </div>

            <!-- 气候摘要 -->
            <div class="grid grid-cols-2 gap-2 text-xs mt-2">
              <div class="flex items-center gap-1">
                <Thermometer :size="12" class="text-amber-400" />
                <span class="text-midnight-500">年均温:</span>
                <span class="text-midnight-200">{{ r.avgTemp }}°C</span>
              </div>
              <div class="flex items-center gap-1">
                <Droplets :size="12" class="text-blue-400" />
                <span class="text-midnight-500">年降雨:</span>
                <span class="text-midnight-200">{{ r.annualRain }}mm</span>
              </div>
              <div class="flex items-center gap-1">
                <Calendar :size="12" class="text-forest-400" />
                <span class="text-midnight-500">生长季:</span>
                <span class="text-midnight-200">{{ r.growingSeason }}</span>
              </div>
              <div class="flex items-center gap-1">
                <MapPin :size="12" class="text-strawberry-400" />
                <span class="text-midnight-500">纬度:</span>
                <span class="text-midnight-200">{{ r.lat }}°</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右列：定植配置 -->
      <div class="glass-card p-5">
        <h2 class="section-title flex items-center gap-2">
          <Calendar :size="20" class="text-amber-400" />
          定植配置
        </h2>

        <div class="space-y-5">
          <!-- 定植日期 -->
          <div>
            <label class="block text-sm text-midnight-300 mb-1.5">定植日期</label>
            <input
              v-model="config.plantingDate"
              type="date"
              class="input-field"
            />
          </div>

          <!-- 种植密度 -->
          <div>
            <label class="block text-sm text-midnight-300 mb-1.5">种植密度 (株/ha)</label>
            <input
              v-model.number="config.plantingDensity"
              type="number"
              min="1000"
              max="30000"
              step="500"
              class="input-field"
            />
          </div>

          <!-- 目标采收期 -->
          <div>
            <label class="block text-sm text-midnight-300 mb-1.5">目标采收开始</label>
            <input
              type="date"
              class="input-field"
              :value="config.plantingDate"
              disabled
            />
            <p class="text-xs text-midnight-500 mt-1">根据品种和定植日期自动计算</p>
          </div>

          <!-- 当前配置预览 -->
          <div class="border-t border-midnight-600/30 pt-4">
            <h3 class="text-sm font-medium text-midnight-200 mb-3">配置预览</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-midnight-400">品种类型</span>
                <span class="text-midnight-200">{{ config.selectedCultivarFull ? cultivarType(config.selectedCultivarFull) : '-' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-midnight-400">最大LAI</span>
                <span class="text-midnight-200">{{ config.cultivarParams.maxLai }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-midnight-400">目标SSC</span>
                <span class="text-midnight-200">{{ config.cultivarParams.sscTarget }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-midnight-400">区域海拔</span>
                <span class="text-midnight-200">{{ config.selectedRegion?.elevation ?? '-' }}m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部：生成方案按钮 -->
    <div class="flex justify-center">
      <button
        class="strawberry-btn flex items-center gap-2 text-lg px-8 py-3"
        :disabled="!canGenerate"
        @click="generatePlan"
      >
        <Zap :size="20" />
        生成方案
        <ChevronRight :size="18" />
      </button>
    </div>
  </div>
</template>
