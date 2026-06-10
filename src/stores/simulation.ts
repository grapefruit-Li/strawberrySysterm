import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PestRiskRecord, FarmOperation, PhenologyEvent } from '@/engine/types'

/* 模拟状态类型 */
export type SimulationStatus = 'idle' | 'running' | 'paused' | 'complete'

/* 每日模拟结果 */
export interface DailyResult {
  day: number
  date: string
  growthStage: string
  lai: number
  totalBiomass: number    // kg/ha
  leafWeight: number
  stemWeight: number
  rootWeight: number
  fruitWeight: number
  waterStress: number     // 0-1
  nitrogenStress: number  // 0-1
  srad: number
  tmax: number
  tmin: number
  rain: number
}

/* 产量结果 */
export interface YieldResult {
  totalFruitWeight: number  // kg/ha
  fruitCount: number
  avgFruitWeight: number    // g
  harvestDate: string
}

/* 品质预测 */
export interface QualityResult {
  date: string
  ssc: number       // 可溶性固形物 %
  acidity: number   // 酸度 %
  firmness: number  // 硬度 kg/cm2
}

/* 模拟存储 */
export const useSimulationStore = defineStore('simulation', () => {
  const status = ref<SimulationStatus>('idle')
  const currentDay = ref(0)
  const totalDays = ref(180)
  const speed = ref(1)
  const results = ref<DailyResult[]>([])
  const eventLog = ref<{ time: string; type: string; message: string }[]>([])

  /* 新增：病虫害风险 */
  const pestRisks = ref<PestRiskRecord[]>([])

  /* 新增：农事操作 */
  const farmOperations = ref<FarmOperation[]>([])

  /* 新增：物候事件 */
  const phenologyEvents = ref<PhenologyEvent[]>([])

  /* 计算属性 */
  const progress = computed(() => {
    if (totalDays.value === 0) return 0
    return Math.round((currentDay.value / totalDays.value) * 100)
  })

  const latestResult = computed<DailyResult | null>(() => {
    if (results.value.length === 0) return null
    return results.value[results.value.length - 1]
  })

  const currentGrowthStage = computed(() => {
    if (!latestResult.value) return '-'
    return latestResult.value.growthStage
  })

  const currentLai = computed(() => {
    if (!latestResult.value) return 0
    return latestResult.value.lai.toFixed(2)
  })

  const currentBiomass = computed(() => {
    if (!latestResult.value) return 0
    return latestResult.value.totalBiomass.toFixed(0)
  })

  const currentFruitWeight = computed(() => {
    if (!latestResult.value) return 0
    return latestResult.value.fruitWeight.toFixed(0)
  })

  const currentWaterStress = computed(() => {
    if (!latestResult.value) return 0
    return latestResult.value.waterStress.toFixed(2)
  })

  const currentNitrogenStress = computed(() => {
    if (!latestResult.value) return 0
    return latestResult.value.nitrogenStress.toFixed(2)
  })

  /* 产量分析 */
  const yieldResult = computed<YieldResult>(() => {
    const fruitDays = results.value.filter(r => r.fruitWeight > 0)
    const totalFruit = fruitDays.length > 0
      ? fruitDays[fruitDays.length - 1].fruitWeight
      : 0
    return {
      totalFruitWeight: totalFruit,
      fruitCount: Math.round(totalFruit / 25 * 1000),
      avgFruitWeight: 25,
      harvestDate: fruitDays.length > 0 ? fruitDays[fruitDays.length - 1].date : '-',
    }
  })

  /* 品质预测数据 */
  const qualityResults = computed<QualityResult[]>(() => {
    return results.value
      .filter(r => r.fruitWeight > 0)
      .map(r => ({
        date: r.date,
        ssc: 8 + Math.random() * 4,
        acidity: 0.6 + Math.random() * 0.4,
        firmness: 2.5 + Math.random() * 1.5,
      }))
  })

  /* 开始模拟 */
  function startSimulation() {
    status.value = 'running'
    eventLog.value = []
    addEvent('info', '模拟开始运行')
  }

  /* 暂停模拟 */
  function pauseSimulation() {
    status.value = 'paused'
    addEvent('warning', '模拟已暂停')
  }

  /* 恢复模拟 */
  function resumeSimulation() {
    status.value = 'running'
    addEvent('info', '模拟已恢复')
  }

  /* 重置模拟 */
  function resetSimulation() {
    status.value = 'idle'
    currentDay.value = 0
    results.value = []
    eventLog.value = []
    pestRisks.value = []
    farmOperations.value = []
    phenologyEvents.value = []
  }

  /* 添加事件日志 */
  function addEvent(type: string, message: string) {
    eventLog.value.unshift({
      time: new Date().toLocaleTimeString('zh-CN'),
      type,
      message,
    })
  }

  /* 生成模拟结果（模拟引擎占位） */
  function generateResults() {
    results.value = []
    const stages = ['出苗期', '营养生长期', '花芽分化期', '开花期', '结果期', '果实膨大期', '采收期']
    let lai = 0
    let totalBiomass = 0
    let leafWeight = 0
    let stemWeight = 0
    let rootWeight = 0
    let fruitWeight = 0

    for (let day = 1; day <= totalDays.value; day++) {
      // 简化生长模型
      const temp = 18 + 8 * Math.sin((day / 180) * Math.PI)
      const stageIndex = Math.min(Math.floor(day / (totalDays.value / stages.length)), stages.length - 1)
      const growthStage = stages[stageIndex]

      // LAI增长曲线
      if (day < 30) {
        lai = 0.15 * day
      } else if (day < 90) {
        lai = 4.5 * (1 - Math.exp(-0.03 * (day - 20)))
      } else {
        lai = 4.5 * Math.exp(-0.005 * (day - 90))
      }

      // 生物量累积
      const dailyGrowth = lai * 2.5 * (1 - 0.3 * Math.random())
      totalBiomass += dailyGrowth
      leafWeight = totalBiomass * 0.3
      stemWeight = totalBiomass * 0.25
      rootWeight = totalBiomass * 0.15

      // 果实重量（结果期后开始累积）
      if (day > 60) {
        fruitWeight = (day - 60) * 15 * (1 + 0.1 * Math.random())
      }

      // 胁迫因子
      const waterStress = day % 15 < 3 ? 0.3 + Math.random() * 0.3 : 0.05 + Math.random() * 0.1
      const nitrogenStress = day > 100 ? 0.2 + Math.random() * 0.2 : 0.05 + Math.random() * 0.1

      const month = Math.floor((day - 1) / 30) + 3
      const dayOfMonth = ((day - 1) % 30) + 1

      results.value.push({
        day,
        date: `2025-${String(Math.min(month, 12)).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`,
        growthStage,
        lai: Math.round(lai * 100) / 100,
        totalBiomass: Math.round(totalBiomass),
        leafWeight: Math.round(leafWeight),
        stemWeight: Math.round(stemWeight),
        rootWeight: Math.round(rootWeight),
        fruitWeight: Math.round(fruitWeight),
        waterStress: Math.round(waterStress * 100) / 100,
        nitrogenStress: Math.round(nitrogenStress * 100) / 100,
        srad: 12 + Math.random() * 8,
        tmax: temp + 5,
        tmin: temp - 5,
        rain: Math.random() > 0.7 ? Math.round(Math.random() * 20 * 10) / 10 : 0,
      })
    }

    currentDay.value = totalDays.value
    status.value = 'complete'
    addEvent('success', '模拟完成！共 ' + totalDays.value + ' 天')
  }

  return {
    status, currentDay, totalDays, speed, results, eventLog,
    pestRisks, farmOperations, phenologyEvents,
    progress, latestResult, currentGrowthStage, currentLai,
    currentBiomass, currentFruitWeight, currentWaterStress,
    currentNitrogenStress, yieldResult, qualityResults,
    startSimulation, pauseSimulation, resumeSimulation, resetSimulation,
    addEvent,
  }
})
