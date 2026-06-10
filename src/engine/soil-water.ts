/**
 * DSSAT CROPGRO-Strawberry 土壤水分平衡模块
 * 基于CROPGRO模型的土壤水分平衡计算
 * 包含PET计算(Priestley-Taylor)、土壤蒸发、植物蒸腾、
 * 径流(SCS曲线数法)、排水和土壤水分更新
 */

import { SoilProfile, SoilState, PlantState, DailyWeather, GrowthStage } from './types';

/** Priestley-Taylor系数 α */
const PT_ALPHA = 1.1;
/** 饱和蒸汽压曲线斜率/心理计量常数比的相关常数 */
const PSYCHRO_CONST = 0.66; // kPa/°C

/**
 * 计算饱和蒸汽压 - Tetens公式
 * @param t 温度 (°C)
 * @returns 饱和蒸汽压 (kPa)
 */
function saturationVaporPressure(t: number): number {
  return 0.6108 * Math.exp(17.27 * t / (t + 237.3));
}

/**
 * 计算饱和蒸汽压曲线斜率
 * @param t 温度 (°C)
 * @returns 斜率 (kPa/°C)
 */
function slopeOfSatVaporPressure(t: number): number {
  const es = saturationVaporPressure(t);
  return 4098 * es / Math.pow(t + 237.3, 2);
}

/**
 * 计算潜在蒸散量(PET) - Priestley-Taylor方法
 * 基于净辐射和温度的简化蒸散估算
 * @param srad 太阳辐射 (MJ/m²/d)
 * @param tmax 最高气温 (°C)
 * @param tmin 最低气温 (°C)
 * @param albedo 地表反照率 (0-1)
 * @param wind 风速 (km/d)
 * @returns 潜在蒸散量 (mm/d)
 */
export function calcPET(
  srad: number,
  tmax: number,
  tmin: number,
  albedo: number,
  wind: number
): number {
  const tavg = (tmax + tmin) / 2;

  // 净辐射 (MJ/m²/d)
  // 简化计算：净短波辐射 = (1-α) × srad
  const netRad = (1 - albedo) * srad;

  // 净长波辐射 (简化估算)
  // 基于温度的经验公式
  const netLW = 2.45e-3 * (Math.pow(tmax + 273.16, 4) + Math.pow(tmin + 273.16, 4)) / 2 * 0.0000001;
  const netRadTotal = Math.max(0, netRad - netLW);

  // 蒸发潜热 (MJ/kg)
  const lambda = 2.45;

  // 饱和蒸汽压曲线斜率
  const delta = slopeOfSatVaporPressure(tavg);

  // 心理计量常数 (简化)
  const gamma = PSYCHRO_CONST;

  // Priestley-Taylor PET
  // PET = α × (Δ/(Δ+γ)) × Rn / λ
  const pet = PT_ALPHA * (delta / (delta + gamma)) * netRadTotal / lambda;

  // 风速修正 (简单线性修正)
  const windFactor = 1 + 0.01 * Math.min(wind, 500) / 100;

  return Math.max(0, pet * windFactor);
}

/**
 * 计算土壤蒸发 - 基于CROPGRO两阶段蒸发模型
 * 阶段1: 能量限制阶段，蒸发速率等于潜在蒸发
 * 阶段2: 水分限制阶段，蒸发速率随时间平方根递减
 * @param eos 潜在土壤蒸发 (mm/d)
 * @param soilState 土壤状态
 * @param soil 土壤剖面参数
 * @returns 实际土壤蒸发 (mm/d)
 */
export function calcSoilEvaporation(
  eos: number,
  soilState: SoilState,
  soil: SoilProfile
): number {
  const u = soil.u; // 第一阶段蒸发上限 (mm)

  // 第一阶段：能量限制
  if (soilState.stage1Evap < u) {
    // 仍在第一阶段
    const es = Math.min(eos, u - soilState.stage1Evap);
    return Math.max(0, es);
  }

  // 第二阶段：水分限制
  // 蒸发速率随时间递减: ES = ET0 × √(t)
  // 简化计算：使用累积蒸发量与上限的比值
  const excessEvap = soilState.stage1Evap - u;
  const stage2Rate = eos * Math.sqrt(u / (u + excessEvap + 1));

  return Math.max(0, stage2Rate);
}

/**
 * 计算植物蒸腾 - 基于PET和LAI
 * @param pet 潜在蒸散量 (mm/d)
 * @param eos 潜在土壤蒸发 (mm/d)
 * @param lai 叶面积指数
 * @param swfac 水分胁迫因子 (0-1)
 * @returns 实际植物蒸腾 (mm/d)
 */
