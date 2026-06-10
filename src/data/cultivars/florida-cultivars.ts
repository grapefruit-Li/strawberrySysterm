/**
 * 佛罗里达草莓品种数据
 * 包含Florida Radiance和Florida Brilliance两个主要品种
 * 基于CROPGRO-Strawberry模型参数
 */
import type { CultivarParams, EcotypeParams } from '@/engine/types'

// ==================== 生态型参数 ====================

/** Florida短日型草莓生态型 */
export const floridaShortDayEcotype: EcotypeParams = {
  ecoCode: 'FLSD0001',
  name: 'Florida Short-Day Strawberry',
  tbase: 5.0,         // 基础温度 (°C)
  topt: 22.0,         // 最适温度 (°C)
  tmax: 35.0,         // 上限温度 (°C)
  cphot: 12.0,        // 临界光周期 (h)
  ppfpe: 0.003,       // 光周期敏感性
  laimax: 4.5,        // 最大叶面积指数
  sla: 350.0,         // 比叶面积 (cm²/g)
  photosynmax: 1.2,   // 最大光合速率
  rm25leaf: 0.030,    // 叶片维持呼吸系数
  rm25stem: 0.015,    // 茎维持呼吸系数
  rm25root: 0.010,    // 根维持呼吸系数
  rm25fruit: 0.020,   // 果实维持呼吸系数
  rg: 0.15,           // 生长呼吸系数
  partleaf: 0.35,     // 叶分配系数
  partstem: 0.25,     // 茎分配系数
  partroot: 0.15,     // 根分配系数
  partfruit: 0.25,    // 果分配系数
  pltdensity: 8.0,    // 种植密度 (株/m²)
  rowspc: 100,        // 行距 (cm)
  rtdepinit: 5.0,     // 初始根系深度 (cm)
  rtdepmax: 60.0,     // 最大根系深度 (cm)
}

// ==================== 品种参数 ====================

/** Florida Radiance品种参数 */
export const floridaRadiance: CultivarParams = {
  culCode: 'FLRADI',
  name: 'Florida Radiance',
  ecoCode: 'FLSD0001',
  cropCode: 'SWBRRY',
  p1v: 320.0,         // 营养生长阶段1 (°C·d) - 较早开花
  p1r: 300.0,         // 营养生长阶段2 (°C·d)
  p3: 230.0,          // 开花阶段 (°C·d)
  p4: 320.0,          // 结果阶段 (°C·d)
  laimax: 4.2,        // 最大叶面积指数
  sla: 340.0,         // 比叶面积 (cm²/g)
  photosynmax: 1.15,  // 最大光合速率
  hi: 0.52,           // 收获指数
  fruitdm: 0.095,     // 果实干物质含量 (9.5%)
  nfruit: 0.008,      // 果实含氮量
  flrinterval: 75.0,  // 花序间隔GDD
  maxfruitpertruss: 4, // 每花序最大果实数
}

/** Florida Brilliance品种参数 */
export const floridaBrilliance: CultivarParams = {
  culCode: 'FLBRIL',
  name: 'Florida Brilliance',
  ecoCode: 'FLSD0001',
  cropCode: 'SWBRRY',
  p1v: 340.0,         // 营养生长阶段1 (°C·d) - 稍晚开花
  p1r: 320.0,         // 营养生长阶段2 (°C·d)
  p3: 240.0,          // 开花阶段 (°C·d)
  p4: 340.0,          // 结果阶段 (°C·d)
  laimax: 4.5,        // 最大叶面积指数 - 较旺盛
  sla: 360.0,         // 比叶面积 (cm²/g)
  photosynmax: 1.25,  // 最大光合速率 - 较高
  hi: 0.56,           // 收获指数 - 较高
  fruitdm: 0.100,     // 果实干物质含量 (10.0%)
  nfruit: 0.009,      // 果实含氮量
  flrinterval: 80.0,  // 花序间隔GDD
  maxfruitpertruss: 5, // 每花序最大果实数
}

/** 所有内置品种列表 */
export const builtInCultivars: CultivarParams[] = [
  floridaRadiance,
  floridaBrilliance,
]

/** 所有内置生态型列表 */
export const builtInEcotypes: EcotypeParams[] = [
  floridaShortDayEcotype,
]
