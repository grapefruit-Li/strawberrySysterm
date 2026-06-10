/**
 * DSSAT CROPGRO-Strawberry 草莓专用模块
 * 基于CROPGRO-Strawberry模型 (Hopf et al. 2022)
 * 包含草莓连续开花和结果特性、同化物分配、多次收获和鲜果重计算
 */

import {
  PlantState,
  SpeciesParams,
  CultivarParams,
  EcotypeParams,
  GrowthStage,
  HarvestRecord,
} from './types';

/**
 * 计算连续开花和果实着生
 * 草莓为连续开花作物，在适宜条件下可不断产生新的花序
 * 基于CROPGRO-Strawberry的光热年龄驱动模型
 * @param plant 植物状态
 * @param species 物种参数
 * @param cultivar 品种参数
 * @param gdd 当日有效GDD (°C·d)
 * @param daylength 日照时长 (h)
 * @param tavg 日平均温度 (°C)
 * @returns 更新后的活跃花序数和果实数
 */
export function calcContinuousFlowering(
  plant: PlantState,
  species: SpeciesParams,
  cultivar: CultivarParams,
  gdd: number,
  daylength: number,
  tavg: number
): { activeTrusses: number; fruitNum: number; flrGddCounter: number } {
  // 只有在开花期及之后才产生新花序
  if (plant.stage < GrowthStage.Flowering) {
    return {
      activeTrusses: plant.activeTrusses,
      fruitNum: plant.fruitNum,
      flrGddCounter: plant.flrGddCounter,
    };
  }

  let flrGddCounter = plant.flrGddCounter + gdd;
  let activeTrusses = plant.activeTrusses;
  let fruitNum = plant.fruitNum;

  // 花序间隔GDD - 品种参数优先
  const flrInterval = cultivar.flrinterval || species.flrinterval;

  // 当累积GDD超过花序间隔时，产生新花序
  if (flrGddCounter >= flrInterval) {
    // 温度对开花的影响 - 草莓最适开花温度15-25°C
    let tempFactor = 1.0;
    if (tavg < 10) {
      tempFactor = tavg / 10;
    } else if (tavg > 30) {
      tempFactor = Math.max(0, 1 - (tavg - 30) / 10);
    }

    // 光周期对开花的影响 - 草莓为短日照/日中性品种
    // 日中性品种对光周期不敏感，短日照品种在长日照下开花减少
    let photoFactor = 1.0;
    if (daylength > 16) {
      photoFactor = Math.max(0.3, 1 - (daylength - 16) * 0.1);
    }

    // 新花序产生概率
    const newTrussProb = tempFactor * photoFactor;

    if (newTrussProb > 0.3) {
      // 产生新花序
      activeTrusses += 1;
      // 每个花序可着生多个果实
      const maxFruits = cultivar.maxfruitpertruss || species.maxfruitpertruss;
      const newFruits = Math.round(maxFruits * newTrussProb);
      fruitNum += newFruits;
    }

    // 重置计数器
    flrGddCounter = flrGddCounter - flrInterval;
  }

  // 限制最大活跃花序数 (避免过多花序导致营养竞争)
  const maxTrusses = 15;
  activeTrusses = Math.min(activeTrusses, maxTrusses);

  return { activeTrusses, fruitNum, flrGddCounter };
}

/**
 * 计算同化物分配 - 基于光热年龄的动态分配
 * 草莓的分配模式随光热年龄变化
 * 幼年期主要分配给营养器官，成熟期更多分配给果实
 * 基于Hopf et al. (2022)的分配模型
 * @param plant 植物状态
 * @param species 物种参数
 * @param ecotype 生态型参数
 * @param cultivar 品种参数
 * @param availCH2O 可用碳水化合物 (kg CH₂O/ha/d)
 * @returns 各器官分配量 {leaf, stem, root, fruit} (kg/ha/d)
 */
