<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import { useSimulation } from '@/composables/useSimulation'
import { strawberryCultivars } from '@/data/cultivars/strawberry-cultivars'
import type { CultivarFullParams, RegionConfig } from '@/engine/types'
import { ChevronDown, Sparkles, FileText, MapPin, Sprout } from 'lucide-vue-next'

const router = useRouter()
const configStore = useConfigStore()
const { runChainSimulation } = useSimulation()

/* 表单数据 */
const selectedCultivarCode = ref(configStore.selectedCultivar || '')
const plantingDate = ref(configStore.plantingDate || '2025-10-15')
const seedlingStatus = ref('健壮苗')
const selectedRegionId = ref(configStore.selectedRegion?.id || '')
const plantingDensity = ref(configStore.plantingDensity ? configStore.plantingDensity / 1000 : 4.5)
const cultivationMode = ref('设施栽培')
const irrigationCondition = ref('膜下滴灌')
const soilFertility = ref('中肥力(有机质1-2%)')
const weatherFilePath = ref('')

/* 品种列表 */
const cultivars = strawberryCultivars

/* 区域列表 */
const regions = computed(() => configStore.getRegions())

/* 当前选中的品种对象 */
const currentCultivar = computed<CultivarFullParams | null>(() => {
  if (!selectedCultivarCode.value) return null
  return cultivars.find(c => c.code === selectedCultivarCode.value) || null
})

/* 当前选中的区域对象 */
const currentRegion = computed<RegionConfig | null>(() => {
  if (!selectedRegionId.value) return null
  return regions.value.find(r => r.id === selectedRegionId.value) || null
})

/* 气候类型中文映射 */
const climateTypeMap: Record<string, string> = {
  'subtropical': '亚热带',
  'mediterranean': '地中海',
  'subtropical-monsoon': '亚热带季风',
  'subtropical-highland': '亚热带高原',
}

/* 品种类型标签颜色 */
function cultivarTypeClass(type: string) {
  return type === '短日型'
    ? 'bg-blue-500/20 text-blue-300'
    : 'bg-amber-500/20 text-amber-300'
}

/* 选择品种 */
function onCultivarChange() {
  const cultivar = cultivars.find(c => c.code === selectedCultivarCode.value)
  if (cultivar) {
    configStore.setCultivarFull(cultivar)
  }
}

/* 选择区域 */
function onRegionChange() {
  const region = regions.value.find(r => r.id === selectedRegionId.value)
  if (region) {
    configStore.setRegion(region)
  }
}

/* 生成方案 */
const isGenerating = ref(false)
async function handleGenerate() {
  if (!currentCultivar.value || !currentRegion.value) return

  /* 同步表单数据到 store */
  configStore.plantingDate = plantingDate.value
  configStore.plantingDensity = Math.round(plantingDensity.value * 1000)

  isGenerating.value = true
  try {
    configStore.loadPreset()
    runChainSimulation()
    router.push('/v2/phenology')
  } finally {
    isGenerating.value = false
  }
}

