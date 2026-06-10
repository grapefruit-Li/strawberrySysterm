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
  ChainSimulationResult,
  PhenologyEvent,
  PestRiskRecord,
  FarmOperation,
  RiskLevel,
  OperationType,
  OperationPriority,
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
   * YYYYMMDD数字转日期字符串 "YYYY-MM-DD"
   */
  function formatDateNum(dateNum: number): string {
    const s = String(dateNum)
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
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

  // ==================== 物候事件生成 ====================

  /**
   * 从模拟输出中生成物候事件
   */
  function generatePhenologyEvents(outputs: DailyOutput[]): PhenologyEvent[] {
    if (outputs.length === 0) return []

    /* 阶段定义 */
    const stageDefs: { stage: GrowthStage; name: string; desc: string; env: string; gddRange: [number, number] }[] = [
      { stage: GrowthStage.Germinating, name: '萌芽期', desc: '种子萌发至出苗', env: '温度>7°C，土壤湿润', gddRange: [0, 50] },
      { stage: GrowthStage.Vegetative, name: '营养生长期', desc: '叶片和根系快速生长', env: '温度15-25°C，充足光照', gddRange: [50, 500] },
      { stage: GrowthStage.Flowering, name: '花芽分化期', desc: '花芽分化至开花', env: '短日型需<12h日照，温度15-20°C', gddRange: [500, 700] },
      { stage: GrowthStage.Fruiting, name: '结果期', desc: '授粉后果实发育', env: '温度18-25°C，适度灌溉', gddRange: [700, 1000] },
      { stage: GrowthStage.Maturity, name: '果实膨大期', desc: '果实快速膨大，糖分积累', env: '充足光照，昼夜温差大', gddRange: [1000, 1200] },
      { stage: GrowthStage.Harvest, name: '采收期', desc: '果实成熟采收', env: '避免过多水分，减少病害', gddRange: [1200, 2000] },
    ]

    const events: PhenologyEvent[] = []

    for (const def of stageDefs) {
      /* 找到该阶段的起止日期 */
      const stageOutputs = outputs.filter(o => o.stage === def.stage)
      if (stageOutputs.length === 0) continue

      const first = stageOutputs[0]
      const last = stageOutputs[stageOutputs.length - 1]

      events.push({
        id: `phen-${def.stage}`,
        stage: def.stage,
        name: def.name,
        startDate: first.day,
        endDate: last.day,
        predictedDate: formatDateNum(first.day),
        startGdd: first.gdd, endGdd: last.gdd,
        duration: last.das - first.das + 1,
        description: def.desc, envRequirements: def.env,
      })
    }

    return events
  }

  // ==================== 病虫害风险生成 ====================

  /**
   * 生成病虫害风险数据
   */
  function generatePestRisks(outputs: DailyOutput[], events: PhenologyEvent[]): PestRiskRecord[] {
    /* 病虫害模板 */
    const pestTemplates = [
      {
        id: 'pest-01',
        name: '灰霉病',
        scientificName: 'Botrytis cinerea',
        relatedStages: ['开花期', '结果期', '果实膨大期', '采收期'],
        desc: '高湿条件下易发，危害花和果实',
        control: '降低棚内湿度，及时摘除病果，喷施嘧霉胺',
        prevention: ['保持通风', '控制灌溉量', '及时清除病残体'],
      },
      {
        id: 'pest-02',
        name: '白粉病',
        scientificName: 'Podosphaera aphanis',
        relatedStages: ['营养生长期', '花芽分化期', '开花期'],
        desc: '干燥条件下易发，危害叶片和果实',
        control: '喷施硫磺制剂或三唑类杀菌剂',
        prevention: ['选用抗病品种', '合理密植', '保持叶片干燥'],
      },
      {
        id: 'pest-03',
        name: '红蜘蛛',
        scientificName: 'Tetranychus urticae',
        relatedStages: ['营养生长期', '结果期', '果实膨大期'],
        desc: '高温干燥条件下易发，吸食叶片汁液',
        control: '释放捕食螨，喷施阿维菌素',
        prevention: ['监测虫口密度', '保持适度湿度', '释放天敌'],
      },
      {
        id: 'pest-04',
        name: '蚜虫',
        scientificName: 'Chaetosiphon fragaefolii',
        relatedStages: ['营养生长期', '开花期'],
        desc: '刺吸式害虫，传播病毒病',
        control: '喷施吡虫啉或噻虫嗪，悬挂黄板',
        prevention: ['悬挂黄色粘虫板', '保护瓢虫等天敌', '清除周边杂草'],
      },
      {
        id: 'pest-05',
        name: '炭疽病',
        scientificName: 'Colletotrichum spp.',
        relatedStages: ['结果期', '果实膨大期', '采收期'],
        desc: '高温多雨条件下易发，危害果实和匍匐茎',
        control: '喷施咪鲜胺或苯醚甲环唑',
        prevention: ['避免连作', '及时排水', '选用无病苗'],
      },
    ]

    const risks: PestRiskRecord[] = []

    for (const tmpl of pestTemplates) {
      /* 生成逐日风险指数 */
      const dailyRiskIndex = outputs.map(o => {
        const stageName = stageNameFromGrowthStage(o.stage)
        const isRelated = tmpl.relatedStages.includes(stageName)
        let baseRisk = isRelated ? 30 + Math.random() * 40 : 5 + Math.random() * 15
        if (o.tmax > 28 && o.rain > 5) baseRisk += 15
        if (o.rain > 15) baseRisk += 10
        return {
          date: String(o.day),
          index: Math.min(100, Math.round(baseRisk)),
        }
      })

      /* 当前风险指数 */
      const currentRiskIndex = dailyRiskIndex.length > 0
        ? dailyRiskIndex[dailyRiskIndex.length - 1].index
        : 0

      let riskLevel: RiskLevel = 'low'
      if (currentRiskIndex >= 75) riskLevel = 'critical'
      else if (currentRiskIndex >= 55) riskLevel = 'high'
      else if (currentRiskIndex >= 35) riskLevel = 'medium'

      /* 下次高风险日期 */
      const futureHighRisk = dailyRiskIndex.find(d => d.index >= 55)
      const nextAlertDate = futureHighRisk ? futureHighRisk.date : '-'

      /* 关联阶段 */
      const matchedEvent = events.find(e => tmpl.relatedStages.includes(e.name))
      const relatedStage = matchedEvent ? matchedEvent.name : tmpl.relatedStages.join('、')

      risks.push({
        id: tmpl.id,
        name: tmpl.name,
        scientificName: tmpl.scientificName,
        riskLevel,
        riskIndex: currentRiskIndex,
        relatedStage,
        description: tmpl.desc,
        controlRecommendation: tmpl.control,
        preventionMeasures: tmpl.prevention,
        dailyRiskIndex,
        nextAlertDate,
      })
    }

    return risks
  }

  // ==================== 农事操作生成 ====================

  /**
   * 生成农事操作建议
   */
  function generateFarmOperations(outputs: DailyOutput[], events: PhenologyEvent[]): FarmOperation[] {
    const operations: FarmOperation[] = []

    /* 根据物候阶段生成操作建议 */
    const stageOps: { stage: GrowthStage; ops: { type: OperationType; name: string; desc: string; priority: OperationPriority; params: Record<string, number | string> }[] }[] = [
      {
        stage: GrowthStage.Germinating,
        ops: [
          { type: 'irrigation', name: '定植水灌溉', desc: '定植后立即浇透水，确保根系与土壤紧密接触', priority: 'urgent', params: { amount: 30, method: '滴灌' } },
          { type: 'monitoring', name: '成活率检查', desc: '定植后3-5天检查成活率，及时补苗', priority: 'high', params: { target: '成活率>95%' } },
        ],
      },
      {
        stage: GrowthStage.Vegetative,
        ops: [
          { type: 'fertilizer', name: '营养生长期追肥', desc: '促进叶片和根系发育，以氮肥为主', priority: 'high', params: { npk: '20-10-10', amount: 150 } },
          { type: 'irrigation', name: '常规灌溉', desc: '保持土壤适度湿润，避免积水', priority: 'medium', params: { amount: 20, interval: '5-7天' } },
          { type: 'pruning', name: '摘除老叶', desc: '摘除底部老叶和病叶，改善通风', priority: 'medium', params: { frequency: '每2周' } },
        ],
      },
      {
        stage: GrowthStage.Flowering,
        ops: [
          { type: 'fertilizer', name: '花期追肥', desc: '增施磷钾肥促进花芽分化', priority: 'high', params: { npk: '10-30-20', amount: 100 } },
          { type: 'pest_control', name: '花期病虫害预防', desc: '预防灰霉病，降低棚内湿度', priority: 'high', params: { target: '灰霉病' } },
          { type: 'monitoring', name: '花序监测', desc: '记录花序数量和发育状况', priority: 'medium', params: { target: '花序数' } },
        ],
      },
      {
        stage: GrowthStage.Fruiting,
        ops: [
          { type: 'irrigation', name: '果实发育期灌溉', desc: '保持均匀供水，避免裂果', priority: 'high', params: { amount: 25, ec: '1.2-1.5' } },
          { type: 'fertilizer', name: '果实发育期追肥', desc: '增施钾肥促进果实膨大和糖分积累', priority: 'high', params: { npk: '5-15-30', amount: 120 } },
          { type: 'pest_control', name: '果实期病虫害防治', desc: '重点防治灰霉病和炭疽病', priority: 'urgent', params: { target: '灰霉病、炭疽病' } },
        ],
      },
      {
        stage: GrowthStage.Maturity,
        ops: [
          { type: 'irrigation', name: '采收前控水', desc: '采收前适当减少灌溉，提高糖度', priority: 'medium', params: { amount: 15, note: '采收前3天减少' } },
          { type: 'monitoring', name: '成熟度监测', desc: '定期检测果实SSC和硬度', priority: 'high', params: { target: 'SSC>8%' } },
        ],
      },
      {
        stage: GrowthStage.Harvest,
        ops: [
          { type: 'harvest', name: '采收操作', desc: '选择晴天上午采收，轻拿轻放', priority: 'urgent', params: { frequency: '每2-3天', method: '手工采摘' } },
          { type: 'fertilizer', name: '采收期追肥', desc: '采收期持续补充营养，维持植株活力', priority: 'medium', params: { npk: '10-10-30', amount: 80 } },
          { type: 'pest_control', name: '采收期病虫害监控', desc: '采收期注意灰霉病和红蜘蛛', priority: 'high', params: { target: '灰霉病、红蜘蛛' } },
        ],
      },
    ]

    /* 根据物候事件生成操作 */
    for (const stageOp of stageOps) {
      const event = events.find(e => e.stage === stageOp.stage)
      if (!event) continue

      for (const op of stageOp.ops) {
        const opDate = numToDate(event.startDate)
        operations.push({
          id: `op-${stageOp.stage}-${op.type}`,
          type: op.type,
          name: op.name,
          plannedDate: `${opDate.getFullYear()}-${String(opDate.getMonth() + 1).padStart(2, '0')}-${String(opDate.getDate()).padStart(2, '0')}`,
          relatedStage: event.name,
          description: op.desc,
          priority: op.priority,
          completed: false,
          params: op.params,
        })
      }
    }

    return operations
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

  /** 从GrowthStage枚举获取阶段中文名 */
  function stageNameFromGrowthStage(stage: GrowthStage): string {
    const map: Record<GrowthStage, string> = {
      [GrowthStage.PrePlanting]: '播种前',
      [GrowthStage.Germinating]: '萌芽期',
      [GrowthStage.Vegetative]: '营养生长期',
      [GrowthStage.Flowering]: '开花期',
      [GrowthStage.Fruiting]: '结果期',
      [GrowthStage.Maturity]: '果实膨大期',
      [GrowthStage.Harvest]: '采收期',
      [GrowthStage.End]: '结束',
    }
    return map[stage] ?? '未知'
  }

  /**
   * 运行链式模拟 - 生成所有关联结果
   */
  function runChainSimulation(): ChainSimulationResult {
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

    const summary = buildSummary(allOutputs, allHarvests)

    /* 生成物候事件 */
    const phenologyEvents = generatePhenologyEvents(allOutputs)

    /* 生成病虫害风险 */
    const pestRisks = generatePestRisks(allOutputs, phenologyEvents)

    /* 生成农事操作 */
    const farmOperations = generateFarmOperations(allOutputs, phenologyEvents)

    /* 同步到store */
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
    simStore.phenologyEvents = phenologyEvents
    simStore.pestRisks = pestRisks
    simStore.farmOperations = farmOperations
    simStore.addEvent('success', '链式模拟完成！共 ' + totalDays + ' 天')

    return {
      dailyOutputs: allOutputs,
      harvests: allHarvests,
      summary,
      phenologyEvents,
      pestRisks,
      farmOperations,
    }
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
    runChainSimulation,
    runStepByStep,
    stopStepByStep,
    exportResults,
  }
}
