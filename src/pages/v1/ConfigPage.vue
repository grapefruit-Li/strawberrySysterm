<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import { useSimulationStore } from '@/stores/simulation'
import { useSimulation } from '@/composables/useSimulation'
import type { CultivarFullParams, RegionConfig } from '@/engine/types'
import {
  CloudSun,
  Layers,
  Sprout,
  ClipboardList,
  Plus,
  Trash2,
  Upload,
  Play,
  Pencil,
  RotateCcw,
} from 'lucide-vue-next'

const config = useConfigStore()
const simulation = useSimulationStore()
const { runFullSimulation } = useSimulation()
const router = useRouter()

/* 当前激活的标签页 */
const activeTab = ref<'weather' | 'soil' | 'cultivar' | 'management'>('weather')

/* 品种下拉选中值（code） */
const selectedCultivarCode = ref(config.selectedCultivar || '')

/* 区域下拉选中值（id） */
const selectedRegionId = ref(config.selectedRegion?.id || '')

/* 品种参数编辑模式 */
const editingParams = ref(false)

/* 恢复默认品种参数 */
function resetCultivarParams() {
  if (config.selectedCultivarFull) {
    config.setCultivarFull(config.selectedCultivarFull)
  }
}

/* 种植密度本地值（株/m²），与 store 的 株/ha 换算 */
const plantingDensityLocal = computed({
  get: () => config.plantingDensity / 1000,
  set: (val: number) => { config.plantingDensity = val * 1000 },
})

/* 加载预设数据 */
onMounted(() => {
  if (config.weatherData.length === 0) {
    config.loadPreset()
  }
  // 同步下拉框初始值
  if (config.selectedCultivarFull) {
    selectedCultivarCode.value = config.selectedCultivarFull.code
  }
  if (config.selectedRegion) {
    selectedRegionId.value = config.selectedRegion.id
  }
})

/* 选择品种 */
function onCultivarSelect(code: string) {
  const cultivar = config.cultivarList.find((c: CultivarFullParams) => c.code === code)
  if (cultivar) {
    config.setCultivarFull(cultivar)
  }
}

/* 选择区域 */
function onRegionSelect(id: string) {
  const region = config.regionList.find((r: RegionConfig) => r.id === id)
  if (region) {
    config.setRegion(region)
  }
}

