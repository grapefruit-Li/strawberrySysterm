/**
 * DSSAT CROPGRO-Strawberry 作物模型 TypeScript 移植版
 * 类型定义文件
 * 包含模拟引擎所需的所有 TypeScript 类型、接口和枚举
 */

/** 生长阶段枚举 - 基于CROPGRO物候发育阶段 */
export enum GrowthStage {
  /** 播种前 */
  PrePlanting = 0,
  /** 萌芽期 */
  Germinating = 1,
  /** 营养生长期 */
  Vegetative = 2,
  /** 开花期 */
  Flowering = 3,
  /** 结果期 */
  Fruiting = 4,
  /** 成熟期 */
  Maturity = 5,
  /** 收获期 */
  Harvest = 6,
  /** 生长结束 */
  End = 7,
}

/** 日气象数据 */
export interface DailyWeather {
  /** 日期 (YYYYMMDD格式) */
  date: number;
  /** 太阳辐射 (MJ/m²/d) */
  srad: number;
  /** 最高气温 (°C) */
  tmax: number;
  /** 最低气温 (°C) */
  tmin: number;
  /** 降水量 (mm/d) */
  rain: number;
  /** 露点温度 (°C) */
  dewp: number;
  /** 风速 (km/d) */
  wind: number;
  /** 光合有效辐射 (MJ/m²/d)，可由srad估算 */
  par: number;
  /** 蒸发量 (mm/d) */
  evap: number;
  /** 相对湿度 (%) */
  rhum: number;
}

/** 气象站信息 */
export interface WeatherStation {
  /** 站点编号 */
  stationId: string;
  /** 站点名称 */
  name: string;
  /** 纬度 (度) */
  lat: number;
  /** 经度 (度) */
  lon: number;
  /** 海拔 (m) */
  elev: number;
  /** 年平均气温 (°C) */
  tav: number;
  /** 年温度振幅 (°C) */
  amp: number;
  /** 参考高度 (m) */
  refht: number;
  /** 风速测量高度 (m) */
  wndht: number;
  /** 逐日气象数据 */
  days: DailyWeather[];
}

/** 土壤层次参数 - 基于DSSAT土壤剖面格式 */
export interface SoilLayer {
  /** 层号 */
  layerNum: number;
  /** 层厚度 (cm) */
  sldm: number;
  /** 下限含水量 (cm³/cm³) - 萎蔫点 */
  slll: number;
  /** 排水上限含水量 (cm³/cm³) - 田间持水量 */
  sldul: number;
  /** 饱和含水量 (cm³/cm³) */
  slsat: number;
  /** 根系生长因子 (0-1) */
  slrgf: number;
  /** 饱和导水率 (cm/h) */
  slks: number;
  /** 容重 (g/cm³) */
  slbdm: number;
  /** 有机碳含量 (%) */
  sloc: number;
  /** pH值 */
  slph: number;
  /** 粘粒含量 (%) */
  slcl: number;
  /** 粉粒含量 (%) */
  slsi: number;
  /** 粗砂含量 (%) */
  slcf: number;
  /** 铵态氮含量 (μg N/g 土壤) */
  slnh4: number;
  /** 硝态氮含量 (μg N/g 土壤) */
  slno3: number;
}

/** 土壤剖面参数 */
export interface SoilProfile {
  /** 土壤编号 */
  soilId: string;
  /** 土壤名称 */
  name: string;
  /** 反照率 (0-1) */
  albedo: number;
  /** 第一阶段蒸发上限 (mm) */
  u: number;
  /** SCS曲线数 */
  cn2: number;
  /** 土壤氮素矿化因子 (0-1) */
  slnf: number;
  /** 土壤磷因子 (0-1) */
  slpf: number;
  /** 土壤层次 */
  layers: SoilLayer[];
}

/**
 * 物种参数 - 基于CROPGRO模型物种文件
 * 草莓(Fragaria × ananassa)典型参数
 */
