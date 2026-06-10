/**
 * 农事操作建议模块
 * 链式决策：物候 → 产量 → 病虫害风险 → 农事操作
 * 根据生长阶段、气象条件和病虫害风险生成农事操作建议
 */

import type {
  DailyOutput,
  PhenologyEvent,
  PestRiskRecord,
  FarmOperation,
  OperationType,
  OperationPriority,
} from '@/engine/types'
import { GrowthStage } from '@/engine/types'

/** 操作生成规则配置 */
interface OperationRule {
  /** 适用生长阶段 */
  stage: GrowthStage
  /** 操作类型 */
  type: OperationType
  /** 操作标题 */
  title: string
  /** 操作描述 */
  description: string
  /** 优先级 */
  priority: OperationPriority
  /** 触发条件（额外判断函数） */
  condition?: (output: DailyOutput) => boolean
  /** 附加参数 */
  parameters?: Record<string, number | string>
}

/** 各生长阶段的基础农事操作规则 */
const STAGE_OPERATION_RULES: OperationRule[] = [
  // 播种前：土壤准备、起垄
  {
    stage: GrowthStage.PrePlanting,
    type: 'planting',
    title: '土壤准备与起垄',
    description: '深翻土壤30cm，施入有机肥改良土壤；起垄栽培，垄面宽40-50cm，垄高25-30cm，覆盖黑色地膜',
    priority: 'high',
    parameters: { 垄宽: 45, 垄高: 28 },
  },
  // 萌芽期：定植灌溉
  {
    stage: GrowthStage.Germinating,
    type: 'irrigation',
    title: '定植灌溉',
    description: '移栽后立即浇足定植水，保持土壤湿润促进缓苗；滴灌系统检查与调试',
    priority: 'urgent',
    parameters: { 灌溉量_mm: 25 },
  },
  // 营养生长期：灌溉调度 + 氮肥施用
  {
    stage: GrowthStage.Vegetative,
    type: 'irrigation',
    title: '营养生长期灌溉调度',
    description: '根据蒸散量(ET)调度灌溉，保持土壤含水量在田间持水量的70-80%',
    priority: 'medium',
    condition: (output) => output.et > 3,
    parameters: { 目标土壤含水量_pct: 75 },
  },
  {
    stage: GrowthStage.Vegetative,
    type: 'fertilizer',
    title: '氮肥追施',
    description: '营养生长期追施氮肥促进叶片生长，每亩追施尿素5-8kg或等量氮素水溶肥',
    priority: 'medium',
    parameters: { 尿素_kg_per_mu: 6, N_pct: 46 },
  },
  // 开花期：增钾钙、减氮、灰霉病预防
  {
    stage: GrowthStage.Flowering,
    type: 'fertilizer',
    title: '花期增钾减氮',
    description: '提高钾钙比例，减少氮肥用量；叶面喷施0.3%磷酸二氢钾+0.2%硝酸钙，促进坐果',
    priority: 'high',
    parameters: { KH2PO4_pct: 0.3, Ca_NO3_pct: 0.2 },
  },
  {
    stage: GrowthStage.Flowering,
    type: 'pest_control',
    title: '花期灰霉病预防喷药',
    description: '花期是灰霉病高发期，预防性喷施嘧霉胺或腐霉利；注意通风降湿',
    priority: 'high',
    parameters: { 喷药间隔_d: 7 },
  },
  // 结果期：调节灌溉EC、增加排水、采收调度
  {
    stage: GrowthStage.Fruiting,
    type: 'irrigation',
    title: '结果期灌溉EC调节',
    description: '适当提高灌溉液EC至1.2-1.5mS/cm，增加排水量至20-30%，促进果实糖分积累',
    priority: 'medium',
    parameters: { 目标EC_mS: 1.35, 排水率_pct: 25 },
  },
  {
    stage: GrowthStage.Fruiting,
    type: 'fertilizer',
    title: '结果期钾肥补充',
    description: '结果期追施硫酸钾或硝酸钾，提高果实品质和糖度',
    priority: 'medium',
    parameters: { K2SO4_kg_per_mu: 4 },
  },
  // 成熟期：采收调度
  {
    stage: GrowthStage.Maturity,
    type: 'harvest',
    title: '采收调度',
    description: '果实8成熟时采收，清晨或傍晚采摘；轻拿轻放，避免机械损伤',
    priority: 'high',
  },
  // 收获期：持续采收
  {
    stage: GrowthStage.Harvest,
    type: 'harvest',
    title: '持续采收',
    description: '每2-3天采收一次，及时去除病果烂果；采收后及时预冷',
    priority: 'urgent',
  },
  // 收获后：修剪、更新
  {
    stage: GrowthStage.End,
    type: 'pruning',
    title: '采后修剪与更新',
    description: '剪除老叶病叶，保留2-3片新叶；清理田间残株；如需更新可进行匍匐茎繁殖',
    priority: 'medium',
  },
]

