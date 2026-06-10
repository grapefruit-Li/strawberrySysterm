<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import { useSimulation } from '@/composables/useSimulation'
import type { CultivarFullParams } from '@/engine/types'
import { strawberryCultivars } from '@/data/cultivars/strawberry-cultivars'
import { regions } from '@/data/regions'
import {
  Cherry,
  MapPin,
  Calendar,
  Search,
  CheckCircle2,
  Circle,
  Sparkles,
  Loader2,
} from 'lucide-vue-next'

const router = useRouter()
const config = useConfigStore()
const { runChainSimulation } = useSimulation()
const isGenerating = ref(false)

/* 品种筛选 */
const cultivarSearch = computed({
  get: () => config.cultivarSearch,
  set: (v) => { config.cultivarSearch = v },
})

const cultivarTypeFilter = computed({
  get: () => config.cultivarTypeFilter,
  set: (v) => { config.cultivarTypeFilter = v },
})

const filteredCultivars = computed<CultivarFullParams[]>(() => {
  return strawberryCultivars.filter(c => {
    const matchSearch = !cultivarSearch.value ||
      c.name.toLowerCase().includes(cultivarSearch.value.toLowerCase()) ||
      c.code.toLowerCase().includes(cultivarSearch.value.toLowerCase())
    const matchType = !cultivarTypeFilter.value || c.type === cultivarTypeFilter.value
    return matchSearch && matchType
  })
})

/* 选择品种 */
function selectCultivar(cultivar: CultivarFullParams) {
  config.selectedCultivar = cultivar.code
}

/* 选择区域 */
function selectRegion(regionId: string) {
  const region = regions.find(r => r.id === regionId)
  if (region) {
    config.selectedRegion = region
  }
}