export interface SpeciesParams {
  /** 作物代码 */
  cropCode: string;
  /** 作物名称 */
  name: string;
  /** 萌芽所需GDD (°C·d) */
  pgerm: number;
  /** 营养生长阶段1 - 出苗到第一片真叶 (°C·d) */
  p1: number;
  /** 营养生长阶段2 - 第一片真叶到开花 (°C·d) */
  p2: number;
  /** 开花阶段持续时间 (°C·d) */
  p3: number;
  /** 结果阶段持续时间 (°C·d) */
  p4: number;
  /** 基础温度 (°C) - 发育下限温度 */
  tbase: number;
  /** 最适温度 (°C) - 发育最适温度 */
  topt: number;
  /** 上限温度 (°C) - 发育上限温度 */
  tmax: number;
  /** 光周期敏感性 (h⁻¹) */
  ppfpe: number;
  /** 临界光周期 (h) - 开花所需最短日照 */
  cphot: number;
  /** 最大叶面积指数 */
  laimax: number;
  /** 叶片扩展速率 (°C·d⁻¹ 对应的面积) */
  lfext: number;
  /** 比叶面积 (cm²/g) */
  sla: number;
  /** 最大光合速率 (mg CO₂/m²/s) */
  photosynmax: number;
  /** 光合作用初始光能利用效率 (mg CO₂/J) */
  quantumyield: number;
  /** 叶片呼吸系数 (g CH₂O/g 叶片/h) */
  rlf: number;
  /** 茎呼吸系数 */
  rst: number;
  /** 根呼吸系数 */
  rrt: number;
  /** 叶片维持呼吸系数 (g/g/h at 25°C) */
  rm25leaf: number;
  /** 茎维持呼吸系数 */
  rm25stem: number;
  /** 根维持呼吸系数 */
  rm25root: number;
  /** 果实维持呼吸系数 */
  rm25fruit: number;
  /** 生长呼吸系数 (g CH₂O/g 干物质) */
  rg: number;
  /** 叶片生长转换系数 (g 干物质/g CH₂O) */
  glf: number;
  /** 茎生长转换系数 */
  gst: number;
  /** 根生长转换系数 */
  grt: number;
  /** 果实生长转换系数 */
  gfr: number;
  /** 最大根系深度 (cm) */
  rdmax: number;
  /** 根系生长速率 (cm/°C·d) */
  rgrw: number;
  /** 叶片衰老速率系数 */
  senrate: number;
  /** 叶片衰老开始GDD (°C·d) */
  senstart: number;
  /** 果实收获指数上限 */
  himax: number;
  /** 种子含氮量 (g N/g 干物质) */
  seedn: number;
  /** 叶片最小含氮量 (g N/g) */
  nleaflf: number;
  /** 叶片最大含氮量 (g N/g) */
  nleafhf: number;
  /** 茎含氮量 (g N/g) */
  nstem: number;
  /** 根含氮量 (g N/g) */
  nroot: number;
  /** 果实含氮量 (g N/g) */
  nfruit: number;
  /** 水分胁迫敏感性 - 光合作用 */
  wfpu: number;
  /** 水分胁迫敏感性 - 细胞扩展 */
  wfeu: number;
  /** 氮素胁迫敏感性 - 光合作用 */
  nfpu: number;
  /** 氮素胁迫敏感性 - 细胞扩展 */
  nfeu: number;
  /** 草莓连续开花特性 - 花序间隔GDD (°C·d) */
  flrinterval: number;
  /** 草莓每花序最大果实数 */
  maxfruitpertruss: number;
  /** 果实干物质含量 (g干重/g鲜重) */
  fruitdm: number;
  /** 果实可溶性固形物基准含量 (%) */
  sscbase: number;
  /** 果实酸度基准含量 (meq/100g) */
  acidbase: number;
  /** 果实硬度基准值 (N) */
  firmbase: number;
}

/** 生态型参数 - 基于CROPGRO生态型文件 */
export interface EcotypeParams {
  /** 生态型代码 */
  ecoCode: string;
  /** 生态型名称 */
  name: string;
  /** 基础温度 (°C) */
  tbase: number;
  /** 最适温度 (°C) */
  topt: number;
  /** 上限温度 (°C) */
  tmax: number;
  /** 光周期临界值 (h) */
  cphot: number;
  /** 光周期敏感性 */
  ppfpe: number;
  /** 叶面积指数最大值 */
  laimax: number;
  /** 比叶面积 (cm²/g) */
  sla: number;
  /** 最大光合速率 (mg CO₂/m²/s) */
  photosynmax: number;
  /** 叶片维持呼吸系数 */
  rm25leaf: number;
  /** 茎维持呼吸系数 */
  rm25stem: number;
  /** 根维持呼吸系数 */
  rm25root: number;
  /** 果实维持呼吸系数 */
  rm25fruit: number;
  /** 生长呼吸系数 */
  rg: number;
  /** 叶分配系数 */
  partleaf: number;
  /** 茎分配系数 */
  partstem: number;
  /** 根分配系数 */
  partroot: number;
  /** 果分配系数 */
  partfruit: number;
  /** 种植密度 (株/m²) */
  pltdensity: number;
  /** 行距 (cm) */
  rowspc: number;
  /** 初始根系深度 (cm) */
  rtdepinit: number;
  /** 最大根系深度 (cm) */
  rtdepmax: number;
}