export function calcPlantTranspiration(
  pet: number,
  eos: number,
  lai: number,
  swfac: number
): number {
  // 潜在蒸腾 = PET - 潜在土壤蒸发
  const eop = Math.max(0, pet - eos);

  // LAI对蒸腾的调节 (当LAI较小时蒸腾减少)
  const laiFactor = Math.min(1, lai / 3.0);

  // 实际蒸腾受水分胁迫调节
  const ep = eop * laiFactor * swfac;

  return Math.max(0, ep);
}

/**
 * 计算径流量 - SCS曲线数法
 * 基于USDA-SCS径流曲线数方法
 * @param rain 降水量 (mm/d)
 * @param cn2 SCS曲线数 (条件II)
 * @returns 径流量 (mm/d)
 */
export function calcRunoff(
  rain: number,
  cn2: number
): number {
  if (rain <= 0) return 0;

  // 初始抽象量 (通常为蓄水量的0.2倍)
  const s = 254 * (100 / cn2 - 1); // 最大蓄水量 (mm)
  const ia = 0.2 * s; // 初始抽象量 (mm)

  // SCS径流公式
  let runoff = 0;
  if (rain > ia) {
    runoff = Math.pow(rain - ia, 2) / (rain - ia + s);
  }

  return Math.max(0, runoff);
}

/**
 * 计算排水量 - 基于Cass-Driessen方法
 * 当土壤含水量超过排水上限时，多余水分排出
 * @param layerIndex 层号索引
 * @param sw 当前体积含水量 (cm³/cm³)
 * @param dul 排水上限 (cm³/cm³)
 * @param sat 饱和含水量 (cm³/cm³)
 * @param ks 饱和导水率 (cm/h)
 * @param layerThickness 层厚度 (cm)
 * @returns 排水量 (mm)
 */
export function calcDrainage(
  layerIndex: number,
  sw: number,
  dul: number,
  sat: number,
  ks: number,
  layerThickness: number
): number {
  // 只有当含水量超过排水上限时才排水
  if (sw <= dul) return 0;

  // 可排水量 (cm)
  const drainable = (sw - dul) * layerThickness;

  // 排水速率 - 基于饱和导水率和含水量状态
  // 使用简化指数衰减模型
  const swFraction = (sw - dul) / (sat - dul);
  const drainRate = ks * 24 * Math.pow(swFraction, 2); // cm/d

  // 实际排水量取可排水量和排水速率的较小值
  const drainage = Math.min(drainable, drainRate);

  return Math.max(0, drainage * 10); // cm → mm
}

/**
 * 更新各层土壤含水量
 * 基于水分平衡方程: SW_new = SW_old + Rain - Runoff - Evap - Transp - Drainage + Irrigation
 * @param soilState 土壤状态
 * @param soil 土壤剖面参数
 * @param rain 降水量 (mm)
 * @param irrigation 灌溉量 (mm)
 * @param es 土壤蒸发 (mm)
 * @param ep 植物蒸腾 (mm)
 * @param runoff 径流量 (mm)
 * @param rootDepth 根系深度 (cm)
 * @returns 更新后的土壤含水量数组和日排水量
 */