/* 生成方案 */
async function generatePlan() {
  if (!config.selectedCultivar || !config.selectedRegion) return
  isGenerating.value = true
  config.simulationDays = 180
  await runChainSimulation()
  isGenerating.value = false
  router.push('/v2/phenology')
}
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-heading text-midnight-100 mb-1">基础信息</h1>
      <p class="text-midnight-300 text-sm">选择品种、区域和定植配置，启动链式决策引擎</p>
    </div>

    <!-- 品种选择 -->
    <div class="v2-card p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="v2-section-title flex items-center gap-2 mb-0">
          <Cherry :size="18" class="text-red-500" />
          选择品种
        </h2>
        <div class="flex items-center gap-3">
          <select
            v-model="cultivarTypeFilter"
            class="v2-input text-sm py-1.5 px-3"
          >
            <option value="">全部类型</option>
            <option value="短日型">短日型</option>
            <option value="日中性">日中性</option>
          </select>
          <div class="relative">
            <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-midnight-400" />
            <input
              v-model="cultivarSearch"
              type="text"
              placeholder="搜索品种..."
              class="v2-input pl-9 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2">
        <div
          v-for="c in filteredCultivars"
          :key="c.code"
          class="p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer relative"
          :class="config.selectedCultivar === c.code
            ? 'border-red-400 bg-red-50 shadow-md shadow-red-400/10'
            : 'border-gray-200 bg-white hover:border-midnight-600/40 hover:shadow-sm'"
          @click="selectCultivar(c)"
        >
          <CheckCircle2
            v-if="config.selectedCultivar === c.code"
            :size="18"
            class="absolute top-3 right-3 text-red-500"
          />
          <Circle
            v-else
            :size="18"
            class="absolute top-3 right-3 text-midnight-300"
          />

          <div class="flex items-center gap-2 mb-2">
            <span class="text-sm font-bold text-midnight-100">{{ c.name }}</span>
            <span class="text-xs px-2 py-0.5 rounded-full"
                  :class="c.type === '日中性' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'">
              {{ c.type }}
            </span>
          </div>

          <p class="text-xs text-midnight-300 mb-3 line-clamp-2">{{ c.fruitDesc }}</p>

          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="flex items-center gap-1 text-midnight-300">
              <span class="text-midnight-400">单果重</span>
              <span class="font-medium">{{ c.keyParams.avgFruitWeight }}g</span>
            </div>
            <div class="flex items-center gap-1 text-midnight-300">
              <span class="text-midnight-400">糖度</span>
              <span class="font-medium">{{ c.keyParams.ssc }}°Brix</span>
            </div>
            <div class="flex items-center gap-1 text-midnight-300">
              <span class="text-midnight-400">硬度</span>
              <span class="font-medium">{{ c.keyParams.firmness }}</span>
            </div>
            <div class="flex items-center gap-1 text-midnight-300">
              <span class="text-midnight-400">收获指数</span>
              <span class="font-medium">{{ c.keyParams.harvestIndex }}</span>
            </div>
            <div v-if="c.chillingRequirement !== undefined" class="flex items-center gap-1 text-midnight-300">
              <span class="text-midnight-400">需冷量</span>
              <span class="font-medium">{{ c.chillingRequirement }}h</span>
            </div>
            <div v-if="c.vegGdd !== undefined" class="flex items-center gap-1 text-midnight-300">
              <span class="text-midnight-400">营养积温</span>
              <span class="font-medium">{{ c.vegGdd }}°C·d</span>
            </div>
          </div>

          <div class="mt-3 flex items-center gap-1">
            <Sparkles :size="10" class="text-amber-400" />
            <span class="text-xs text-midnight-400">数据可信度 {{ c.reliability }}/5</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 种植区域 -->
    <div class="v2-card p-5">
      <h2 class="v2-section-title flex items-center gap-2">
        <MapPin :size="18" class="text-blue-500" />
        种植区域
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          v-for="r in regions"
          :key="r.id"
          class="p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer relative"
          :class="config.selectedRegion?.id === r.id
            ? 'border-blue-400 bg-blue-50 shadow-md shadow-blue-400/10'
            : 'border-gray-200 bg-white hover:border-midnight-600/40 hover:shadow-sm'"
          @click="selectRegion(r.id)"
        >
          <CheckCircle2
            v-if="config.selectedRegion?.id === r.id"
            :size="18"
            class="absolute top-3 right-3 text-blue-500"
          />
          <Circle
            v-else
            :size="18"
            class="absolute top-3 right-3 text-midnight-300"
          />

          <div class="flex items-center gap-2 mb-1">
            <MapPin :size="14" class="text-blue-500" />
            <span class="font-bold text-midnight-100">{{ r.name }}</span>
          </div>

          <div class="grid grid-cols-2 gap-1 text-xs text-midnight-300 mt-2">
            <div>年均温: {{ r.avgTemp }}°C</div>
            <div>年降雨: {{ r.annualRain }}mm</div>
            <div>生长季: {{ r.growingSeason }}</div>
            <div>纬度: {{ r.lat }}°</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 定植配置 -->
    <div class="v2-card p-5">
      <h2 class="v2-section-title flex items-center gap-2">
        <Calendar :size="18" class="text-green-500" />
        定植配置
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-midnight-200 mb-2">定植日期</label>
          <input v-model="config.plantingDate" type="date" class="v2-input w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-midnight-200 mb-2">种植密度 (株/m²)</label>
          <input
            v-model.number="config.plantingDensity"
            type="number"
            min="1"
            max="20"
            step="0.5"
            class="v2-input w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-midnight-200 mb-2">预计采收天数</label>
          <div class="v2-input w-full bg-midnight-800/80 flex items-center text-midnight-300">
            {{ config.simulationDays }} 天
          </div>
        </div>
      </div>

      <div class="mt-4 p-4 rounded-lg bg-midnight-800/80 border border-gray-200">
        <div class="flex items-center gap-2 mb-2">
          <Sparkles :size="14" class="text-amber-500" />
          <span class="text-sm font-medium text-midnight-200">配置预览</span>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span class="text-midnight-300">品种类型</span>
            <p class="font-medium text-midnight-100">{{ config.selectedCultivarFull?.type ?? '-' }}</p>
          </div>
          <div>
            <span class="text-midnight-300">最大LAI</span>
            <p class="font-medium text-midnight-100">{{ config.selectedCultivarFull?.cultivarParams.laimax ?? '-' }}</p>
          </div>
          <div>
            <span class="text-midnight-300">目标SSC</span>
            <p class="font-medium text-midnight-100">{{ config.selectedCultivarFull?.keyParams.ssc ?? '-' }}°Brix</p>
          </div>
          <div>
            <span class="text-midnight-300">区域海拔</span>
            <p class="font-medium text-midnight-100">{{ config.selectedRegion?.elevation ?? '-' }}m</p>
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <button
          :disabled="!config.selectedCultivar || !config.selectedRegion || isGenerating"
          class="v2-btn-primary flex items-center gap-2"
          @click="generatePlan"
        >
          <Loader2 v-if="isGenerating" :size="18" class="animate-spin" />
          <Sparkles v-else :size="18" />
          {{ isGenerating ? '生成方案中...' : '生成方案' }}
        </button>
      </div>
    </div>
  </div>
</template>