/** 品种参数 - 基于CROPGRO品种文件 */
export interface CultivarParams {
  /** 品种代码 */
  culCode: string;
  /** 品种名称 */
  name: string;
  /** 所属生态型代码 */
  ecoCode: string;
  /** 所属作物代码 */
  cropCode: string;
  /** 品种特有参数 - 营养生长阶段1 (°C·d) */
  p1v: number;
  /** 品种特有参数 - 营养生长阶段2 (°C·d) */
  p1r: number;
  /** 品种特有参数 - 开花阶段 (°C·d) */
  p3: number;
  /** 品种特有参数 - 结果阶段 (°C·d) */
  p4: number;
  /** 品种特有参数 - 最大叶面积指数 */
  laimax: number;
  /** 品种特有参数 - 比叶面积 (cm²/g) */
  sla: number;
  /** 品种特有参数 - 最大光合速率 */
  photosynmax: number;
  /** 品种特有参数 - 收获指数 */
  hi: number;
  /** 品种特有参数 - 果实干物质含量 */
  fruitdm: number;
  /** 品种特有参数 - 果实含氮量 */
  nfruit: number;
  /** 品种特有参数 - 花序间隔GDD */
  flrinterval: number;
  /** 品种特有参数 - 每花序最大果实数 */
  maxfruitpertruss: number;
}

/** 管理事件类型 */
export type ManagementEventType = 'planting' | 'irrigation' | 'fertilizer' | 'harvest';

/** 管理事件 */
export interface ManagementEvent {
  /** 事件类型 */
  eventType: ManagementEventType;
  /** 日期 (YYYYMMDD格式) */
  date: number;
  /** 数量 (灌溉mm, 肥料kg/ha, 收获kg/ha) */
  amount: number;
  /** 详细信息 */
  details: Record<string, number | string>;
}

/** 模拟配置 */
export interface SimulationConfig {
  /** 气象数据 */
  weather: WeatherStation;
  /** 土壤剖面 */
  soil: SoilProfile;
  /** 品种参数 */
  cultivar: CultivarParams;
  /** 生态型参数 */
  ecotype: EcotypeParams;
  /** 物种参数 */
  species: SpeciesParams;
  /** 管理事件列表 */
  management: ManagementEvent[];
  /** 模拟开始日期 (YYYYMMDD) */
  startDate: number;
  /** 模拟结束日期 (YYYYMMDD) */
  endDate: number;
}

/** 植物状态 - 模拟过程中跟踪的植物生长状态 */
export interface PlantState {
  /** 播种后天数 (d) */
  dap: number;
  /** 当前生长阶段 */
  stage: GrowthStage;
  /** 累积生长度日 (°C·d) */
  gdd: number;
  /** 叶面积指数 (m²/m²) */
  lai: number;
  /** 总生物量 (kg/ha) */
  biomass: number;
  /** 叶片干重 (kg/ha) */
  leafWt: number;
  /** 茎干重 (kg/ha) */
  stemWt: number;
  /** 根干重 (kg/ha) */
  rootWt: number;
  /** 果实干重 (kg/ha) */
  fruitWt: number;
  /** 氮胁迫因子 (0-1, 1=无胁迫) */
  nStress: number;
  /** 水分胁迫因子 (0-1, 1=无胁迫) */
  wStress: number;
  /** 温度胁迫因子 (0-1, 1=无胁迫) */
  tStress: number;
  /** 根系深度 (cm) */
  rootDepth: number;
  /** 植物氮含量 (kg N/ha) */
  plantN: number;
  /** 叶片氮含量 (kg N/ha) */
  leafN: number;
  /** 茎氮含量 (kg N/ha) */
  stemN: number;
  /** 根氮含量 (kg N/ha) */
  rootN: number;
  /** 果实氮含量 (kg N/ha) */
  fruitN: number;
  /** 当日碳同化量 (kg CH₂O/ha/d) */
  carbh2o: number;
  /** 当日潜在碳同化量 (kg CH₂O/ha/d) */
  carbh2oPot: number;
  /** 当日维持呼吸消耗 (kg CH₂O/ha/d) */
  maintResp: number;
  /** 当日生长呼吸消耗 (kg CH₂O/ha/d) */
  growResp: number;
  /** 当日实际蒸腾量 (mm/d) */
  ep: number;
  /** 当日潜在蒸腾量 (mm/d) */
  eop: number;
  /** 草莓特有 - 当前活跃花序数 */
  activeTrusses: number;
  /** 草莓特有 - 累计果实数 */
  fruitNum: number;
  /** 草莓特有 - 累计收获鲜重 (kg/ha) */
  harvestedFreshWt: number;
  /** 草莓特有 - 累计收获干重 (kg/ha) */
  harvestedDryWt: number;
  /** 草莓特有 - 连续开花GDD计数器 */
  flrGddCounter: number;
  /** 草莓特有 - 光热年龄 (°C·d) */
  photoThermalAge: number;
  /** 叶片衰老累积量 (kg/ha) */
  senescedLeaf: number;
}

