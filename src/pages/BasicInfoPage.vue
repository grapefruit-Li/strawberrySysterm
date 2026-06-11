<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import { useSimulation } from '@/composables/useSimulation'

const config = useConfigStore()
const simulation = useSimulation()
const router = useRouter()

/* 品种选项 */
const cultivarOptions = [
  { value: 'radiance', label: 'Florida Radiance', tag: '早熟型', traits: '早开花、果型均匀' },
  { value: 'brilliance', label: 'Florida Brilliance', tag: '高产型', traits: '高光合效率、大果型' },
]

/* 区域选项 */
const regionOptions = [
  { value: 'balm', label: '佛罗里达 Balm', temp: '年均22.5°C', rain: '年降雨1200mm' },
  { value: 'nanjing', label: '南京', temp: '年均15.7°C', rain: '年降雨1100mm' },
  { value: 'shanghai', label: '上海', temp: '年均16.1°C', rain: '年降雨1200mm' },
]

/* 灌溉方式选项 */
const irrigationOptions = [
  { value: 'drip', label: '滴灌' },
  { value: 'sprinkler', label: '喷灌' },
  { value: 'flood', label: '漫灌' },
]

/* 当前选中的品种 */
const selectedCultivar = ref('radiance')
const selectedRegion = ref('balm')
const selectedIrrigation = ref('drip')
const plantingDensity = ref(4.5)
const plantingDate = ref('2025-09-30')

/* 当前品种信息 */
const currentCultivar = computed(() => {
  return cultivarOptions.find(c => c.value === selectedCultivar.value)
})

/* 当前区域信息 */
const currentRegion = computed(() => {
  return regionOptions.find(r => r.value === selectedRegion.value)
})

/* 是否正在生成 */
const generating = ref(false)

/* 生成年度种植方案 */
async function generatePlan() {
  generating.value = true
  // 同步配置到store
  config.plantingDate = plantingDate.value
  config.plantingDensity = Math.round(plantingDensity.value * 1000)
  config.cultivarName = currentCultivar.value?.label || 'Florida Radiance'
  config.stationName = currentRegion.value?.label || '佛罗里达 Balm'

  // 加载预设数据
  if (config.weatherData.length === 0) {
    config.loadPreset()
  }

  // 运行模拟
  simulation.runFullSimulation()

  generating.value = false
  // 跳转到物候方案页
  router.push('/v2/phenology')
}
</script>

<template>
  <div class="basic-info-page">
    <!-- 页面标题 -->
    <div style="margin-bottom: 24px">
      <h1 class="page-title">基础信息</h1>
      <p class="page-subtitle">填写区域生成方案</p>
    </div>

    <!-- 3列卡片网格 -->
    <div class="fields-grid">
      <!-- 品种选择 -->
      <div class="field-card">
        <div class="card-label">
          🧬 品种 <span class="required">*</span>
        </div>
        <select v-model="selectedCultivar" class="form-select">
          <option v-for="opt in cultivarOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <div v-if="currentCultivar" class="variety-info">
          <span class="variety-tag">{{ currentCultivar.tag }}</span>
          <span style="font-size: 12px; color: var(--text-muted); margin-left: 8px">
            {{ currentCultivar.traits }}
          </span>
        </div>
      </div>

      <!-- 区域选择 -->
      <div class="field-card">
        <div class="card-label">
          📍 区域 <span class="required">*</span>
        </div>
        <select v-model="selectedRegion" class="form-select">
          <option v-for="opt in regionOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <div v-if="currentRegion" class="climate-info">
          <span style="font-size: 12px; color: var(--text-secondary)">
            🌡️ {{ currentRegion.temp }} | 🌧️ {{ currentRegion.rain }}
          </span>
        </div>
      </div>

      <!-- 定植日期 -->
      <div class="field-card">
        <div class="card-label">
          📅 定植日期 <span class="required">*</span>
        </div>
        <input
          v-model="plantingDate"
          type="date"
          class="form-input"
        />
      </div>

      <!-- 定植密度 -->
      <div class="field-card">
        <div class="card-label">
          🌱 定植密度 (株/m²)
        </div>
        <input
          v-model.number="plantingDensity"
          type="number"
          step="0.1"
          min="2"
          max="8"
          class="form-input"
        />
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 6px">
          参考: 4.0-5.0
        </div>
      </div>

      <!-- 灌溉条件 -->
      <div class="field-card">
        <div class="card-label">
          💧 灌溉条件
          <span class="card-badge recommended">推荐</span>
        </div>
        <select v-model="selectedIrrigation" class="form-select">
          <option v-for="opt in irrigationOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- 气象文件 -->
      <div class="field-card upload-card">
        <div class="card-label">
          ☁️ 气象文件
        </div>
        <div class="upload-area">
          <div style="font-size: 24px; margin-bottom: 8px">📄</div>
          <div style="font-size: 13px; color: var(--text-secondary)">点击上传 .WTH 文件</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px">支持 DSSAT 格式气象文件</div>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div style="margin-top: 32px; display: flex; justify-content: center">
      <button
        class="btn-primary"
        :disabled="generating"
        @click="generatePlan"
      >
        <span v-if="generating">⏳ 生成中...</span>
        <span v-else>✨ 生成年度种植方案</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.basic-info-page {
  max-width: 960px;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.variety-info {
  display: flex;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
}

.climate-info {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
}

.upload-card {
  display: flex;
  flex-direction: column;
}

.upload-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--border-light);
  border-radius: 8px;
  padding: 20px;
  margin-top: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: var(--accent-blue);
  background: var(--highlight-bg);
}
</style>