/* 开始模拟 */
function startSimulation() {
  runFullSimulation()
  router.push('/simulation')
}
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <h2 class="section-title mb-0">模拟配置</h2>
      <button class="strawberry-btn flex items-center gap-2" @click="startSimulation">
        <Play :size="16" />
        开始模拟
      </button>
    </div>

    <!-- 标签页导航 -->
    <div class="flex gap-1 border-b border-midnight-600/30">
      <button
        :class="activeTab === 'weather' ? 'tab-item-active' : 'tab-item'"
        @click="activeTab = 'weather'"
      >
        <CloudSun :size="14" class="inline mr-1.5 -mt-0.5" />
        气象
      </button>
      <button
        :class="activeTab === 'soil' ? 'tab-item-active' : 'tab-item'"
        @click="activeTab = 'soil'"
      >
        <Layers :size="14" class="inline mr-1.5 -mt-0.5" />
        土壤
      </button>
      <button
        :class="activeTab === 'cultivar' ? 'tab-item-active' : 'tab-item'"
        @click="activeTab = 'cultivar'"
      >
        <Sprout :size="14" class="inline mr-1.5 -mt-0.5" />
        品种
      </button>
      <button
        :class="activeTab === 'management' ? 'tab-item-active' : 'tab-item'"
        @click="activeTab = 'management'"
      >
        <ClipboardList :size="14" class="inline mr-1.5 -mt-0.5" />
        管理
      </button>
    </div>

    <!-- 气象配置 -->
    <div v-if="activeTab === 'weather'" class="space-y-4">
      <!-- 区域选择 -->
      <div class="glass-card p-5">
        <h3 class="text-sm font-semibold text-midnight-200 mb-4">区域选择</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-midnight-400 mb-1 block">种植区域</label>
            <select v-model="selectedRegionId" class="input-field" @change="onRegionSelect(selectedRegionId)">
              <option value="">请选择区域</option>
              <option v-for="region in config.regionList" :key="region.id" :value="region.id">
                {{ region.name }} ({{ region.country }})
              </option>
            </select>
          </div>
          <div v-if="config.selectedRegion" class="flex items-end">
            <div class="text-xs text-midnight-400 space-y-1">
              <p>气候类型：{{ config.selectedRegion.climateType }}</p>
              <p>年平均温度：{{ config.selectedRegion.avgTemp }}°C</p>
              <p>年降水量：{{ config.selectedRegion.annualRain }}mm</p>
              <p>种植季：{{ config.selectedRegion.growingSeason }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 站点信息 -->
      <div class="glass-card p-5">
        <h3 class="text-sm font-semibold text-midnight-200 mb-4">站点信息</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label class="text-xs text-midnight-400 mb-1 block">站点名称</label>
            <input v-model="config.stationName" class="input-field" />
          </div>
          <div>
            <label class="text-xs text-midnight-400 mb-1 block">纬度 (°)</label>
            <input v-model.number="config.stationLat" type="number" step="0.1" class="input-field" />
          </div>
          <div>
            <label class="text-xs text-midnight-400 mb-1 block">经度 (°)</label>
            <input v-model.number="config.stationLon" type="number" step="0.1" class="input-field" />
          </div>
          <div>
            <label class="text-xs text-midnight-400 mb-1 block">海拔 (m)</label>
            <input v-model.number="config.stationElev" type="number" class="input-field" />
          </div>
        </div>
      </div>

      <!-- 气象数据预览 -->
      <div class="glass-card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-midnight-200">逐日气象数据</h3>
          <span class="text-xs text-midnight-400">{{ config.weatherData.length }} 条记录</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-midnight-600/30">
                <th class="text-left py-2 px-3 text-midnight-400 font-medium">日期</th>
                <th class="text-right py-2 px-3 text-midnight-400 font-medium">辐射 (MJ/m²)</th>
                <th class="text-right py-2 px-3 text-midnight-400 font-medium">最高温 (℃)</th>
                <th class="text-right py-2 px-3 text-midnight-400 font-medium">最低温 (℃)</th>
                <th class="text-right py-2 px-3 text-midnight-400 font-medium">降水 (mm)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in config.weatherData.slice(0, 10)"
                :key="idx"
                class="border-b border-midnight-700/30 hover:bg-midnight-700/20"
              >
                <td class="py-2 px-3 text-midnight-200">{{ row.date }}</td>
                <td class="py-2 px-3 text-right text-midnight-300">{{ row.srad.toFixed(1) }}</td>
                <td class="py-2 px-3 text-right text-strawberry-400">{{ row.tmax.toFixed(1) }}</td>
                <td class="py-2 px-3 text-right text-blue-400">{{ row.tmin.toFixed(1) }}</td>
                <td class="py-2 px-3 text-right text-cyan-400">{{ row.rain.toFixed(1) }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="config.weatherData.length > 10" class="text-xs text-midnight-400 mt-2 text-center">
            仅显示前10条，共 {{ config.weatherData.length }} 条
          </p>
        </div>
      </div>

      <!-- 文件上传 -->
      <div class="glass-card p-5">
        <h3 class="text-sm font-semibold text-midnight-200 mb-4">导入气象文件</h3>
        <div class="drop-zone flex flex-col items-center gap-2">
          <Upload :size="24" class="text-midnight-400" />
          <p class="text-sm text-midnight-400">拖放 .WTH 文件到此处，或点击选择文件</p>
          <p class="text-xs text-midnight-400">支持 DSSAT 格式气象文件</p>
          <input type="file" accept=".WTH,.wth" class="hidden" />
        </div>
      </div>
    </div>

    <!-- 土壤配置 -->
    <div v-if="activeTab === 'soil'" class="space-y-4">
      <div class="glass-card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-midnight-200">土壤剖面</h3>
          <button class="ghost-btn flex items-center gap-1.5 text-sm" @click="config.addSoilLayer()">
            <Plus :size="14" />
            添加土层
          </button>
        </div>

        <div class="space-y-4">
          <div
            v-for="(layer, idx) in config.soilLayers"
            :key="layer.id"
            class="p-4 rounded-lg bg-midnight-700/30 border border-midnight-600/20"
          >
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-midnight-200">第 {{ idx + 1 }} 层</span>
              <button
                class="text-midnight-400 hover:text-strawberry-500 transition-colors"
                @click="config.removeSoilLayer(layer.id)"
              >
                <Trash2 :size="14" />
              </button>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label class="text-xs text-midnight-400 mb-1 block">深度 (cm)</label>
                <input v-model.number="layer.depth" type="number" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-midnight-400 mb-1 block">容重 (g/cm³)</label>
                <input v-model.number="layer.bulkDensity" type="number" step="0.01" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-midnight-400 mb-1 block">砂粒 (%)</label>
                <input v-model.number="layer.sand" type="number" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-midnight-400 mb-1 block">粘粒 (%)</label>
                <input v-model.number="layer.clay" type="number" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-midnight-400 mb-1 block">有机质 (%)</label>
                <input v-model.number="layer.om" type="number" step="0.1" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-midnight-400 mb-1 block">pH</label>
                <input v-model.number="layer.ph" type="number" step="0.1" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-midnight-400 mb-1 block">有效含水量</label>
                <input v-model.number="layer.awc" type="number" step="0.01" class="input-field" />
              </div>
            </div>
          </div>
        </div>

        <div v-if="config.soilLayers.length === 0" class="text-center py-8 text-midnight-400">
          <Layers :size="32" class="mx-auto mb-2 opacity-50" />
          <p class="text-sm">暂无土壤层，请点击"添加土层"或加载预设</p>
        </div>
      </div>
    </div>

    <!-- 品种配置 -->
    <div v-if="activeTab === 'cultivar'" class="space-y-4">
      <div class="glass-card p-5">
        <h3 class="text-sm font-semibold text-midnight-200 mb-4">品种选择</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-midnight-400 mb-1 block">品种名称</label>
            <select v-model="selectedCultivarCode" class="input-field" @change="onCultivarSelect(selectedCultivarCode)">
              <option value="">请选择品种</option>
              <option v-for="c in config.cultivarList" :key="c.code" :value="c.code">
                {{ c.name }} ({{ c.type }})
              </option>
            </select>
          </div>
          <div v-if="config.selectedCultivarFull" class="flex items-end">
            <div class="text-xs text-midnight-400 space-y-1">
              <p>类型：{{ config.selectedCultivarFull.type }}</p>
              <p>产地：{{ config.selectedCultivarFull.origin }}</p>
              <p>果实描述：{{ config.selectedCultivarFull.fruitDesc }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 品种参数详情 -->
      <div v-if="config.selectedCultivarFull" class="glass-card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-midnight-200">品种参数 (DSSAT CROPGRO)</h3>
          <div class="flex items-center gap-2">
            <button
              class="ghost-btn flex items-center gap-1.5 text-sm"
              :class="editingParams ? 'text-strawberry-400 border-strawberry-500/30' : ''"
              @click="editingParams = !editingParams"
            >
              <Pencil :size="14" />
              {{ editingParams ? '退出编辑' : '编辑参数' }}
            </button>
            <button
              v-if="editingParams"
              class="ghost-btn flex items-center gap-1.5 text-sm"
              @click="resetCultivarParams"
            >
              <RotateCcw :size="14" />
              恢复默认
            </button>
          </div>
        </div>

        <!-- 编辑模式警告 -->
        <div v-if="editingParams" class="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p class="text-xs text-amber-400">
            ⚠️ 修改品种参数将影响模拟结果的准确性。建议仅在了解 DSSAT 模型参数含义的情况下进行修改。
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-midnight-400 mb-1 block">出苗天数</label>
            <input
              v-model.number="config.cultivarParams.emergenceDays"
              type="number"
              class="input-field"
              :readonly="!editingParams"
              :class="editingParams ? '' : 'opacity-70'"
            />
          </div>
          <div>
            <label class="text-xs text-midnight-400 mb-1 block">开花天数</label>
            <input
              v-model.number="config.cultivarParams.floweringDays"
              type="number"
              class="input-field"
              :readonly="!editingParams"
              :class="editingParams ? '' : 'opacity-70'"
            />
          </div>
          <div>
            <label class="text-xs text-midnight-400 mb-1 block">成熟天数</label>
            <input
              v-model.number="config.cultivarParams.maturityDays"
              type="number"
              class="input-field"
              :readonly="!editingParams"
              :class="editingParams ? '' : 'opacity-70'"
            />
          </div>
          <div>
            <label class="text-xs text-midnight-400 mb-1 block">最大LAI</label>
            <input
              v-model.number="config.cultivarParams.maxLai"
              type="number"
              step="0.1"
              class="input-field"
              :readonly="!editingParams"
              :class="editingParams ? '' : 'opacity-70'"
            />
          </div>
          <div>
            <label class="text-xs text-midnight-400 mb-1 block">潜在果重 (g)</label>
            <input
              v-model.number="config.cultivarParams.potentialFruitWeight"
              type="number"
              class="input-field"
              :readonly="!editingParams"
              :class="editingParams ? '' : 'opacity-70'"
            />
          </div>
          <div>
            <label class="text-xs text-midnight-400 mb-1 block">目标可溶性固形物 (%)</label>
            <input
              v-model.number="config.cultivarParams.sscTarget"
              type="number"
              step="0.1"
              class="input-field"
              :readonly="!editingParams"
              :class="editingParams ? '' : 'opacity-70'"
            />
          </div>
          <div>
            <label class="text-xs text-midnight-400 mb-1 block">目标酸度 (%)</label>
            <input
              v-model.number="config.cultivarParams.acidityTarget"
              type="number"
              step="0.1"
              class="input-field"
              :readonly="!editingParams"
              :class="editingParams ? '' : 'opacity-70'"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 管理配置 -->
    <div v-if="activeTab === 'management'" class="space-y-4">
      <!-- 种植信息 -->
      <div class="glass-card p-5">
        <h3 class="text-sm font-semibold text-midnight-200 mb-4">种植信息</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-midnight-400 mb-1 block">定植日期</label>
            <input v-model="config.plantingDate" type="date" class="input-field" />
          </div>
          <div>
            <label class="text-xs text-midnight-400 mb-1 block">种植密度 (株/m²)</label>
            <input v-model.number="plantingDensityLocal" type="number" step="0.1" class="input-field" />
          </div>
        </div>
      </div>

      <!-- 灌溉事件 -->
      <div class="glass-card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-midnight-200">灌溉事件</h3>
          <button class="ghost-btn flex items-center gap-1.5 text-sm" @click="config.addIrrigation()">
            <Plus :size="14" />
            添加灌溉
          </button>
        </div>
        <div class="space-y-2">
          <div
            v-for="evt in config.irrigationEvents"
            :key="evt.id"
            class="flex items-center gap-3 p-3 rounded-lg bg-midnight-700/30"
          >
            <input v-model="evt.date" type="date" class="input-field flex-1" />
            <input v-model.number="evt.amount" type="number" class="input-field w-24" placeholder="mm" />
            <select v-model="evt.method" class="input-field w-28">
              <option value="滴灌">滴灌</option>
              <option value="喷灌">喷灌</option>
              <option value="漫灌">漫灌</option>
            </select>
            <button
              class="text-midnight-400 hover:text-strawberry-500 transition-colors"
              @click="config.removeIrrigation(evt.id)"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
        <p v-if="config.irrigationEvents.length === 0" class="text-sm text-midnight-400 text-center py-4">
          暂无灌溉事件
        </p>
      </div>

      <!-- 施肥事件 -->
      <div class="glass-card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-midnight-200">施肥事件</h3>
          <button class="ghost-btn flex items-center gap-1.5 text-sm" @click="config.addFertilizer()">
            <Plus :size="14" />
            添加施肥
          </button>
        </div>
        <div class="space-y-2">
          <div
            v-for="evt in config.fertilizerEvents"
            :key="evt.id"
            class="flex items-center gap-3 p-3 rounded-lg bg-midnight-700/30"
          >
            <input v-model="evt.date" type="date" class="input-field flex-1" />
            <input v-model.number="evt.amount" type="number" class="input-field w-24" placeholder="kg/ha" />
            <input v-model="evt.type" class="input-field w-24" placeholder="类型" />
            <button
              class="text-midnight-400 hover:text-strawberry-500 transition-colors"
              @click="config.removeFertilizer(evt.id)"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
        <p v-if="config.fertilizerEvents.length === 0" class="text-sm text-midnight-400 text-center py-4">
          暂无施肥事件
        </p>
      </div>
    </div>
  </div>
</template>
