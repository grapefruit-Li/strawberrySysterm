<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import { useSimulation } from '@/composables/useSimulation'
import type { CultivarFullParams, RegionConfig } from '@/engine/types'

const config = useConfigStore()
const simulation = useSimulation()
const router = useRouter()

/* 品种选项 - 从config store获取 */
const cultivarOptions = computed(() => {
  return config.cultivarList.map(c => ({
    value: c.code,
    label: `${c.name} (${c.origin} ${c.type})`,
    cultivar: c,
  }))
})

/* 秧苗状态选项 */
const seedlingOptions = [
  { value: 'strong', label: '健壮壮苗, 4-5片展开叶' },
  { value: 'medium', label: '中等苗, 3-4片展开叶' },
  { value: 'weak', label: '弱苗, 2-3片展开叶' },
]

/* 区域选项 - 从config store获取 */
const regionOptions = computed(() => {
  return config.regionList.map(r => ({
    value: r.id,
    label: `${r.name} (${r.country} ${r.climateType})`,
    region: r,
  }))
})

/* 栽培模式选项 */
const cultivationOptions = [
  { value: 'open-field', label: '露地栽培' },
  { value: 'greenhouse', label: '温室栽培' },
  { value: 'high-tunnel', label: '高隧道栽培' },
  { value: 'vertical', label: '立体栽培' },
]

/* 灌溉方式选项 */
const irrigationOptions = [
  { value: 'drip-mulch', label: '膜下滴灌' },
  { value: 'sprinkler', label: '喷灌' },
  { value: 'flood', label: '漫灌' },
  { value: 'rainfed', label: '雨养' },
]

/* 土壤肥力选项 */
const soilFertilityOptions = [
  { value: 'medium', label: '中肥力 有机质1-2%' },
  { value: 'high', label: '高肥力 有机质>2%' },
  { value: 'low', label: '低肥力 有机质<1%' },
]

/* 当前选中 */
const selectedCultivar = ref(config.selectedCultivar || 'FL-RADIANCE')
const selectedSeedling = ref(config.seedlingQuality)
const selectedRegion = ref(config.selectedRegion?.id || 'FL-BALM')
const selectedCultivation = ref(config.cultivationMode)
const selectedIrrigation = ref(config.irrigationMode)
const selectedSoilFertility = ref(config.soilFertility)
const plantingDensity = ref(config.plantingDensity / 1000 || 4.3)
const plantingDate = ref(config.plantingDate)

/* 当前品种信息 */
const currentCultivar = computed(() => {
  const opt = cultivarOptions.value.find(c => c.value === selectedCultivar.value)
  return opt?.cultivar ?? null
})

/* 当前区域信息 */
const currentRegion = computed(() => {
  const opt = regionOptions.value.find(r => r.value === selectedRegion.value)
  return opt?.region ?? null
})

/* 品种标签 */
const cultivarTags = computed(() => {
  if (!currentCultivar.value) return []
  const tags: string[] = [currentCultivar.value.type]
  if (currentCultivar.value.origin) tags.push(currentCultivar.value.origin)
  return tags
})

/* 品种特性描述 */
const cultivarTraits = computed(() => {
  return currentCultivar.value?.fruitDesc ?? ''
})

/* 同步管理选项到store */
watch(selectedCultivation, (v) => { config.cultivationMode = v as any })
watch(selectedIrrigation, (v) => { config.irrigationMode = v as any })
watch(selectedSoilFertility, (v) => { config.soilFertility = v as any })
watch(selectedSeedling, (v) => { config.seedlingQuality = v as any })

/* 是否正在生成 */
const generating = ref(false)

/* 生成年度种植方案 */
async function generatePlan() {
  generating.value = true
  // 同步配置到store
  config.plantingDate = plantingDate.value
  config.plantingDensity = Math.round(plantingDensity.value * 1000)

  // 设置品种
  if (currentCultivar.value) {
    config.setCultivarFull(currentCultivar.value)
  }

  // 设置区域
  if (currentRegion.value) {
    config.setRegion(currentRegion.value)
  }

  // 加载预设数据
  if (config.weatherData.length === 0) {
    config.loadPreset()
  }

  // 运行链式模拟
  simulation.runChainSimulation()

  generating.value = false
  // 跳转到物候方案页
  router.push('/v2/phenology')
}
</script>

