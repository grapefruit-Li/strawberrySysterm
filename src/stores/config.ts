import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

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

  /* 管理配置 */
  const plantingDate = ref('2025-03-01')
  const plantingDensity = ref(8000)
  const irrigationEvents = ref<IrrigationEvent[]>([])
  const fertilizerEvents = ref<FertilizerEvent[]>([])

  /* 加载预设数据 */
  function loadPreset() {
    // 预设气象数据（30天示例）
    const baseWeather: WeatherRecord[] = []
    for (let i = 0; i < 30; i++) {
      const day = i + 1
      const month = 3 // 3月
      baseWeather.push({
        date: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        srad: 12 + Math.random() * 8,
        tmax: 15 + Math.random() * 10,
        tmin: 5 + Math.random() * 5,
        rain: Math.random() > 0.7 ? Math.round(Math.random() * 20 * 10) / 10 : 0,
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
    plantingDate, plantingDensity, irrigationEvents, fertilizerEvents,
    loadPreset, addSoilLayer, removeSoilLayer,
    addIrrigation, removeIrrigation, addFertilizer, removeFertilizer,
  }
})
