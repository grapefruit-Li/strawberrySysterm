/**
 * 病虫害风险预测模块
 * 基于物候阶段与气象条件的链式决策：物候 → 产量 → 病虫害风险
 * 根据生长阶段和天气条件预测主要草莓病虫害风险
 */

import type { DailyOutput, PhenologyEvent, PestRiskRecord, RiskLevel } from '@/engine/types'
import { GrowthStage } from '@/engine/types'

/** 病虫害风险阈值配置 */
interface PestThreshold {
  /** 病虫害编号 */
  id: string
  /** 病虫害名称 */
  name: string
  /** 学名 */
  scientificName: string
  /** 适用生长阶段（中文名） */
  stageNames: string[]
  /** 温度下限 (°C) */
  tempMin: number
  /** 温度上限 (°C) */
  tempMax: number
  /** 湿度下限 (%) - 低于此值视为干燥条件 */
  humidityMin?: number
  /** 湿度上限 (%) - 高于此值视为高湿条件 */
  humidityMax?: number
  /** 降水量阈值 (mm) - 超过此值视为降雨条件 */
  rainThreshold?: number
  /** 风险描述 */
  description: string
  /** 防治建议 */
  recommendation: string
  /** 预防措施 */
  prevention: string[]
}

/** 草莓主要病虫害风险阈值表 */
const PEST_THRESHOLDS: PestThreshold[] = [
  {
    id: 'pest-01',
    name: '灰霉病',
    scientificName: 'Botrytis cinerea',
    stageNames: ['开花期', '结果期', '果实膨大期', '采收期'],
    tempMin: 15,
    tempMax: 25,
    humidityMin: 80,
    description: '花期高湿适温条件，灰霉病孢子极易侵染花器和幼果',
    recommendation: '及时通风降湿；花期喷施嘧霉胺或腐霉利；清除病花病果；避免傍晚浇水',
    prevention: ['保持通风', '控制灌溉量', '及时清除病残体'],
  },
  {
    id: 'pest-02',
    name: '白粉病',
    scientificName: 'Podosphaera aphanis',
    stageNames: ['营养生长期', '花芽分化期', '开花期'],
    tempMin: 18,
    tempMax: 28,
    humidityMax: 60,
    description: '温暖干燥环境下白粉病易发生，叶片背面出现白色粉状物',
    recommendation: '保持适当株行距通风；发病初期喷施醚菌酯或腈菌唑；避免氮肥过量',
    prevention: ['选用抗病品种', '合理密植', '保持叶片干燥'],
  },
  {
    id: 'pest-03',
    name: '红蜘蛛',
    scientificName: 'Tetranychus urticae',
    stageNames: ['营养生长期', '结果期', '果实膨大期'],
    tempMin: 25,
    tempMax: 40,
    humidityMax: 50,
    description: '高温干燥条件下红蜘蛛繁殖迅速，叶片失绿变黄',
    recommendation: '释放捕食螨进行生物防治；增加田间湿度；喷施阿维菌素或螺螨酯',
    prevention: ['监测虫口密度', '保持适度湿度', '释放天敌'],
  },
  {
    id: 'pest-04',
    name: '炭疽病',
    scientificName: 'Colletotrichum spp.',
    stageNames: ['结果期', '果实膨大期', '采收期'],
    tempMin: 20,
    tempMax: 32,
    rainThreshold: 5,
    description: '结果期降雨条件下炭疽病菌易侵染果实，出现水浸状病斑',
    recommendation: '雨后及时排水；喷施咪鲜胺或苯醚甲环唑；避免果实接触地面；使用地膜覆盖',
    prevention: ['避免连作', '及时排水', '选用无病苗'],
  },
  {
    id: 'pest-05',
    name: '蚜虫',
    scientificName: 'Chaetosiphon fragaefolii',
    stageNames: ['营养生长期', '开花期'],
    tempMin: 15,
    tempMax: 26,
    description: '温暖春季蚜虫大量繁殖，吸食嫩叶汁液并传播病毒',
    recommendation: '悬挂黄色粘虫板监测；释放瓢虫等天敌；喷施吡虫啉或噻虫嗪；清除周边杂草',
    prevention: ['悬挂黄色粘虫板', '保护瓢虫等天敌', '清除周边杂草'],
  },
]

/**
 * 计算单日单病虫害的风险等级
 */