/** 土壤状态 - 模拟过程中跟踪的土壤水分和氮素状态 */
export interface SoilState {
  /** 各层体积含水量 (cm³/cm³) */
  swContent: number[];
  /** 各层硝态氮含量 (kg N/ha) */
  no3: number[];
  /** 各层铵态氮含量 (kg N/ha) */
  nh4: number[];
  /** 各层矿化速率 (kg N/ha/d) */
  mineralization: number[];
  /** 累计径流量 (mm) */
  runoff: number;
  /** 累计排水量 (mm) */
  drainage: number;
  /** 累计蒸发量 (mm) */
  evapCum: number;
  /** 累计蒸腾量 (mm) */
  transCum: number;
  /** 第一阶段蒸发累积量 (mm) */
  stage1Evap: number;
  /** 当日实际蒸发量 (mm) */
  es: number;
  /** 当日潜在蒸发量 (mm) */
  eos: number;
}

/** 逐日输出记录 */
export interface DailyOutput {
  /** 日期 (YYYYMMDD) */
  day: number;
  /** 播种后天数 (d) */
  das: number;
  /** 叶面积指数 */
  lai: number;
  /** 总生物量 (kg/ha) */
  biomass: number;
  /** 叶片干重 (kg/ha) */
  leafWt: number;
  /** 茎干重 (kg/ha) */
  stemWt: number;
  /** 根干重 (kg/ha) */
  rootWt: number;
  /** 果实干重 (kg/ha) */
  fruitWt: number;
  /** 水分胁迫因子 (0-1) */
  swfac: number;
  /** 氮素胁迫因子 (0-1) */
  nstres: number;
  /** 温度胁迫因子 (0-1) */
  tfac: number;
  /** 生长阶段 */
  stage: GrowthStage;
  /** 累积GDD (°C·d) */
  gdd: number;
  /** 根系深度 (cm) */
  rootDepth: number;
  /** 日降水量 (mm) */
  rain: number;
  /** 日灌溉量 (mm) */
  irrig: number;
  /** 日蒸散量 (mm) */
  et: number;
  /** 日径流量 (mm) */
  runoff: number;
  /** 日排水量 (mm) */
  drainage: number;
  /** 日最高气温 (°C) */
  tmax: number;
  /** 日最低气温 (°C) */
  tmin: number;
  /** 日太阳辐射 (MJ/m²) */
  srad: number;
  /** 活跃花序数 */
  activeTrusses: number;
  /** 果实数量 */
  fruitNum: number;
  /** 碳同化量 (kg/ha/d) */
  carbh2o: number;
  /** 植物氮含量 (kg N/ha) */
  plantN: number;
}

/** 收获记录 */
export interface HarvestRecord {
  /** 收获日期 (YYYYMMDD) */
  date: number;
  /** 鲜重 (kg/ha) */
  freshWt: number;
  /** 干重 (kg/ha) */
  dryWt: number;
  /** 果实数量 */
  fruitNum: number;
  /** 可溶性固形物含量 (%) */
  ssc: number;
  /** 可滴定酸度 (meq/100g) */
  acidity: number;
  /** 硬度 (N) */
  firmness: number;
}

