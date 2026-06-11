import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import type { RegionConfig, CultivarFullParams, DailyWeather } from '@/engine/types'
import { strawberryCultivars } from '@/data/cultivars/strawberry-cultivars'
import { builtInRegions, generateWeather } from '@/data/regions/index'

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

/** 将 DailyWeather[] 转换为 WeatherRecord[] */
function convertWeatherData(daily: DailyWeather[]): WeatherRecord[] {
  return daily.map(d => {
    const dateStr = String(d.date)
    const formatted = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
    return {
      date: formatted,
      srad: d.srad,
      tmax: d.tmax,
      tmin: d.tmin,
      rain: d.rain,
      co2: 410,
    }
  })
}

/** 将日期字符串 (YYYY-MM-DD) 转换为数字 (YYYYMMDD) */
function dateStrToNum(dateStr: string): number {
  const parts = dateStr.split('-')
  return parseInt(parts[0]) * 10000 + parseInt(parts[1]) * 100 + parseInt(parts[2])
}

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

  /* V2 新增配置 */
  const cultivationMode = ref<'open-field' | 'greenhouse' | 'high-tunnel' | 'vertical'>('open-field')
  const irrigationMode = ref<'drip-mulch' | 'sprinkler' | 'flood' | 'rainfed'>('drip-mulch')
  const soilFertility = ref<'low' | 'medium' | 'high'>('medium')
  const seedlingQuality = ref<'strong' | 'medium' | 'weak'>('medium')

  /* 计算属性：品种列表 */
  const cultivarList = computed(() => strawberryCultivars)

  /* 计算属性：区域列表 */
  const regionList = computed(() => builtInRegions)

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
    // 同时生成该区域的气象数据
    const startDateNum = dateStrToNum(plantingDate.value)
    const dailyWeather = generateWeather(region, startDateNum, simulationDays.value)
    weatherData.value = convertWeatherData(dailyWeather)
  }

  /* 设置品种完整参数 */
  function setCultivarFull(cultivar: CultivarFullParams) {
    selectedCultivar.value = cultivar.code
    selectedCultivarFull.value = cultivar
    cultivarName.value = cultivar.name
    // 从 DSSAT CROPGRO 参数填充简化参数（V1 兼容）
    const tbase = cultivar.ecotypeParams.tbase
    const topt = cultivar.ecotypeParams.topt
    const avgDevTemp = (topt + tbase) / 2
    cultivarParams.emergenceDays = Math.round(cultivar.cultivarParams.p1v / avgDevTemp)
    cultivarParams.floweringDays = Math.round(cultivar.cultivarParams.p1r / avgDevTemp)
    cultivarParams.maturityDays = Math.round((cultivar.cultivarParams.p3 + cultivar.cultivarParams.p4) / avgDevTemp)
    cultivarParams.maxLai = cultivar.cultivarParams.laimax
    cultivarParams.potentialFruitWeight = cultivar.keyParams.avgFruitWeight
    cultivarParams.sscTarget = cultivar.keyParams.ssc
    cultivarParams.acidityTarget = 0.8 // 酸度使用默认值，DSSAT模型中由acidbase计算
  }

  /* 加载预设数据 */
  function loadPreset() {
    // 使用 generateWeather 生成气象数据
    const region = selectedRegion.value ?? builtInRegions[2] // 默认上海
    const startDateNum = dateStrToNum(plantingDate.value)
    const dailyWeather = generateWeather(region, startDateNum, simulationDays.value)
    weatherData.value = convertWeatherData(dailyWeather)

    // 如果尚未选择区域，设置默认区域
    if (!selectedRegion.value) {
      selectedRegion.value = region
      stationName.value = region.name
      stationLat.value = region.lat
      stationLon.value = region.lon
      stationElev.value = region.elevation
    }

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
    cultivationMode, irrigationMode, soilFertility, seedlingQuality,
    cultivarList, regionList,
    getRegions, setRegion, setCultivarFull, loadPreset,
    addSoilLayer, removeSoilLayer,
    addIrrigation, removeIrrigation, addFertilizer, removeFertilizer,
  }
})