function assessSinglePestRisk(
  avgTemp: number,
  humidity: number,
  rain: number,
  threshold: PestThreshold
): RiskLevel | null {
  if (avgTemp < threshold.tempMin || avgTemp > threshold.tempMax) {
    return null
  }

  if (threshold.humidityMin !== undefined && humidity >= 0 && humidity < threshold.humidityMin) {
    return null
  }
  if (threshold.humidityMax !== undefined && humidity >= 0 && humidity > threshold.humidityMax) {
    return null
  }

  if (threshold.rainThreshold !== undefined && rain < threshold.rainThreshold) {
    return null
  }

  const tempMid = (threshold.tempMin + threshold.tempMax) / 2
  const tempRange = (threshold.tempMax - threshold.tempMin) / 2
  const tempDeviation = Math.abs(avgTemp - tempMid) / tempRange

  if (tempDeviation < 0.25) {
    return 'critical'
  } else if (tempDeviation < 0.5) {
    return 'high'
  } else if (tempDeviation < 0.75) {
    return 'medium'
  } else {
    return 'low'
  }
}

/**
 * 生长阶段枚举转中文名
 */
function getStageName(stage: GrowthStage): string {
  const names: Record<GrowthStage, string> = {
    [GrowthStage.PrePlanting]: '播种前',
    [GrowthStage.Germinating]: '萌芽期',
    [GrowthStage.Vegetative]: '营养生长期',
    [GrowthStage.Flowering]: '开花期',
    [GrowthStage.Fruiting]: '结果期',
    [GrowthStage.Maturity]: '果实膨大期',
    [GrowthStage.Harvest]: '采收期',
    [GrowthStage.End]: '生长结束',
  }
  return names[stage] ?? '未知'
}

/**
 * 计算病虫害风险记录
 * 基于逐日输出和物候事件，链式预测病虫害风险
 */
export function calculatePestRisks(
  dailyOutputs: DailyOutput[],
  phenologyEvents: PhenologyEvent[]
): PestRiskRecord[] {
  const risks: PestRiskRecord[] = []

  for (const threshold of PEST_THRESHOLDS) {
    /* 生成逐日风险指数 */
    const dailyRiskIndex: { date: string; index: number }[] = []
    let maxRiskIndex = 0

    for (const output of dailyOutputs) {
      const stageName = getStageName(output.stage)
      const isRelated = threshold.stageNames.includes(stageName)

      if (!isRelated) {
        dailyRiskIndex.push({ date: String(output.day), index: 0 })
        continue
      }

      const avgTemp = (output.tmax + output.tmin) / 2
      const estimatedHumidity = estimateHumidity(output.rain, output.tmax, output.tmin)
      const riskLevel = assessSinglePestRisk(avgTemp, estimatedHumidity, output.rain, threshold)

      let riskIndex = 0
      if (riskLevel === 'critical') riskIndex = 85 + Math.round(Math.random() * 15)
      else if (riskLevel === 'high') riskIndex = 55 + Math.round(Math.random() * 25)
      else if (riskLevel === 'medium') riskIndex = 35 + Math.round(Math.random() * 20)
      else riskIndex = 5 + Math.round(Math.random() * 25)

      if (output.tmax > 28 && output.rain > 5) riskIndex = Math.min(100, riskIndex + 15)
      if (output.rain > 15) riskIndex = Math.min(100, riskIndex + 10)

      dailyRiskIndex.push({ date: String(output.day), index: riskIndex })
      if (riskIndex > maxRiskIndex) maxRiskIndex = riskIndex
    }

    /* 当前风险指数（最后一天） */
    const currentRiskIndex = dailyRiskIndex.length > 0
      ? dailyRiskIndex[dailyRiskIndex.length - 1].index
      : 0

    let riskLevel: RiskLevel = 'low'
    if (currentRiskIndex >= 75) riskLevel = 'critical'
    else if (currentRiskIndex >= 55) riskLevel = 'high'
    else if (currentRiskIndex >= 35) riskLevel = 'medium'

    /* 找到下次高风险日期 */
    const futureHighRisk = dailyRiskIndex.find(d => d.index >= 55)
    const nextAlertDate = futureHighRisk ? futureHighRisk.date : '-'

    /* 关联阶段 */
    const matchedEvent = phenologyEvents.find(e => threshold.stageNames.includes(e.name))
    const relatedStage = matchedEvent ? matchedEvent.name : threshold.stageNames.join('、')

    risks.push({
      id: threshold.id,
      name: threshold.name,
      scientificName: threshold.scientificName,
      riskLevel,
      riskIndex: currentRiskIndex,
      relatedStage,
      description: threshold.description,
      controlRecommendation: threshold.recommendation,
      preventionMeasures: threshold.prevention,
      dailyRiskIndex,
      nextAlertDate,
    })
  }

  return risks
}

/**
 * 简化湿度估算
 */
function estimateHumidity(rain: number, tmax: number, tmin: number): number {
  const tempRange = tmax - tmin
  let humidity = 70 - tempRange * 1.5
  if (rain > 0) {
    humidity += Math.min(30, rain * 2)
  }
  return Math.max(20, Math.min(100, humidity))
}