export function calcStrawberryPartitioning(
  plant: PlantState,
  species: SpeciesParams,
  ecotype: EcotypeParams,
  cultivar: CultivarParams,
  availCH2O: number
): { leaf: number; stem: number; root: number; fruit: number } {
  if (availCH2O <= 0) {
    return { leaf: 0, stem: 0, root: 0, fruit: 0 };
  }

  // 光热年龄因子 (0-1)，控制从营养生长向生殖生长的转换
  const pta = plant.photoThermalAge;
  const ptaMax = 2000; // 光热年龄参考值 (°C·d)
  const ageFactor = Math.min(1, pta / ptaMax);

  // 基础分配系数 - 随光热年龄变化
  let fLeaf: number, fStem: number, fRoot: number, fFruit: number;

  if (plant.stage === GrowthStage.Vegetative) {
    // 营养生长期 - 主要分配给叶片和根系
    fLeaf = 0.50 - 0.10 * ageFactor;
    fStem = 0.20;
    fRoot = 0.30 + 0.10 * ageFactor;
    fFruit = 0;
  } else if (plant.stage === GrowthStage.Flowering) {
    // 开花期 - 开始向果实分配
    fLeaf = 0.30 - 0.10 * ageFactor;
    fStem = 0.15;
    fRoot = 0.25;
    fFruit = 0.30 + 0.10 * ageFactor;
  } else {
    // 结果期/收获期 - 果实分配占主导
    // 草莓连续结果，果实库强随活跃花序数增加
    const trussFactor = Math.min(1, plant.activeTrusses / 10);
    fFruit = 0.35 + 0.25 * trussFactor;
    fLeaf = 0.20 - 0.10 * ageFactor;
    fStem = 0.10;
    fRoot = 1 - fFruit - fLeaf - fStem;
    fRoot = Math.max(0.10, fRoot); // 根系最低保留10%
  }

  // 水分和氮胁迫调整分配
  // 胁迫下增加根系分配比例
  const stressFactor = Math.min(plant.wStress, plant.nStress);
  if (stressFactor < 0.7) {
    const rootAdjust = (0.7 - stressFactor) * 0.2;
    fRoot += rootAdjust;
    fLeaf -= rootAdjust * 0.5;
    fFruit -= rootAdjust * 0.5;
  }

  // 归一化
  const total = fLeaf + fStem + fRoot + fFruit;
  fLeaf /= total;
  fStem /= total;
  fRoot /= total;
  fFruit /= total;

  // 计算各器官新增干物质 (考虑转换效率)
  const dLeaf = availCH2O * fLeaf * species.glf;
  const dStem = availCH2O * fStem * species.gst;
  const dRoot = availCH2O * fRoot * species.grt;
  const dFruit = availCH2O * fFruit * species.gfr;

  return { leaf: dLeaf, stem: dStem, root: dRoot, fruit: dFruit };
}

/**
 * 处理多次收获
 * 草莓为连续收获作物，在收获期内可多次采摘
 * 基于果实成熟度和收获阈值判断
 * @param plant 植物状态
 * @param species 物种参数
 * @param cultivar 品种参数
 * @param isHarvestDay 是否为计划收获日
 * @returns 收获记录 (如有收获)
 */
export function handleMultipleHarvests(
  plant: PlantState,
  species: SpeciesParams,
  cultivar: CultivarParams,
  isHarvestDay: boolean
): HarvestRecord | null {
  // 只有在收获期且有果实时才收获
  if (plant.stage < GrowthStage.Harvest || plant.fruitWt <= 0) {
    return null;
  }

  if (!isHarvestDay) return null;

  // 计算可收获果实比例
  // 基于果实发育阶段，成熟果实占比随GDD增加
  const maturityRatio = Math.min(0.8, 0.3 + plant.gdd / 3000);

  // 收获量
  const harvestDryWt = plant.fruitWt * maturityRatio;
  const fruitdm = cultivar.fruitdm || species.fruitdm;
  const harvestFreshWt = harvestDryWt / fruitdm;

  // 收获果实数 (基于单果重)
  const avgFruitDryWt = plant.fruitNum > 0 ? harvestDryWt / plant.fruitNum : 0;
  const harvestFruitNum = Math.round(plant.fruitNum * maturityRatio);

  if (harvestFruitNum <= 0 || harvestDryWt <= 0) {
    return null;
  }

  // 生成收获记录 (品质指标将在quality模块中计算)
  const record: HarvestRecord = {
    date: 0, // 将在runner中设置实际日期
    freshWt: harvestFreshWt,
    dryWt: harvestDryWt,
    fruitNum: harvestFruitNum,
    ssc: species.sscbase,
    acidity: species.acidbase,
    firmness: species.firmbase,
  };

  return record;
}