/** 病虫害风险到保护操作的映射 */
const PEST_PROTECTION_MAP: Record<string, { title: string; description: string; priority: OperationPriority }> = {
  '灰霉病': {
    title: '灰霉病防治喷药',
    description: '喷施嘧霉胺1000倍液或腐霉利800倍液；加强通风降湿；清除病花病果',
    priority: 'high',
  },
  '白粉病': {
    title: '白粉病防治喷药',
    description: '喷施醚菌酯1500倍液或腟菌唑2000倍液；调整种植密度改善通风',
    priority: 'high',
  },
  '红蜘蛛': {
    title: '红蜘蛛防治',
    description: '释放捕食螨（加州新小绥螨）进行生物防治；严重时喷施阿维菌素或螺螨酯',
    priority: 'medium',
  },
  '炭疽病': {
    title: '炭疽病防治喷药',
    description: '喷施咪鲜胺1000倍液或苯醚甲环唑1500倍液；雨后及时排水；地膜覆盖阻隔',
    priority: 'high',
  },
  '蚜虫': {
    title: '蚜虫防治',
    description: '悬挂黄色粘虫板监测；释放瓢虫等天敌；必要时喷施吡虫啉或噻虫嗪',
    priority: 'medium',
  },
}

/** 生长阶段中文名映射 */
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
 * 生成农事操作建议
 * 基于逐日输出、物候事件和病虫害风险，链式生成农事操作建议
 */
export function generateFarmOperations(
  dailyOutputs: DailyOutput[],
  phenologyEvents: PhenologyEvent[],
  pestRisks: PestRiskRecord[]
): FarmOperation[] {
  const operations: FarmOperation[] = []

  // ===== 1. 基于物候阶段转换生成操作 =====
  const stageOperations = generateStageBasedOperations(dailyOutputs, phenologyEvents)
  operations.push(...stageOperations)

  // ===== 2. 基于病虫害风险生成保护操作 =====
  const pestOperations = generatePestBasedOperations(pestRisks)
  operations.push(...pestOperations)

  // ===== 3. 基于气象条件生成灌溉调度 =====
  const irrigationOperations = generateETBasedIrrigation(dailyOutputs)
  operations.push(...irrigationOperations)

  // 按计划日期排序
  operations.sort((a, b) => a.plannedDate.localeCompare(b.plannedDate))

  return operations
}

/**
 * 基于物候阶段转换生成操作
 */
function generateStageBasedOperations(
  dailyOutputs: DailyOutput[],
  phenologyEvents: PhenologyEvent[]
): FarmOperation[] {
  const operations: FarmOperation[] = []
  const seenStages = new Set<GrowthStage>()

  for (const event of phenologyEvents) {
    const stage = event.stage

    if (seenStages.has(stage)) continue
    seenStages.add(stage)

    for (const rule of STAGE_OPERATION_RULES) {
      if (rule.stage !== stage) continue

      operations.push({
        id: `stage-op-${event.id}-${rule.type}`,
        type: rule.type,
        name: rule.title,
        plannedDate: event.predictedDate,
        relatedStage: event.name,
        description: rule.description,
        priority: rule.priority,
        completed: false,
        params: rule.parameters ?? {},
      })
    }
  }

  // 对于没有物候事件记录的阶段，从逐日输出中推断阶段转换
  const outputStageChanges = findStageChanges(dailyOutputs)
  for (const change of outputStageChanges) {
    if (seenStages.has(change.stage)) continue
    seenStages.add(change.stage)

    for (const rule of STAGE_OPERATION_RULES) {
      if (rule.stage !== change.stage) continue
      if (rule.condition && !rule.condition(change.output)) continue

      const dateStr = String(change.date)
      operations.push({
        id: `stage-op-${change.stage}-${rule.type}-${change.date}`,
        type: rule.type,
        name: rule.title,
        plannedDate: dateStr,
        relatedStage: getStageName(change.stage),
        description: rule.description,
        priority: rule.priority,
        completed: false,
        params: rule.parameters ?? {},
      })
    }
  }

  return operations
}

