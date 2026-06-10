/**
 * 草莓物种参数数据
 * 基于CROPGRO-Strawberry (DSSAT) 模型参数
 * 参考: Boote et al., 2012; Mendoza et al., 2020
 */
import type { SpeciesParams } from '@/engine/types'

/** 草莓物种参数 (Fragaria × ananassa) */
export const strawberrySpecies: SpeciesParams = {
  cropCode: 'SWBRRY',
  name: 'Strawberry',

  // 发育阶段热时间参数
  pgerm: 50.0,       // 萌芽所需GDD (°C·d)
  p1: 350.0,         // 出苗到第一片真叶 (°C·d)
  p2: 300.0,         // 第一片真叶到开花 (°C·d)
  p3: 250.0,         // 开花阶段持续时间 (°C·d)
  p4: 350.0,         // 结果阶段持续时间 (°C·d)

  // 温度参数
  tbase: 5.0,        // 基础温度 (°C)
  topt: 22.0,        // 最适温度 (°C)
  tmax: 35.0,        // 上限温度 (°C)

  // 光周期参数
  ppfpe: 0.003,      // 光周期敏感性 (h⁻¹)
  cphot: 12.0,       // 临界光周期 (h)

  // 叶面积参数
  laimax: 4.5,       // 最大叶面积指数
  lfext: 0.045,      // 叶片扩展速率
  sla: 350.0,        // 比叶面积 (cm²/g)

  // 光合作用参数
  photosynmax: 1.2,   // 最大光合速率 (mg CO₂/m²/s)
  quantumyield: 0.00055, // 初始光能利用效率

  // 呼吸参数
  rlf: 0.015,        // 叶片呼吸系数
  rst: 0.010,        // 茎呼吸系数
  rrt: 0.010,        // 根呼吸系数
  rm25leaf: 0.030,   // 叶片维持呼吸系数
  rm25stem: 0.015,   // 茎维持呼吸系数
  rm25root: 0.010,   // 根维持呼吸系数
  rm25fruit: 0.020,  // 果实维持呼吸系数
  rg: 0.15,          // 生长呼吸系数

  // 生长转换系数
  glf: 0.65,         // 叶片生长转换系数
  gst: 0.55,         // 茎生长转换系数
  grt: 0.70,         // 根生长转换系数
  gfr: 0.60,         // 果实生长转换系数

  // 根系参数
  rdmax: 60.0,       // 最大根系深度 (cm)
  rgrw: 1.8,         // 根系生长速率 (cm/°C·d)

  // 衰老参数
  senrate: 0.008,    // 叶片衰老速率系数
  senstart: 800.0,   // 叶片衰老开始GDD (°C·d)

  // 收获指数
  himax: 0.55,       // 果实收获指数上限

  // 氮素参数
  seedn: 0.005,      // 种子含氮量
  nleaflf: 0.025,    // 叶片最小含氮量
  nleafhf: 0.050,    // 叶片最大含氮量
  nstem: 0.012,      // 茎含氮量
  nroot: 0.010,      // 根含氮量
  nfruit: 0.008,     // 果实含氮量

  // 胁迫敏感系数
  wfpu: 1.25,        // 水分胁迫敏感性 - 光合作用
  wfeu: 1.50,        // 水分胁迫敏感性 - 细胞扩展
  nfpu: 1.10,        // 氮素胁迫敏感性 - 光合作用
  nfeu: 1.30,        // 氮素胁迫敏感性 - 细胞扩展

  // 草莓特有参数
  flrinterval: 80.0,      // 花序间隔GDD (°C·d)
  maxfruitpertruss: 5,    // 每花序最大果实数
  fruitdm: 0.10,          // 果实干物质含量
  sscbase: 8.0,           // 可溶性固形物基准含量 (%)
  acidbase: 7.5,          // 酸度基准含量 (meq/100g)
  firmbase: 2.5,          // 硬度基准值 (N)
}