/**
 * 从干重计算鲜果重
 * @param dryWt 果实干重 (kg/ha)
 * @param fruitdm 果实干物质含量 (g干重/g鲜重)
 * @returns 果实鲜重 (kg/ha)
 */
export function calcFreshFruitWeight(
  dryWt: number,
  fruitdm: number
): number {
  if (fruitdm <= 0) return 0;
  return dryWt / fruitdm;
}

/**
 * 计算单果鲜重
 * @param totalFreshWt 总鲜重 (kg/ha)
 * @param fruitNum 果实数量
 * @returns 单果鲜重 (g)
 */
export function calcIndividualFruitWeight(
  totalFreshWt: number,
  fruitNum: number
): number {
  if (fruitNum <= 0) return 0;
  // kg/ha → g/fruit
  return (totalFreshWt * 1000) / (fruitNum * 1); // 假设1ha对应种植密度已在fruitNum中体现
}

/**
 * 更新草莓植物状态 - 收获后的状态调整
 * @param plant 植物状态
 * @param harvest 收获记录
 * @returns 更新后的植物状态字段
 */
export function updatePlantAfterHarvest(
  plant: PlantState,
  harvest: HarvestRecord
): Partial<PlantState> {
  return {
    fruitWt: Math.max(0, plant.fruitWt - harvest.dryWt),
    fruitN: Math.max(0, plant.fruitN - harvest.dryWt * 0.01), // 果实含氮量近似
    fruitNum: Math.max(0, plant.fruitNum - harvest.fruitNum),
    harvestedFreshWt: plant.harvestedFreshWt + harvest.freshWt,
    harvestedDryWt: plant.harvestedDryWt + harvest.dryWt,
  };
}

/**
 * 计算草莓光热年龄增量
 * 光热年龄综合了温度和光周期对发育的影响
 * @param gdd 当日GDD (°C·d)
 * @param daylength 日照时长 (h)
 * @param tavg 日平均温度 (°C)
 * @returns 光热年龄增量 (°C·d)
 */
export function calcPhotoThermalAgeIncrement(
  gdd: number,
  daylength: number,
  tavg: number
): number {
  // 光热年龄 = GDD × 温度修正 × 光周期修正
  // 温度修正：最适温度附近增长最快
  let tempFactor = 1.0;
  if (tavg < 10) {
    tempFactor = tavg / 10;
  } else if (tavg > 30) {
    tempFactor = Math.max(0.5, 1 - (tavg - 30) / 20);
  }

  // 光周期修正：长日照加速发育
  const photoFactor = Math.min(1.5, daylength / 12);

  return gdd * tempFactor * photoFactor;
}

/**
 * 计算草莓根系生长
 * 草莓为浅根系作物，根系深度通常不超过30-40cm
 * @param currentDepth 当前根系深度 (cm)
 * @param gdd 当日GDD (°C·d)
 * @param maxDepth 最大根系深度 (cm)
 * @param rgrw 根系生长速率 (cm/°C·d)
 * @param swfac 水分胁迫因子
 * @param stage 生长阶段
 * @returns 新的根系深度 (cm)
 */
export function calcStrawberryRootGrowth(
  currentDepth: number,
  gdd: number,
  maxDepth: number,
  rgrw: number,
  swfac: number,
  stage: GrowthStage
): number {
  // 萌芽前不生长根系
  if (stage < GrowthStage.Germinating) return currentDepth;

  // 根系生长速率受GDD和胁迫因子影响
  const growthRate = rgrw * gdd * swfac;

  // 根系深度随时间趋近最大值 (渐近曲线)
  const depthIncrement = growthRate * (1 - currentDepth / maxDepth);

  const newDepth = currentDepth + depthIncrement;

  return Math.min(maxDepth, Math.max(0, newDepth));
}