/**
 * 从逐日输出中查找阶段转换点
 */
function findStageChanges(dailyOutputs: DailyOutput[]): Array<{ date: number; stage: GrowthStage; output: DailyOutput }> {
  const changes: Array<{ date: number; stage: GrowthStage; output: DailyOutput }> = []
  let prevStage: GrowthStage | null = null

  for (const output of dailyOutputs) {
    if (output.stage !== prevStage) {
      changes.push({ date: output.day, stage: output.stage, output })
      prevStage = output.stage
    }
  }

  return changes
}

/**
 * 基于病虫害风险生成保护操作
 */
function generatePestBasedOperations(pestRisks: PestRiskRecord[]): FarmOperation[] {
  const operations: FarmOperation[] = []
  const seenPests = new Set<string>()

  for (const risk of pestRisks) {
    if (risk.riskLevel === 'low') continue

    const key = risk.name
    if (seenPests.has(key)) continue
    seenPests.add(key)

    const protection = PEST_PROTECTION_MAP[key]
    if (!protection) continue

    operations.push({
      id: `pest-op-${risk.id}`,
      type: 'pest_control',
      name: protection.title,
      plannedDate: risk.nextAlertDate,
      relatedStage: risk.relatedStage,
      description: protection.description,
      priority: risk.riskLevel === 'critical' ? 'high' : protection.priority,
      completed: false,
      params: {},
    })
  }

  return operations
}

/**
 * 基于蒸散量(ET)生成灌溉调度建议
 */
function generateETBasedIrrigation(dailyOutputs: DailyOutput[]): FarmOperation[] {
  const operations: FarmOperation[] = []
  const CONSECUTIVE_DAYS = 3
  const ET_THRESHOLD = 3.5
  const RAIN_THRESHOLD = 2

  let highETDays = 0
  let lastIrrigationDate = 0
  const MIN_IRRIGATION_INTERVAL = 5

  for (const output of dailyOutputs) {
    if (output.stage < GrowthStage.Vegetative || output.stage > GrowthStage.Harvest) {
      continue
    }

    if (output.et > ET_THRESHOLD && output.rain < RAIN_THRESHOLD) {
      highETDays++
    } else {
      highETDays = 0
    }

    if (highETDays >= CONSECUTIVE_DAYS && (output.day - lastIrrigationDate) >= MIN_IRRIGATION_INTERVAL) {
      const etDeficit = dailyOutputs
        .filter(d => d.day <= output.day && d.day > output.day - CONSECUTIVE_DAYS)
        .reduce((sum, d) => sum + Math.max(0, d.et - d.rain), 0)

      const irrigAmount = Math.round(etDeficit * 0.8)

      if (irrigAmount > 5) {
        operations.push({
          id: `et-irrig-${output.day}`,
          type: 'irrigation',
          name: 'ET调度补充灌溉',
          plannedDate: String(output.day),
          relatedStage: getStageName(output.stage),
          description: `连续${CONSECUTIVE_DAYS}日高蒸散(ET>${ET_THRESHOLD}mm/d)且无有效降雨，建议补充灌溉${irrigAmount}mm`,
          priority: 'medium',
          completed: false,
          params: { 灌溉量_mm: irrigAmount, ET亏缺_mm: Math.round(etDeficit) },
        })

        lastIrrigationDate = output.day
        highETDays = 0
      }
    }
  }

  return operations
}