/* 表单是否可提交 */
const canGenerate = computed(() => !!currentCultivar.value && !!currentRegion.value && !!plantingDate.value)
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- 可滚动内容区 -->
    <div class="flex-1 overflow-y-auto pb-28">
      <!-- 页面标题 -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-heading text-2xl text-midnight-100">基础信息</h2>
        <span class="px-3 py-1 rounded-full text-xs font-medium bg-strawberry-500/20 text-strawberry-300">
          填写后生成方案
        </span>
      </div>

      <!-- 表单卡片 -->
      <div class="bg-midnight-800/60 backdrop-blur-md border border-midnight-600/30 rounded-xl p-6 space-y-6">

        <!-- 第一行：品种、定植日期、秧苗状态、种植区域 -->
        <div class="grid grid-cols-4 gap-5">
          <!-- 品种 -->
          <div class="space-y-1">
            <label class="text-xs text-midnight-400 mb-1 block">品种</label>
            <div class="relative">
              <select
                v-model="selectedCultivarCode"
                class="w-full bg-midnight-800/80 border border-midnight-600/40 rounded-lg px-4 py-2.5 text-midnight-100 appearance-none focus:outline-none focus:border-strawberry-500/50 cursor-pointer"
                @change="onCultivarChange"
              >
                <option value="" disabled class="bg-midnight-800 text-midnight-400">选择品种</option>
                <option
                  v-for="c in cultivars"
                  :key="c.code"
                  :value="c.code"
                  class="bg-midnight-800 text-midnight-100"
                >
                  {{ c.name }}
                </option>
              </select>
              <ChevronDown :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-400 pointer-events-none" />
            </div>
          </div>

          <!-- 定植日期 -->
          <div class="space-y-1">
            <label class="text-xs text-midnight-400 mb-1 block">定植日期</label>
            <input
              v-model="plantingDate"
              type="date"
              class="w-full bg-midnight-800/80 border border-midnight-600/40 rounded-lg px-4 py-2.5 text-midnight-100 focus:outline-none focus:border-strawberry-500/50"
            />
          </div>

          <!-- 秧苗状态 -->
          <div class="space-y-1">
            <label class="text-xs text-midnight-400 mb-1 block">秧苗状态</label>
            <div class="relative">
              <select
                v-model="seedlingStatus"
                class="w-full bg-midnight-800/80 border border-midnight-600/40 rounded-lg px-4 py-2.5 text-midnight-100 appearance-none focus:outline-none focus:border-strawberry-500/50 cursor-pointer"
              >
                <option value="健壮苗" class="bg-midnight-800 text-midnight-100">健壮苗</option>
                <option value="一般苗" class="bg-midnight-800 text-midnight-100">一般苗</option>
                <option value="弱苗" class="bg-midnight-800 text-midnight-100">弱苗</option>
              </select>
              <ChevronDown :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-400 pointer-events-none" />
            </div>
          </div>

          <!-- 种植区域 -->
          <div class="space-y-1">
            <label class="text-xs text-midnight-400 mb-1 block">种植区域</label>
            <div class="relative">
              <select
                v-model="selectedRegionId"
                class="w-full bg-midnight-800/80 border border-midnight-600/40 rounded-lg px-4 py-2.5 text-midnight-100 appearance-none focus:outline-none focus:border-strawberry-500/50 cursor-pointer"
                @change="onRegionChange"
              >
                <option value="" disabled class="bg-midnight-800 text-midnight-400">选择区域</option>
                <option
                  v-for="r in regions"
                  :key="r.id"
                  :value="r.id"
                  class="bg-midnight-800 text-midnight-100"
                >
                  {{ r.name }} · {{ climateTypeMap[r.climateType] || r.climateType }}
                </option>
              </select>
              <ChevronDown :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <!-- 选中品种后显示的参数标签 -->
        <div v-if="currentCultivar" class="bg-midnight-700/50 rounded-lg p-3">
          <div class="flex items-center gap-2 mb-2">
            <Sprout :size="14" class="text-strawberry-400" />
            <span class="text-sm font-medium text-midnight-200">{{ currentCultivar.name }}</span>
            <span
              class="px-2 py-0.5 rounded text-xs font-medium"
              :class="cultivarTypeClass(currentCultivar.type)"
            >
              {{ currentCultivar.type }}
            </span>
            <span class="text-xs text-midnight-400">{{ currentCultivar.origin }}</span>
          </div>
          <p class="text-xs text-midnight-400 mb-2">{{ currentCultivar.fruitDesc }}</p>
          <div class="flex items-center gap-4 text-xs">
            <span class="text-midnight-300">
              均果重 <span class="text-midnight-100 font-medium">{{ currentCultivar.keyParams.avgFruitWeight }}g</span>
            </span>
            <span class="text-midnight-300">
              糖度 <span class="text-midnight-100 font-medium">{{ currentCultivar.keyParams.ssc }}°Brix</span>
            </span>
            <span class="text-midnight-300">
              硬度 <span class="text-midnight-100 font-medium">{{ currentCultivar.keyParams.firmness }}</span>
            </span>
            <span class="text-midnight-300">
              收获指数 <span class="text-midnight-100 font-medium">{{ currentCultivar.keyParams.harvestIndex }}</span>
            </span>
            <span v-if="currentCultivar.chillingRequirement" class="text-midnight-300">
              需冷量 <span class="text-midnight-100 font-medium">{{ currentCultivar.chillingRequirement }}h</span>
            </span>
            <span v-if="currentCultivar.vegGdd" class="text-midnight-300">
              营养积温 <span class="text-midnight-100 font-medium">{{ currentCultivar.vegGdd }}°C·d</span>
            </span>
          </div>
        </div>

        <!-- 选中区域后显示的气候标签 -->
        <div v-if="currentRegion" class="bg-midnight-700/50 rounded-lg p-3">
          <div class="flex items-center gap-2 mb-2">
            <MapPin :size="14" class="text-strawberry-400" />
            <span class="text-sm font-medium text-midnight-200">{{ currentRegion.name }}</span>
            <span class="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-300">
              {{ climateTypeMap[currentRegion.climateType] || currentRegion.climateType }}
            </span>
            <span class="text-xs text-midnight-400">{{ currentRegion.country }}</span>
          </div>
          <div class="flex items-center gap-4 text-xs">
            <span class="text-midnight-300">
              Tavg <span class="text-midnight-100 font-medium">{{ currentRegion.avgTemp }}°C</span>
            </span>
            <span class="text-midnight-300">
              年降水 <span class="text-midnight-100 font-medium">{{ currentRegion.annualRain }}mm</span>
            </span>
            <span class="text-midnight-300">
              生长季 <span class="text-midnight-100 font-medium">{{ currentRegion.growingSeason }}</span>
            </span>
            <span class="text-midnight-300">
              海拔 <span class="text-midnight-100 font-medium">{{ currentRegion.elevation }}m</span>
            </span>
          </div>
        </div>

        <!-- 第二行：定植密度、栽培模式、灌溉条件、土壤肥力 -->
        <div class="grid grid-cols-4 gap-5">
          <!-- 定植密度 -->
          <div class="space-y-1">
            <label class="text-xs text-midnight-400 mb-1 block">定植密度</label>
            <div class="relative">
              <input
                v-model.number="plantingDensity"
                type="number"
                step="0.1"
                min="1"
                max="12"
                class="w-full bg-midnight-800/80 border border-midnight-600/40 rounded-lg px-4 py-2.5 text-midnight-100 focus:outline-none focus:border-strawberry-500/50 pr-16"
                placeholder="4.5"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-midnight-400">株/m²</span>
            </div>
            <p class="text-xs text-midnight-500 mt-0.5">推荐 4.0-5.0</p>
          </div>

          <!-- 栽培模式 -->
          <div class="space-y-1">
            <label class="text-xs text-midnight-400 mb-1 block">栽培模式</label>
            <div class="relative">
              <select
                v-model="cultivationMode"
                class="w-full bg-midnight-800/80 border border-midnight-600/40 rounded-lg px-4 py-2.5 text-midnight-100 appearance-none focus:outline-none focus:border-strawberry-500/50 cursor-pointer"
              >
                <option value="露地栽培" class="bg-midnight-800 text-midnight-100">露地栽培</option>
                <option value="设施栽培" class="bg-midnight-800 text-midnight-100">设施栽培</option>
                <option value="高架栽培" class="bg-midnight-800 text-midnight-100">高架栽培</option>
              </select>
              <ChevronDown :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-400 pointer-events-none" />
            </div>
          </div>

          <!-- 灌溉条件 -->
          <div class="space-y-1">
            <label class="text-xs text-midnight-400 mb-1 block">灌溉条件</label>
            <div class="relative">
              <select
                v-model="irrigationCondition"
                class="w-full bg-midnight-800/80 border border-midnight-600/40 rounded-lg px-4 py-2.5 text-midnight-100 appearance-none focus:outline-none focus:border-strawberry-500/50 cursor-pointer"
              >
                <option value="膜下滴灌(推荐)" class="bg-midnight-800 text-midnight-100">膜下滴灌(推荐)</option>
                <option value="微喷灌" class="bg-midnight-800 text-midnight-100">微喷灌</option>
                <option value="地表灌溉" class="bg-midnight-800 text-midnight-100">地表灌溉</option>
              </select>
              <ChevronDown :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-400 pointer-events-none" />
            </div>
          </div>

          <!-- 土壤肥力 -->
          <div class="space-y-1">
            <label class="text-xs text-midnight-400 mb-1 block">土壤肥力</label>
            <div class="relative">
              <select
                v-model="soilFertility"
                class="w-full bg-midnight-800/80 border border-midnight-600/40 rounded-lg px-4 py-2.5 text-midnight-100 appearance-none focus:outline-none focus:border-strawberry-500/50 cursor-pointer"
              >
                <option value="高肥力(有机质>2%)" class="bg-midnight-800 text-midnight-100">高肥力(有机质>2%)</option>
                <option value="中肥力(有机质1-2%)" class="bg-midnight-800 text-midnight-100">中肥力(有机质1-2%)</option>
                <option value="低肥力(有机质<1%)" class="bg-midnight-800 text-midnight-100">低肥力(有机质<1%)</option>
              </select>
              <ChevronDown :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <!-- 第三行：气象文件（通栏） -->
        <div class="space-y-1">
          <label class="text-xs text-midnight-400 mb-1 block">气象文件</label>
          <div class="relative">
            <FileText :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-midnight-400 pointer-events-none" />
            <input
              v-model="weatherFilePath"
              type="text"
              class="w-full bg-midnight-800/80 border border-midnight-600/40 rounded-lg pl-10 pr-4 py-2.5 text-midnight-100 placeholder-midnight-400 focus:outline-none focus:border-strawberry-500/50"
              placeholder="已有 DSSAT 气象文件路径，或留空使用区域气候模型"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 底部固定按钮 -->
    <div class="fixed bottom-0 right-0 left-60 z-10 pointer-events-none">
      <div class="mx-6 mb-6 pointer-events-auto">
        <button
          :disabled="!canGenerate || isGenerating"
          class="w-full py-3.5 rounded-xl text-white font-medium text-base transition-all duration-300 flex items-center justify-center gap-2"
          :class="canGenerate && !isGenerating
            ? 'bg-gradient-to-r from-strawberry-600 to-strawberry-500 hover:from-strawberry-500 hover:to-strawberry-400 shadow-lg shadow-strawberry-500/25 cursor-pointer'
            : 'bg-midnight-700/60 text-midnight-400 cursor-not-allowed'"
          @click="handleGenerate"
        >
          <Sparkles v-if="!isGenerating" :size="18" />
          <svg v-else class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          {{ isGenerating ? '正在生成方案...' : '生成年度种植方案' }}
        </button>
      </div>
    </div>
  </div>
</template>
