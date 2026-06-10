/**
 * DSSAT CROPGRO-Strawberry 胁迫因子计算模块
 * 包含水分胁迫、氮素胁迫和温度胁迫因子的计算
 * 胁迫因子范围为0-1，1表示无胁迫，0表示完全胁迫
 */

import { PlantState, SoilState, SoilProfile, SpeciesParams, GrowthStage } from './types';

/**
 * 计算水分胁迫因子 - 基于土壤水分有效性
 * 使用CROPGRO模型的方法，基于实际蒸腾与潜在蒸腾的比值
 * @param ep 实际蒸腾 (mm/d)
 * @param eop 潜在蒸腾 (mm/d)
 * @param species 物种参数
 * @param stressType 胁迫类型: 'photosynthesis'(光合) 或 'expansion'(细胞扩展)
 * @returns 水分胁迫因子 (0-1, 1=无胁迫)
 */
export function calcWaterStress(
  ep: number,
  eop: number,
  species: SpeciesParams,
  stressType: 'photosynthesis' | 'expansion' = 'photosynthesis'
): number {
  if (eop <= 0) return 1.0;

  // 蒸腾比率
  const tratio = Math.min(1, ep / eop);

  // 根据胁迫类型选择敏感性参数
  // wfpu: 水分胁迫对光合作用的敏感性
  // wfeu: 水分胁迫对细胞扩展的敏感性
  const sensitivity = stressType === 'photosynthesis' ? species.wfpu : species.wfeu;

  if (sensitivity <= 0) return tratio;

  // CROPGRO水分胁迫因子公式
  // 当 tratio < 1 时，胁迫因子按非线性函数递减
  // SWFAC = 1 / (1 + sensitivity × (1/tratio - 1))
  let swfac: number;
  if (tratio >= 1.0) {
    swfac = 1.0;
  } else if (tratio <= 0.01) {
    swfac = 0;
  } else {
    swfac = 1 / (1 + sensitivity * (1 / tratio - 1));
  }

  return Math.max(0, Math.min(1, swfac));
}

/**
 * 计算综合水分胁迫因子
 * 取光合胁迫和细胞扩展胁迫中的较小值
 * @param ep 实际蒸腾 (mm/d)
 * @param eop 潜在蒸腾 (mm/d)
 * @param species 物种参数
 * @returns 综合水分胁迫因子 (0-1)
 */
export function calcCombinedWaterStress(
  ep: number,
  eop: number,
  species: SpeciesParams
): number {
  const photoStress = calcWaterStress(ep, eop, species, 'photosynthesis');
  const expansionStress = calcWaterStress(ep, eop, species, 'expansion');
  return Math.min(photoStress, expansionStress);
}

/**
 * 计算氮素胁迫因子 - 基于植物氮浓度
 * 使用CROPGRO模型的方法，基于叶片氮浓度与临界氮浓度的比值
 * @param plant 植物状态
 * @param species 物种参数
 * @param nSupply 氮供应速率 (kg N/ha/d)
 * @param nDemand 氮需求速率 (kg N/ha/d)
 * @returns 氮素胁迫因子 (0-1, 1=无胁迫)
 */
export function calcNitrogenStress(
  plant: PlantState,
  species: SpeciesParams,
  nSupply: number,
  nDemand: number
): number {
  // 基于叶片氮浓度的胁迫计算
  if (plant.leafWt <= 0) return 1.0;

  const leafNConc = plant.leafN / plant.leafWt; // g N/g 干物质

  // 临界氮浓度范围
  const nleafhf = species.nleafhf; // 最大/最适氮浓度
  const nleaflf = species.nleaflf; // 最小/临界氮浓度

  let nstres: number;

  if (leafNConc >= nleafhf) {
    // 氮浓度充足，无胁迫
    nstres = 1.0;
  } else if (leafNConc <= nleaflf) {
    // 氮浓度严重不足，完全胁迫
    nstres = 0;
  } else {
    // 线性插值
    nstres = (leafNConc - nleaflf) / (nleafhf - nleaflf);
  }

  // 结合氮供应/需求比修正
  if (nDemand > 0) {
    const supplyRatio = Math.min(1, nSupply / nDemand);
    nstres = Math.min(nstres, supplyRatio);
  }

  return Math.max(0, Math.min(1, nstres));
}

