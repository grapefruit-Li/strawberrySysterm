import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type { RegionConfig, CultivarFullParams } from '@/engine/types'

/* 气象数据接口 */
export interface WeatherRecord {
  date: string
  srad: number    // 太阳辐射 MJ/m2
  tmax: number    // 最高温度 ℃
  tmin: number    // 最低温度 ℃
  rain: number    // 降水量 mm
  co2: number     // CO2浓度 ppm
}

/* 土壤层接口 */
export interface SoilLayer {
  id: string
  depth: number       // 深度 cm
  bulkDensity: number  // 容重 g/cm3
  sand: number         // 砂粒 %
  clay: number         // 粘粒 %
  om: number           // 有机质 %
  ph: number           // pH
  awc: number          // 有效含水量 cm3/cm3
}

/* 灌溉事件 */
export interface IrrigationEvent {
  id: string
  date: string
  amount: number  // mm
  method: string  // 灌溉方式
}

/* 施肥事件 */
export interface FertilizerEvent {
  id: string
  date: string
  amount: number    // kg/ha
  type: string      // 肥料类型
  nPct: number      // N含量 %
  pPct: number      // P含量 %
  kPct: number      // K含量 %
}

/* 内置区域列表 */
const builtInRegions: RegionConfig[] = [
  {
    id: 'florida',
    name: 'Florida',
    country: '美国',
    lat: 27.9,
    lon: -82.3,
    elevation: 15,
    avgTemp: 22.5,
    annualRain: 1300,
    growingSeason: '10月-5月',
    climateType: 'subtropical',
  },
  {
    id: 'california',
    name: 'California',
    country: '美国',
    lat: 36.7,
    lon: -119.8,
    elevation: 100,
    avgTemp: 14.5,
    annualRain: 400,
    growingSeason: '10月-7月',
    climateType: 'mediterranean',
  },
  {
    id: 'shanghai',
    name: '上海',
    country: '中国',
    lat: 31.2,
    lon: 121.5,
    elevation: 5,
    avgTemp: 16.5,
    annualRain: 1100,
    growingSeason: '9月-5月',
    climateType: 'subtropical-monsoon',
  },
  {
    id: 'kunming',
    name: '昆明',
    country: '中国',
    lat: 25.0,
    lon: 102.7,
    elevation: 1900,
    avgTemp: 15.0,
    annualRain: 1000,
    growingSeason: '9月-5月',
    climateType: 'subtropical-highland',
  },
]