/** 模拟结果摘要 */
export interface SimulationSummary {
  /** 总生物量 (kg/ha) */
  totalBiomass: number;
  /** 总果实鲜重 (kg/ha) */
  totalFruitFreshWt: number;
  /** 总果实干重 (kg/ha) */
  totalFruitDryWt: number;
  /** 收获指数 */
  harvestIndex: number;
  /** 总果实数量 */
  totalFruitNum: number;
  /** 平均果实鲜重 (g) */
  avgFruitFreshWt: number;
  /** 平均可溶性固形物含量 (%) */
  avgSSC: number;
  /** 平均酸度 (meq/100g) */
  avgAcidity: number;
  /** 平均硬度 (N) */
  avgFirmness: number;
  /** 累积蒸散量 (mm) */
  totalET: number;
  /** 累积降水量 (mm) */
  totalRain: number;
  /** 累积灌溉量 (mm) */
  totalIrrig: number;
  /** 累积径流量 (mm) */
  totalRunoff: number;
  /** 累积排水量 (mm) */
  totalDrainage: number;
  /** 水分利用效率 (kg/m³) */
  wue: number;
  /** 模拟天数 */
  simDays: number;
  /** 最终LAI */
  finalLAI: number;
}

/** 模拟结果 */
export interface SimulationResult {
  /** 模拟配置 */
  config: SimulationConfig;
  /** 逐日输出 */
  dailyOutputs: DailyOutput[];
  /** 收获记录 */
  harvests: HarvestRecord[];
  /** 摘要统计 */
  summary: SimulationSummary;
}


/** 区域配置 */
export interface RegionConfig {
  id: string
  name: string
  country: string
  lat: number
  lon: number
  climateType: string
  avgTemp: number
  annualRain: number
  growingSeason: string
  elevation: number
}

/** 品种完整参数（含展示信息） */
export interface CultivarFullParams {
  code: string
  name: string
  type: '短日型' | '日中性'
  origin: string
  fruitDesc: string
  keyParams: {
    avgFruitWeight: number
    ssc: number
    firmness: number
    harvestIndex: number
  }
  reliability: number
  cultivarParams: CultivarParams
  ecotypeParams: EcotypeParams
  /** V2新增：需冷量 (小时) — 从 DSSAT 文献补充 */
  chillingRequirement?: number
  /** V2新增：营养生长期积温 (°C·d) — P1V + P1R 计算 */
  vegGdd?: number
  /** V2新增：开花至成熟天数 */
  flowerToMature?: number
  /** V2新增：第一茬占比 (0-1) */
  firstFlushRatio?: number
  /** V2新增：第二茬占比 (0-1) */
  secondFlushRatio?: number
}

/** V2新增：农事阶段时间轴 */
export interface StageTimeline {
  name: string
  startMonth: number
  endMonth: number
  color: string
  operations: string[]
}

/** 物候事件 */
export interface PhenologyEvent {
  id: string
  name: string
  startDate: number
  endDate: number
  startGdd: number
  endGdd: number
  duration: number
  stage: GrowthStage
  predictedDate: string
  description: string
  envRequirements: string
}

/** 病虫害风险等级 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

/** 病虫害风险记录 */
export interface PestRiskRecord {
  id: string
  name: string
  scientificName: string
  riskLevel: RiskLevel
  riskIndex: number
  relatedStage: string
  description: string
  controlRecommendation: string
  preventionMeasures: string[]
  dailyRiskIndex: { date: string; index: number }[]
  nextAlertDate: string
}

/** 农事操作优先级 */
export type OperationPriority = 'low' | 'medium' | 'high' | 'urgent'

/** 农事操作类型 */
export type OperationType = 'irrigation' | 'fertilizer' | 'pruning' | 'pest_control' | 'harvest' | 'planting' | 'monitoring'

/** 农事操作记录 */
export interface FarmOperation {
  id: string
  type: OperationType
  name: string
  plannedDate: string
  relatedStage: string
  description: string
  priority: OperationPriority
  completed: boolean
  params: Record<string, number | string>
}

/** 链式模拟结果 */
export interface ChainSimulationResult {
  dailyOutputs: DailyOutput[]
  harvests: HarvestRecord[]
  summary: SimulationSummary
  phenologyEvents: PhenologyEvent[]
  pestRisks: PestRiskRecord[]
  farmOperations: FarmOperation[]
}