/**
 * 计算温度胁迫因子 - 基于温度对光合作用和发育的影响
 * 使用三基点温度模型计算温度胁迫
 * @param tavg 日平均温度 (°C)
 * @param tbase 基础温度 (°C)
 * @param topt 最适温度 (°C)
 * @param tmax 上限温度 (°C)
 * @param stressType 胁迫类型: 'photosynthesis' 或 'development'
 * @returns 温度胁迫因子 (0-1, 1=无胁迫)
 */
export function calcTemperatureStress(
  tavg: number,
  tbase: number,
  topt: number,
  tmax: number,
  stressType: 'photosynthesis' | 'development' = 'photosynthesis'
): number {
  if (tavg <= tbase || tavg >= tmax) return 0;

  if (stressType === 'development') {
    // 发育温度胁迫 - 简单线性模型
    if (tavg <= topt) {
      return (tavg - tbase) / (topt - tbase);
    } else {
      return (tmax - tavg) / (tmax - topt);
    }
  }

  // 光合作用温度胁迫 - 使用更平缓的响应曲线
  // 在最适温度附近有一个较宽的无胁迫范围
  const optRange = 5; // 最适温度±5°C范围内无胁迫

  if (tavg >= topt - optRange && tavg <= topt + optRange) {
    return 1.0;
  }

  if (tavg < topt - optRange) {
    // 低温胁迫
    return Math.max(0, (tavg - tbase) / (topt - optRange - tbase));
  }

  // 高温胁迫
  return Math.max(0, (tmax - tavg) / (tmax - topt - optRange));
}

/**
 * 计算综合胁迫因子
 * 将水分、氮素和温度胁迫因子组合
 * 使用乘法模型: 总胁迫 = 水分胁迫 × 氮素胁迫 × 温度胁迫
 * @param wStress 水分胁迫因子 (0-1)
 * @param nStress 氮素胁迫因子 (0-1)
 * @param tStress 温度胁迫因子 (0-1)
 * @returns 综合胁迫因子 (0-1)
 */
export function calcCombinedStress(
  wStress: number,
  nStress: number,
  tStress: number
): number {
  // 乘法模型 - 任一胁迫都会影响总体
  return wStress * nStress * tStress;
}

/**
 * 计算胁迫对干物质分配的调整
 * 胁迫条件下，植物倾向于增加根系分配
 * @param basePartitioning 基础分配比例 {leaf, stem, root, fruit}
 * @param wStress 水分胁迫因子
 * @param nStress 氮素胁迫因子
 * @returns 调整后的分配比例
 */
export function adjustPartitioningForStress(
  basePartitioning: { leaf: number; stem: number; root: number; fruit: number },
  wStress: number,
  nStress: number
): { leaf: number; stem: number; root: number; fruit: number } {
  const minStress = Math.min(wStress, nStress);

  // 无胁迫时不调整
  if (minStress >= 0.9) return basePartitioning;

  // 胁迫越严重，根系分配比例越大
  const stressIntensity = 1 - minStress; // 0-1, 1为最严重胁迫
  const rootAdjust = stressIntensity * 0.15; // 最多增加15%根系分配

  const adjusted = { ...basePartitioning };
  adjusted.root += rootAdjust;

  // 从叶片和果实中扣除增加的根系分配
  adjusted.leaf -= rootAdjust * 0.4;
  adjusted.fruit -= rootAdjust * 0.4;
  adjusted.stem -= rootAdjust * 0.2;

  // 确保分配比例不为负
  adjusted.leaf = Math.max(0.05, adjusted.leaf);
  adjusted.stem = Math.max(0.02, adjusted.stem);
  adjusted.root = Math.max(0.10, adjusted.root);
  adjusted.fruit = Math.max(0, adjusted.fruit);

  // 重新归一化
  const total = adjusted.leaf + adjusted.stem + adjusted.root + adjusted.fruit;
  adjusted.leaf /= total;
  adjusted.stem /= total;
  adjusted.root /= total;
  adjusted.fruit /= total;

  return adjusted;
}