<template>
  <div class="basic-info-page">
    <div class="page-header">
      <h2 class="page-title">基础信息</h2>
      <p class="page-subtitle">填写区域生成方案</p>
    </div>

    <div class="cards-grid">
      <!-- 种植品种卡片 -->
      <div class="field-card">
        <div class="card-header">
          <label class="card-label"><span class="required">*</span> 种植品种</label>
        </div>
        <div class="select-wrapper">
          <select v-model="selectedCultivar" class="form-select">
            <option v-for="opt in cultivarOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div v-if="currentCultivar" class="variety-info">
          <div class="variety-info-row">
            <span v-for="tag in cultivarTags" :key="tag" class="variety-tag">{{ tag }}</span>
          </div>
          <div class="variety-info-row">
            <span class="variety-info-label">品种特性:</span>
            <span class="variety-info-value">{{ cultivarTraits }}</span>
          </div>
          <div v-if="currentCultivar.keyParams" class="variety-info-row">
            <span class="variety-info-label">单果重:</span>
            <span class="variety-info-value">{{ currentCultivar.keyParams.avgFruitWeight }}g</span>
            <span class="variety-info-label" style="margin-left:8px">糖度:</span>
            <span class="variety-info-value">{{ currentCultivar.keyParams.ssc }}%</span>
            <span class="variety-info-label" style="margin-left:8px">硬度:</span>
            <span class="variety-info-value">{{ currentCultivar.keyParams.firmness }}N</span>
          </div>
        </div>
      </div>

      <!-- 定植日期卡片 -->
      <div class="field-card">
        <div class="card-header">
          <label class="card-label"><span class="required">*</span> 定植日期</label>
        </div>
        <input type="date" v-model="plantingDate" class="form-input" />
      </div>

      <!-- 秧苗状态卡片 -->
      <div class="field-card">
        <div class="card-header">
          <label class="card-label"><span class="required">*</span> 秧苗状态</label>
        </div>
        <div class="select-wrapper">
          <select v-model="selectedSeedling" class="form-select">
            <option v-for="opt in seedlingOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- 种植区域卡片 -->
      <div class="field-card">
        <div class="card-header">
          <label class="card-label"><span class="required">*</span> 种植区域</label>
        </div>
        <div class="select-wrapper">
          <select v-model="selectedRegion" class="form-select">
            <option v-for="opt in regionOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div v-if="currentRegion" class="climate-info">
          <div class="climate-item"><span class="icon">🌡️</span><span>{{ currentRegion.name }}: {{ currentRegion.avgTemp }}°C</span></div>
          <div class="climate-divider"></div>
          <div class="climate-item"><span class="icon">🌧️</span><span>降雨 {{ currentRegion.annualRain }}mm</span></div>
        </div>
      </div>

      <!-- 定植密度卡片 -->
      <div class="field-card">
        <div class="card-header">
          <label class="card-label"><span class="required">*</span> 定植密度 (株/m²)</label>
        </div>
        <div class="input-with-hint">
          <input type="number" v-model.number="plantingDensity" class="form-input" step="0.1" min="3" max="6" />
          <span class="input-hint">参考: 4.0-5.0</span>
        </div>
      </div>

      <!-- 栽培模式卡片 -->
      <div class="field-card">
        <div class="card-header">
          <label class="card-label"><span class="required">*</span> 栽培模式</label>
        </div>
        <div class="select-wrapper">
          <select v-model="selectedCultivation" class="form-select">
            <option v-for="opt in cultivationOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- 灌溉条件卡片 -->
      <div class="field-card">
        <div class="card-header">
          <label class="card-label"><span class="required">*</span> 灌溉条件</label>
          <span class="card-badge recommended">推荐</span>
        </div>
        <div class="select-wrapper">
          <select v-model="selectedIrrigation" class="form-select">
            <option v-for="opt in irrigationOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- 土壤肥力卡片 -->
      <div class="field-card">
        <div class="card-header">
          <label class="card-label"><span class="required">*</span> 土壤肥力</label>
        </div>
        <div class="select-wrapper">
          <select v-model="selectedSoilFertility" class="form-select">
            <option v-for="opt in soilFertilityOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- 气象文件卡片 (full-width) -->
      <div class="field-card full-width">
        <div class="card-header">
          <label class="card-label">气象文件 (可选)</label>
          <span class="card-badge">DSSAT格式</span>
        </div>
        <div class="file-upload-card">
          <div class="upload-icon">☁️</div>
          <div class="upload-text">点击上传 DSSAT 气象文件</div>
          <div class="upload-hint">支持 .WTH, .CLI 格式</div>
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button class="btn-primary" :disabled="generating" @click="generatePlan">
        <span v-if="generating">⏳ 生成中...</span>
        <span v-else><span>✨</span> 生成年度种植方案</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.basic-info-page {
  max-width: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.select-wrapper {
  position: relative;
}

.variety-info {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.variety-info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.variety-info-row:last-child {
  margin-bottom: 0;
}

.variety-info-label {
  font-size: 12px;
  color: var(--text-muted);
}

.variety-info-value {
  font-size: 12px;
  color: var(--text-secondary);
}

.climate-info {
  display: flex;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
  gap: 12px;
}

.climate-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.climate-item .icon {
  font-size: 14px;
}

.climate-divider {
  width: 1px;
  height: 14px;
  background-color: var(--border-color);
}

.input-with-hint {
  position: relative;
}

.input-hint {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 6px;
}

.full-width {
  grid-column: 1 / -1;
}

.file-upload-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border: 2px dashed var(--border-light);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.file-upload-card:hover {
  border-color: var(--accent-blue);
  background: var(--highlight-bg);
}

.upload-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.upload-hint {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}

.form-actions {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}
</style>
