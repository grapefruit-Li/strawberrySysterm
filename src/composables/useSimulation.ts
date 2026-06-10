/**
 * 模拟运行Composable
 * 封装模拟Store，提供高级模拟控制逻辑
 */
import { ref, computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'
import {
  GrowthStage,
} from '@/engine/types'
import type {
  SimulationResult,
  SimulationSummary,
  DailyOutput,
  HarvestRecord,
  PlantState,
  SoilState,
} from '@/engine/types'

/** 模拟运行器返回类型 */
export function useSimulation() {
  const simStore = useSimulationStore()
  const configStore = useConfigStore()

  /** 步进模式是否激活 */
  const stepByStepActive = ref(false)

  /** 步进定时器ID */
  let stepTimer: ReturnType<typeof setTimeout> | null = null

  /** 步进间隔 (ms) */
  const stepInterval = ref(200)

  // ==================== 内部辅助函数 ====================

  /**
   * YYYYMMDD数字转日期对象
   */
  function numToDate(dateNum: number): Date {
    const year = Math.floor(dateNum / 10000)
    const month = Math.floor((dateNum % 10000) / 100) - 1
    const day = dateNum % 100
    return new Date(year, month, day)
  }

  /**
   * 日期字符串转YYYYMMDD数字
   */
  function dateStrToNum(dateStr: string): number {
    const parts = dateStr.split('-')
    return parseInt(parts[0]) * 10000 + parseInt(parts[1]) * 100 + parseInt(parts[2])
  }

  /**
   * 计算两个YYYYMMDD日期之间的天数
   */
  function daysBetween(start: number, end: number): number {
    const s = numToDate(start)
    const e = numToDate(end)
    return Math.floor((e.getTime() - s.getTime()) / 86400000)
  }

  /**
   * 简化的模拟引擎：生成每日输出
   */
  function runEngineStep(
    dayIndex: number,
    prevState: { plant: PlantState; soil: SoilState } | null,
  ): { plant: PlantState; soil: SoilState; output: DailyOutput; harvest?: HarvestRecord } {
    // 从配置store获取参数
    const startNum = dateStrToNum(configStore.plantingDate)
    const currentDate = new Date(numToDate(startNum).getTime() + dayIndex * 86400000)
    const dateNum = currentDate.getFullYear() * 10000 + (currentDate.getMonth() + 1) * 100 + currentDate.getDate()

    // 获取当日气象数据
    const weatherDay = configStore.weatherData.find(d => {
      const wDateNum = dateStrToNum(d.date)
      return wDateNum === dateNum
    })
    const tmean = weatherDay ? (weatherDay.tmax + weatherDay.tmin) / 2 : 20
    const srad = weatherDay?.srad ?? 12
    const rain = weatherDay?.rain ?? 0

    // 品种参数
    const tbase = 7 // 草莓基温
    const laimax = configStore.cultivarParams.maxLai
    const dailyTt = Math.max(0, tmean - tbase)

    // 初始化或继承上一状态
    const prevPlant = prevState?.plant ?? {
      dap: 0,
      stage: GrowthStage.Germinating,
      gdd: 0,
      lai: 0.01,
      biomass: 5,
      leafWt: 3,
      stemWt: 1,
      rootWt: 1,
      fruitWt: 0,
      nStress: 1.0,
      wStress: 1.0,
      tStress: 1.0,
      rootDepth: 2,
      plantN: 0.5,
      leafN: 0.3,
      stemN: 0.1,
      rootN: 0.1,
      fruitN: 0,
      carbh2o: 0,
      carbh2oPot: 0,
      maintResp: 0,
      growResp: 0,
      ep: 0,
      eop: 0,
      activeTrusses: 0,
      fruitNum: 0,
      harvestedFreshWt: 0,
      harvestedDryWt: 0,
      flrGddCounter: 0,
      photoThermalAge: 0,
      senescedLeaf: 0,
    }
    const prevSoil = prevState?.soil ?? {
      swContent: configStore.soilLayers.map(l => l.awc + 0.1),
      no3: configStore.soilLayers.map(() => 5),
      nh4: configStore.soilLayers.map(() => 2),
      mineralization: configStore.soilLayers.map(() => 0),
      runoff: 0,
      drainage: 0,
      evapCum: 0,
      transCum: 0,
      stage1Evap: 0,
      es: 0,
      eos: 0,
    }

    // 更新累积热时间
    const gdd = prevPlant.gdd + dailyTt

    // 确定生长阶段
    let stage: GrowthStage = prevPlant.stage
    if (gdd < 50) stage = GrowthStage.Germinating
    else if (gdd < 200) stage = GrowthStage.Vegetative
    else if (gdd < 500) stage = GrowthStage.Vegetative
    else if (gdd < 700) stage = GrowthStage.Flowering
    else if (gdd < 1000) stage = GrowthStage.Fruiting
    else if (gdd < 1200) stage = GrowthStage.Maturity
    else stage = GrowthStage.Harvest

    // 计算LAI增长
    const isVegOrFlower = stage === GrowthStage.Vegetative || stage === GrowthStage.Flowering
    const laiRate = isVegOrFlower ? 0.08 * Math.max(0, (tmean - tbase) / 20) * prevPlant.wStress : 0
    const laiDecay = stage === GrowthStage.Harvest ? 0.02 : 0
    const lai = Math.min(laimax, Math.max(0.01, prevPlant.lai + laiRate - laiDecay))

    // 计算生物量增长
    const biomassIncrement = srad * 1.5 * (1 - Math.exp(-0.5 * lai)) * prevPlant.wStress * 0.001

    // 分配系数
    const isReproductive = stage >= GrowthStage.Flowering
    const partLeaf = isReproductive ? 0.15 : 0.35
    const partStem = isReproductive ? 0.15 : 0.25
    const partFruit = isReproductive ? 0.55 : 0.0
    const partRoot = isReproductive ? 0.10 : 0.20

    const biomass = prevPlant.biomass + biomassIncrement
    const leafWt = biomass * partLeaf
    const stemWt = biomass * partStem
    const fruitWt = biomass * partFruit
    const rootWt = biomass * partRoot

    // 根系生长
    const rootDepth = Math.min(60, prevPlant.rootDepth + 0.3 * Math.max(0, (tmean - tbase) / 20) * 0.1)

    // 花序和果实数
    const activeTrusses = stage >= GrowthStage.Flowering
      ? prevPlant.activeTrusses + (stage === GrowthStage.Flowering ? 0.05 : 0)
      : prevPlant.activeTrusses
    const fruitNum = isReproductive ? Math.floor(activeTrusses * 3.5) : 0

    // 水分平衡（简化）
    const dailyEt = Math.max(0.5, 3.0 * lai / laimax * (srad / 15))
    const irrigation = configStore.irrigationEvents
      .filter(e => dateStrToNum(e.date) === dateNum)
      .reduce((sum, e) => sum + e.amount, 0)
    const wStress = dailyEt > 0 ? Math.min(1, (rain + irrigation) / dailyEt) : 1

    // 更新土壤含水量
    const swContent = prevSoil.swContent.map((m, i) => {
      const newM = m + (rain + irrigation) / configStore.soilLayers.length / 10 - dailyEt / configStore.soilLayers.length / 10
      return Math.max(0.05, Math.min(0.5, newM))
    })

    const newPlant: PlantState = {
      dap: dayIndex + 1,
      stage,
      gdd: Math.round(gdd * 10) / 10,
      lai: Math.round(lai * 100) / 100,
      biomass: Math.round(biomass * 100) / 100,
      leafWt: Math.round(leafWt * 100) / 100,
      stemWt: Math.round(stemWt * 100) / 100,
      rootWt: Math.round(rootWt * 100) / 100,
      fruitWt: Math.round(fruitWt * 100) / 100,
      nStress: 0.95,
      wStress: Math.round(wStress * 100) / 100,
      tStress: 1.0,
      rootDepth: Math.round(rootDepth * 10) / 10,
      plantN: prevPlant.plantN,
      leafN: prevPlant.leafN,
      stemN: prevPlant.stemN,
      rootN: prevPlant.rootN,
      fruitN: prevPlant.fruitN,
      carbh2o: Math.round(biomassIncrement * 1000) / 100,
      carbh2oPot: Math.round(biomassIncrement * 1000) / 100,
      maintResp: 0,
      growResp: 0,
      ep: Math.round(dailyEt * 10) / 10,
      eop: Math.round(dailyEt * 10) / 10,
      activeTrusses: Math.round(activeTrusses * 100) / 100,
      fruitNum,
      harvestedFreshWt: prevPlant.harvestedFreshWt,
      harvestedDryWt: prevPlant.harvestedDryWt,
      flrGddCounter: prevPlant.flrGddCounter,
      photoThermalAge: prevPlant.photoThermalAge + dailyTt,
      senescedLeaf: prevPlant.senescedLeaf,
    }

    const newSoil: SoilState = {
      swContent: swContent.map(m => Math.round(m * 1000) / 1000),
      no3: prevSoil.no3,
      nh4: prevSoil.nh4,
      mineralization: prevSoil.mineralization,
      runoff: Math.round(prevSoil.runoff * 10) / 10,
      drainage: Math.round(prevSoil.drainage * 10) / 10,
      evapCum: Math.round((prevSoil.evapCum + dailyEt * 0.3) * 10) / 10,
      transCum: Math.round((prevSoil.transCum + dailyEt * 0.7) * 10) / 10,
      stage1Evap: prevSoil.stage1Evap,
      es: Math.round(dailyEt * 0.3 * 10) / 10,
      eos: Math.round(dailyEt * 0.3 * 10) / 10,
    }

    const dailyOutput: DailyOutput = {
      day: dateNum,
      das: dayIndex + 1,
      lai: newPlant.lai,
      biomass,
      leafWt,
      stemWt,
      rootWt,
      fruitWt,
      swfac: newPlant.wStress,
      nstres: newPlant.nStress,
      tfac: newPlant.tStress,
      stage,
      gdd: newPlant.gdd,
      rootDepth: newPlant.rootDepth,
      rain,
      irrig: irrigation,
      et: Math.round(dailyEt * 10) / 10,
      runoff: 0,
      drainage: 0,
      tmax: weatherDay?.tmax ?? 25,
      tmin: weatherDay?.tmin ?? 15,
      srad,
      activeTrusses: newPlant.activeTrusses,
      fruitNum: newPlant.fruitNum,
      carbh2o: newPlant.carbh2o,
      plantN: newPlant.plantN,
    }

    // 收获判断
    let harvest: HarvestRecord | undefined
    if (stage === GrowthStage.Harvest && fruitNum > 0 && dayIndex % 7 === 0) {
      const avgWeight = 22 * (0.7 + Math.random() * 0.3)
      const density = configStore.plantingDensity / 1000
      const freshWt = fruitNum * avgWeight * density * 0.1
      harvest = {
        date: dateNum,
        freshWt: Math.round(freshWt * 10) / 10,
        dryWt: Math.round(freshWt * 0.12 * 10) / 10,
        fruitNum,
        ssc: Math.round((7.5 + Math.random() * 2.5) * 10) / 10,
        acidity: Math.round((6.0 + Math.random() * 3.0) * 10) / 10,
        firmness: Math.round((2.0 + Math.random() * 1.5) * 100) / 100,
      }
    }

    return { plant: newPlant, soil: newSoil, output: dailyOutput, harvest }
  }

  /**
   * 构建模拟摘要
   */
  function buildSummary(outputs: DailyOutput[], harvestList: HarvestRecord[]): SimulationSummary {
    const totalFruitFreshWt = harvestList.reduce((s, h) => s + h.freshWt, 0)
    const totalFruitDryWt = harvestList.reduce((s, h) => s + h.dryWt, 0)
    const totalFruitNum = harvestList.reduce((s, h) => s + h.fruitNum, 0)
    const lastOutput = outputs.length > 0 ? outputs[outputs.length - 1] : null
    const totalET = outputs.reduce((s, o) => s + o.et, 0)
    const totalRain = outputs.reduce((s, o) => s + o.rain, 0)
    const totalIrrig = outputs.reduce((s, o) => s + o.irrig, 0)

    return {
      totalBiomass: lastOutput?.biomass ?? 0,
      totalFruitFreshWt,
      totalFruitDryWt,
      harvestIndex: (lastOutput?.biomass ?? 0) > 0 && lastOutput !== null ? totalFruitDryWt / lastOutput!.biomass : 0,
      totalFruitNum,
      avgFruitFreshWt: totalFruitNum > 0 ? (totalFruitFreshWt / totalFruitNum) * 1000 : 0,
      avgSSC: harvestList.length > 0 ? harvestList.reduce((s, h) => s + h.ssc, 0) / harvestList.length : 0,
      avgAcidity: harvestList.length > 0 ? harvestList.reduce((s, h) => s + h.acidity, 0) / harvestList.length : 0,
      avgFirmness: harvestList.length > 0 ? harvestList.reduce((s, h) => s + h.firmness, 0) / harvestList.length : 0,
      totalET: Math.round(totalET * 10) / 10,
      totalRain: Math.round(totalRain * 10) / 10,
      totalIrrig: Math.round(totalIrrig * 10) / 10,
      totalRunoff: 0,
      totalDrainage: 0,
      wue: totalET > 0 ? Math.round((totalFruitFreshWt / totalET) * 100) / 100 : 0,
      simDays: outputs.length,
      finalLAI: lastOutput?.lai ?? 0,
    }
  }

  // ==================== 公共方法 ====================

  /**
   * 运行完整模拟
   */
  function runFullSimulation(): SimulationResult {
    const totalDays = simStore.totalDays
    simStore.startSimulation()

    const allOutputs: DailyOutput[] = []
    const allHarvests: HarvestRecord[] = []
    let prev: { plant: PlantState; soil: SoilState } | null = null

    for (let i = 0; i < totalDays; i++) {
      const result = runEngineStep(i, prev)
      prev = { plant: result.plant, soil: result.soil }
      allOutputs.push(result.output)
      if (result.harvest) {
        allHarvests.push(result.harvest)
      }
    }

    const simResult: SimulationResult = {
      config: {} as any,
      dailyOutputs: allOutputs,
      harvests: allHarvests,
      summary: buildSummary(allOutputs, allHarvests),
    }

    // 将结果同步到store的results数组
    simStore.results = allOutputs.map(o => ({
      day: o.das,
      date: String(o.day),
      growthStage: stageName(o.stage),
      lai: o.lai,
      totalBiomass: o.biomass,
      leafWeight: o.leafWt,
      stemWeight: o.stemWt,
      rootWeight: o.rootWt,
      fruitWeight: o.fruitWt,
      waterStress: o.swfac,
      nitrogenStress: o.nstres,
      srad: o.srad,
      tmax: o.tmax,
      tmin: o.tmin,
      rain: o.rain,
    }))

    simStore.currentDay = totalDays
    simStore.status = 'complete'
    simStore.addEvent('success', '模拟完成！共 ' + totalDays + ' 天')

    return simResult
  }

  /** 生长阶段枚举转中文名 */
  function stageName(stage: GrowthStage): string {
    const names = ['播种前', '萌芽', '营养生长', '开花', '结果', '成熟', '收获', '结束']
    return names[stage] ?? '未知'
  }

  /**
   * 运行逐步模拟
   */
  function runStepByStep(interval = 200) {
    stepInterval.value = interval
    stepByStepActive.value = true

    const totalDays = simStore.totalDays
    let dayIndex = 0
    let prev: { plant: PlantState; soil: SoilState } | null = null

    simStore.startSimulation()

    function step() {
      if (!stepByStepActive.value || dayIndex >= totalDays) {
        stepByStepActive.value = false
        if (dayIndex >= totalDays) {
          simStore.status = 'complete'
          simStore.addEvent('success', '模拟完成！')
        }
        return
      }

      const result = runEngineStep(dayIndex, prev)
      prev = { plant: result.plant, soil: result.soil }

      // 将结果推入store
      simStore.results.push({
        day: result.output.das,
        date: String(result.output.day),
        growthStage: stageName(result.output.stage),
        lai: result.output.lai,
        totalBiomass: result.output.biomass,
        leafWeight: result.output.leafWt,
        stemWeight: result.output.stemWt,
        rootWeight: result.output.rootWt,
        fruitWeight: result.output.fruitWt,
        waterStress: result.output.swfac,
        nitrogenStress: result.output.nstres,
        srad: result.output.srad,
        tmax: result.output.tmax,
        tmin: result.output.tmin,
        rain: result.output.rain,
      })

      simStore.currentDay = dayIndex + 1

      dayIndex++
      stepTimer = setTimeout(step, stepInterval.value)
    }

    step()
  }

  /** 停止逐步模拟 */
  function stopStepByStep() {
    stepByStepActive.value = false
    if (stepTimer !== null) {
      clearTimeout(stepTimer)
      stepTimer = null
    }
    simStore.pauseSimulation()
  }

  /**
   * 导出模拟结果
   */
  function exportResults(format: 'json' | 'csv' = 'json'): string {
    if (simStore.results.length === 0) return ''

    if (format === 'json') {
      return JSON.stringify(simStore.results, null, 2)
    }

    // CSV格式导出
    const headers = [
      '天数', '日期', '生育阶段', 'LAI', '总生物量(kg/ha)',
      '叶重(kg/ha)', '茎重(kg/ha)', '果重(kg/ha)', '根重(kg/ha)',
      '水分胁迫', '氮胁迫', '辐射(MJ/m2)', 'Tmax', 'Tmin', '降雨(mm)',
    ]

    const rows = simStore.results.map(d => [
      d.day, d.date, d.growthStage, d.lai, d.totalBiomass,
      d.leafWeight, d.stemWeight, d.fruitWeight, d.rootWeight,
      d.waterStress, d.nitrogenStress, d.srad, d.tmax, d.tmin, d.rain,
    ].join(','))

    return [headers.join(','), ...rows].join('\n')
  }

  return {
    // 状态
    stepByStepActive,
    stepInterval,

    // 代理自Store的计算属性
    isRunning: computed(() => simStore.status === 'running'),
    isComplete: computed(() => simStore.status === 'complete'),
    progress: computed(() => simStore.progress),
    currentDay: computed(() => simStore.currentDay),
    currentStage: computed(() => simStore.currentGrowthStage),
    totalYield: computed(() => simStore.yieldResult.totalFruitWeight),
    lastHarvest: computed(() => simStore.yieldResult),
    results: computed(() => simStore.results),
    eventLog: computed(() => simStore.eventLog),

    // 方法
    runFullSimulation,
    runStepByStep,
    stopStepByStep,
    exportResults,
  }
}