/* 配置存储 */
export const useConfigStore = defineStore('config', () => {
  /* 气象配置 */
  const stationName = ref('南京')
  const stationLat = ref(32.0)
  const stationLon = ref(118.8)
  const stationElev = ref(10)
  const weatherData = ref<WeatherRecord[]>([])

  /* 土壤配置 */
  const soilName = ref('默认土壤')
  const soilLayers = ref<SoilLayer[]>([])

  /* 品种配置 */
  const cultivarName = ref('红颜')
  const cultivarParams = reactive({
    emergenceDays: 10,
    floweringDays: 30,
    maturityDays: 60,
    maxLai: 4.5,
    potentialFruitWeight: 25,
    sscTarget: 10,
    acidityTarget: 0.8,
  })

  /* 新增：选中的区域 */
  const selectedRegion = ref<RegionConfig | null>(null)

  /* 新增：选中的品种完整参数 */
  const selectedCultivarFull = ref<CultivarFullParams | null>(null)

  /* 新增：选中品种编码（用于BasicInfoPage选择状态） */
  const selectedCultivar = ref('')

  /* 新增：品种搜索和筛选 */
  const cultivarSearch = ref('')
  const cultivarTypeFilter = ref('')

  /* 新增：模拟天数 */
  const simulationDays = ref(180)

  /* 管理配置 */
  const plantingDate = ref('2025-03-01')
  const plantingDensity = ref(8000)
  const irrigationEvents = ref<IrrigationEvent[]>([])
  const fertilizerEvents = ref<FertilizerEvent[]>([])

  /* 获取内置区域列表 */
  function getRegions(): RegionConfig[] {
    return builtInRegions
  }

  /* 设置区域 */
  function setRegion(region: RegionConfig) {
    selectedRegion.value = region
    stationName.value = region.name
    stationLat.value = region.lat
    stationLon.value = region.lon
    stationElev.value = region.elevation
  }

  /* 设置品种完整参数 */
  function setCultivarFull(cultivar: CultivarFullParams) {
    selectedCultivar.value = cultivar.code
    selectedCultivarFull.value = cultivar
    cultivarName.value = cultivar.name
    cultivarParams.maxLai = cultivar.cultivarParams.laimax
    cultivarParams.potentialFruitWeight = cultivar.keyParams.avgFruitWeight
    cultivarParams.sscTarget = cultivar.keyParams.ssc
  }

  /* 加载预设数据 */
  function loadPreset() {
    // 根据定植日期和区域生成180天气象数据
    const startDate = new Date(plantingDate.value)
    const region = selectedRegion.value
    const baseTavg = region?.avgTemp ?? 16
    const baseAmp = region?.climateType === 'subtropical-highland' ? 8
      : region?.climateType === 'mediterranean' ? 10
      : region?.climateType === 'subtropical-monsoon' ? 9
      : 8

    const baseWeather: WeatherRecord[] = []
    for (let i = 0; i < 180; i++) {
      const d = new Date(startDate.getTime() + i * 86400000)
      const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000)
      // 正弦温度模型：基于年均温和年振幅
      const tempOffset = baseAmp * Math.sin((dayOfYear - 80) / 365 * 2 * Math.PI)
      const tavg = baseTavg + tempOffset
      const diurnalRange = 8 + Math.random() * 4
      const tmax = tavg + diurnalRange / 2
      const tmin = tavg - diurnalRange / 2
      // 降雨概率：根据气候类型调整
      const rainProb = region?.climateType === 'mediterranean' ? 0.15
        : region?.climateType === 'subtropical-monsoon' ? 0.35
        : 0.25
      const rain = Math.random() < rainProb ? Math.round(Math.random() * 25 * 10) / 10 : 0
      // 太阳辐射：受降雨影响
      const sradBase = 8 + 6 * Math.sin((dayOfYear - 80) / 365 * 2 * Math.PI)
      const srad = rain > 0 ? sradBase * 0.5 : sradBase + Math.random() * 3

      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      baseWeather.push({
        date: dateStr,
        srad: Math.round(srad * 10) / 10,
        tmax: Math.round(tmax * 10) / 10,
        tmin: Math.round(tmin * 10) / 10,
        rain,
        co2: 410,
      })
    }
    weatherData.value = baseWeather

    // 预设土壤层
    soilLayers.value = [
      {
        id: '1',
        depth: 20,
        bulkDensity: 1.2,
        sand: 40,
        clay: 25,
        om: 2.5,
        ph: 6.5,
        awc: 0.18,
      },
      {
        id: '2',
        depth: 40,
        bulkDensity: 1.35,
        sand: 35,
        clay: 30,
        om: 1.8,
        ph: 6.8,
        awc: 0.16,
      },
      {
        id: '3',
        depth: 60,
        bulkDensity: 1.45,
        sand: 30,
        clay: 35,
        om: 1.2,
        ph: 7.0,
        awc: 0.14,
      },
    ]

    // 预设灌溉事件
    irrigationEvents.value = [
      { id: '1', date: '2025-03-15', amount: 30, method: '滴灌' },
      { id: '2', date: '2025-04-01', amount: 25, method: '滴灌' },
    ]

    // 预设施肥事件
    fertilizerEvents.value = [
      { id: '1', date: '2025-03-05', amount: 150, type: '复合肥', nPct: 15, pPct: 15, kPct: 15 },
      { id: '2', date: '2025-04-10', amount: 100, type: '钾肥', nPct: 0, pPct: 0, kPct: 50 },
    ]
  }

  /* 添加土壤层 */
  function addSoilLayer() {
    const lastLayer = soilLayers.value[soilLayers.value.length - 1]
    soilLayers.value.push({
      id: String(Date.now()),
      depth: lastLayer ? lastLayer.depth + 20 : 20,
      bulkDensity: 1.4,
      sand: 35,
      clay: 30,
      om: 1.5,
      ph: 6.8,
      awc: 0.15,
    })
  }

  /* 移除土壤层 */
  function removeSoilLayer(id: string) {
    soilLayers.value = soilLayers.value.filter(l => l.id !== id)
  }

  /* 添加灌溉事件 */
  function addIrrigation() {
    irrigationEvents.value.push({
      id: String(Date.now()),
      date: '2025-04-15',
      amount: 20,
      method: '滴灌',
    })
  }

  /* 移除灌溉事件 */
  function removeIrrigation(id: string) {
    irrigationEvents.value = irrigationEvents.value.filter(e => e.id !== id)
  }

  /* 添加施肥事件 */
  function addFertilizer() {
    fertilizerEvents.value.push({
      id: String(Date.now()),
      date: '2025-05-01',
      amount: 80,
      type: '复合肥',
      nPct: 15,
      pPct: 15,
      kPct: 15,
    })
  }

  /* 移除施肥事件 */
  function removeFertilizer(id: string) {
    fertilizerEvents.value = fertilizerEvents.value.filter(e => e.id !== id)
  }

  return {
    stationName, stationLat, stationLon, stationElev, weatherData,
    soilName, soilLayers,
    cultivarName, cultivarParams,
    selectedRegion, selectedCultivar, selectedCultivarFull,
    plantingDate, plantingDensity, irrigationEvents, fertilizerEvents,
    cultivarSearch, cultivarTypeFilter, simulationDays,
    getRegions, setRegion, setCultivarFull, loadPreset,
    addSoilLayer, removeSoilLayer,
    addIrrigation, removeIrrigation, addFertilizer, removeFertilizer,
  }
})