export function updateSoilWater(
  soilState: SoilState,
  soil: SoilProfile,
  rain: number,
  irrigation: number,
  es: number,
  ep: number,
  runoff: number,
  rootDepth: number
): { swContent: number[]; dailyDrainage: number } {
  const layers = soil.layers;
  const newSW = [...soilState.swContent];
  let dailyDrainage = 0;

  // 有效降水量 (扣除径流)
  const effectiveRain = Math.max(0, rain - runoff);
  const totalInput = effectiveRain + irrigation; // mm

  // 将蒸发和蒸腾分配到各层
  // 蒸发主要发生在表层
  // 蒸腾根据根系分布分配到各层

  let totalDepth = 0;
  const layerDepths: number[] = [];
  const rootFractions: number[] = [];

  for (let i = 0; i < layers.length; i++) {
    totalDepth += layers[i].sldm;
    layerDepths.push(layers[i].sldm);
  }

  // 计算各层根系比例
  let cumDepth = 0;
  let totalRootFraction = 0;
  for (let i = 0; i < layers.length; i++) {
    cumDepth += layers[i].sldm;
    const layerTop = cumDepth - layers[i].sldm;
    const layerBottom = cumDepth;

    if (layerTop >= rootDepth) {
      rootFractions.push(0);
    } else {
      const rootInLayer = Math.min(layerBottom, rootDepth) - layerTop;
      const rf = (rootInLayer / layers[i].sldm) * layers[i].slrgf;
      rootFractions.push(rf);
      totalRootFraction += rf;
    }
  }

  // 归一化根系比例
  if (totalRootFraction > 0) {
    for (let i = 0; i < rootFractions.length; i++) {
      rootFractions[i] /= totalRootFraction;
    }
  }

  // 水分输入 - 从上层向下渗透
  let waterToDistribute = totalInput; // mm

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const thickness = layer.sldm; // cm
    const ll = layer.slll; // 下限含水量
    const dul = layer.sldul; // 排水上限
    const sat = layer.slsat; // 饱和含水量

    // 当前层含水量 (cm³/cm³ → mm)
    const swMm = newSW[i] * thickness * 10; // mm

    // 水分输入到该层
    const inputToLayer = waterToDistribute;
    let newSwMm = swMm + inputToLayer;

    // 扣除蒸发 (仅表层)
    if (i === 0) {
      newSwMm -= es;
    }

    // 扣除蒸腾 (根据根系分布)
    newSwMm -= ep * rootFractions[i];

    // 确保含水量不低于下限
    const llMm = ll * thickness * 10;
    newSwMm = Math.max(llMm, newSwMm);

    // 计算排水
    const drainage = calcDrainage(i, newSW[i], dul, sat, layer.slks, thickness);

    // 扣除排水
    newSwMm -= drainage;
    dailyDrainage += drainage;

    // 限制含水量不超过饱和
    const satMm = sat * thickness * 10;
    if (newSwMm > satMm) {
      // 超过饱和的水量传递到下一层
      waterToDistribute = newSwMm - satMm;
      newSwMm = satMm;
    } else {
      waterToDistribute = 0;
    }

    // 转换回体积含水量
    newSW[i] = newSwMm / (thickness * 10);

    // 确保含水量在合理范围内
    newSW[i] = Math.max(ll, Math.min(sat, newSW[i]));
  }

  return { swContent: newSW, dailyDrainage };
}

/**
 * 计算水分胁迫因子 - 基于CROPGRO模型
 * 水分胁迫因子由实际蒸腾与潜在蒸腾的比值决定
 * @param ep 实际蒸腾 (mm/d)
 * @param eop 潜在蒸腾 (mm/d)
 * @param wfpu 水分胁迫敏感性 - 光合作用
 * @param wfeu 水分胁迫敏感性 - 细胞扩展
 * @param stressType 'photosynthesis' 或 'expansion'
 * @returns 水分胁迫因子 (0-1, 1=无胁迫)
 */
export function calcWaterStressFactor(
  ep: number,
  eop: number,
  wfpu: number,
  wfeu: number,
  stressType: 'photosynthesis' | 'expansion' = 'photosynthesis'
): number {
  if (eop <= 0) return 1.0;

  // 蒸腾比率
  const tratio = ep / eop;

  // 根据胁迫类型选择敏感性参数
  const sensitivity = stressType === 'photosynthesis' ? wfpu : wfeu;

  // CROPGRO水分胁迫因子公式
  // SWFAC = 1 / (1 + sensitivity * (1/tratio - 1))
  const swfac = 1 / (1 + sensitivity * (1 / tratio - 1));

  return Math.max(0, Math.min(1, swfac));
}

/**
 * 计算根系可吸收水量
 * @param soilState 土壤状态
 * @param soil 土壤剖面参数
 * @param rootDepth 根系深度 (cm)
 * @returns 可吸收水量 (mm)
 */
export function calcAvailableWater(
  soilState: SoilState,
  soil: SoilProfile,
  rootDepth: number
): number {
  let available = 0;
  let cumDepth = 0;

  for (let i = 0; i < soil.layers.length; i++) {
    const layer = soil.layers[i];
    cumDepth += layer.sldm;

    if (cumDepth - layer.sldm >= rootDepth) break;

    const layerTop = cumDepth - layer.sldm;
    const layerBottom = cumDepth;
    const rootInLayer = Math.min(layerBottom, rootDepth) - layerTop;
    const fraction = rootInLayer / layer.sldm;

    // 可吸收水 = (当前含水量 - 下限含水量) × 层厚 × 根系比例
    const availSW = (soilState.swContent[i] - layer.slll) * layer.sldm * 10 * fraction;
    available += Math.max(0, availSW);
  }

  return available;
}
