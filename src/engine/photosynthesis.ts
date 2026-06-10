/**
 * DSSAT CROPGRO-Strawberry 光合作用与干物质生产模块
 * 基于CROPGRO模型的光合作用计算
 * 包含冠层光合、维持呼吸、生长呼吸和干物质分配
 */

import { SpeciesParams, EcotypeParams, CultivarParams, PlantState, GrowthStage } from './types';

/** 光合作用转换常数: mg CO₂ → g CH₂O (分子量比 30/44) */
const CO2_TO_CH2O = 30 / 44;
/** MJ/m² → J/m² 转换 */
const MJ_TO_J = 1e6;
/** 秒/天 */
const SEC_PER_DAY = 86400;
/** g → kg */
const G_TO_KG = 0.001;
/** m²/ha */
const M2_PER_HA = 10000;

/**
 * 计算冠层光合作用 - 基于CROPGRO模型
 * 使用大叶模型(big-leaf model)计算日冠层光合速率
 * 考虑光饱和曲线和LAI对光的衰减
 * @param srad 太阳辐射 (MJ/m²/d)
 * @param lai 叶面积指数 (m²/m²)
 * @param photosynmax 最大光合速率 (mg CO₂/m²/s)
 * @param quantumyield 初始光能利用效率 (mg CO₂/J PAR)
 * @param tavg 日平均温度 (°C)
 * @param topt 最适温度 (°C)
 * @param tmax 上限温度 (°C)
 * @param swfac 水分胁迫因子 (0-1)
 * @param nstres 氮素胁迫因子 (0-1)
 * @returns 日冠层总光合量 (kg CH₂O/ha/d)
 */
export function calcCanopyPhotosynthesis(
  srad: number,
  lai: number,
  photosynmax: number,
  quantumyield: number,
  tavg: number,
  topt: number,
  tmax: number,
  swfac: number,
  nstres: number
): number {
  if (lai <= 0) return 0;

  // 将太阳辐射转换为PAR (约50%的太阳辐射为PAR)
  const par = srad * 0.5; // MJ PAR/m²/d
  const parJ = par * MJ_TO_J; // J PAR/m²/d

  // 日照时数近似 (基于辐射与天文日长的比例)
  // 简化处理：假设等效日照时数为12小时
  const daylength = 12; // 小时
  const daylengthSec = daylength * 3600; // 秒

  // 计算冠层消光系数 - 基于LAI
  // 使用指数衰减模型 (Beer-Lambert定律)
  const k = 0.6; // 消光系数，典型值0.5-0.7

  // 截获的PAR比例
  const fpar = 1 - Math.exp(-k * lai);

  // 冠层截获的PAR (J/m²/d)
  const interceptedPAR = parJ * fpar;

  // 温度对光合作用的影响因子
  let tempFactor = 1.0;
  if (tavg <= 0) {
    tempFactor = 0;
  } else if (tavg < 15) {
    tempFactor = tavg / 15;
  } else if (tavg > topt) {
    tempFactor = Math.max(0, 1 - (tavg - topt) / (tmax - topt));
  }

  // 计算冠层光合速率 - 使用非直角双曲线模型
  // P = (α*I + Pmax - sqrt((α*I + Pmax)² - 4*θ*α*I*Pmax)) / (2*θ)
  // 其中 θ 为曲率参数
  const theta = 0.7; // 曲率参数
  const alpha = quantumyield; // mg CO₂/J PAR

  // 入射到冠层的平均光强 (J/m²/s)
  const I = interceptedPAR / daylengthSec;

  // 最大光合速率受胁迫因子调节
  const Pmax = photosynmax * tempFactor * Math.min(swfac, nstres);

  let Pleaf: number;
  if (Pmax <= 0 || I <= 0) {
    Pleaf = 0;
  } else {
    // 非直角双曲线计算瞬时光合速率 (mg CO₂/m²/s)
    const a = theta;
    const b = -(alpha * I + Pmax);
    const c = alpha * I * Pmax;
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
      // 退化为直角双曲线
      Pleaf = (alpha * I * Pmax) / (alpha * I + Pmax);
    } else {
      Pleaf = (-b - Math.sqrt(discriminant)) / (2 * a);
    }
  }

  Pleaf = Math.max(0, Pleaf);

  // 日冠层总光合量 (mg CO₂/m²/d → kg CH₂O/ha/d)
  const dailyPhotosynthesis = Pleaf * daylengthSec * CO2_TO_CH2O * G_TO_KG * M2_PER_HA;

  return dailyPhotosynthesis;
}

/**
 * 计算维持呼吸 - 基于CROPGRO模型
 * 维持呼吸与生物量和温度相关
 * Q10=2.0的温度响应
 * @param leafWt 叶片干重 (kg/ha)
 * @param stemWt 茎干重 (kg/ha)
 * @param rootWt 根干重 (kg/ha)
 * @param fruitWt 果实干重 (kg/ha)
 * @param rm25leaf 叶片维持呼吸系数 (g/g/h at 25°C)
 * @param rm25stem 茎维持呼吸系数
 * @param rm25root 根维持呼吸系数
 * @param rm25fruit 果实维持呼吸系数
 * @param tavg 日平均温度 (°C)
 * @returns 维持呼吸消耗 (kg CH₂O/ha/d)
 */
export function calcMaintenanceRespiration(
  leafWt: number,
  stemWt: number,
  rootWt: number,
  fruitWt: number,
  rm25leaf: number,
  rm25stem: number,
  rm25root: number,
  rm25fruit: number,
  tavg: number
): number {
  // Q10温度修正，Q10=2.0
  const q10 = 2.0;
  const tempFactor = Math.pow(q10, (tavg - 25) / 10);

  // 各器官维持呼吸 (g CH₂O/g 干物质/h → kg CH₂O/ha/d)
  const hoursPerDay = 24;
  const gToKg = 0.001;

  const leafResp = leafWt * rm25leaf * tempFactor * hoursPerDay;
  const stemResp = stemWt * rm25stem * tempFactor * hoursPerDay;
  const rootResp = rootWt * rm25root * tempFactor * hoursPerDay;
  const fruitResp = fruitWt * rm25fruit * tempFactor * hoursPerDay;

  // 根系呼吸增加土壤温度修正 (土壤温度通常低于气温)
  const soilTempFactor = Math.pow(q10, (tavg - 5 - 25) / 10);
  const rootRespAdj = rootWt * rm25root * soilTempFactor * hoursPerDay;

  return leafResp + stemResp + rootRespAdj + fruitResp;
}

/**
 * 计算生长呼吸 - 基于CROPGRO模型
 * 生长呼吸与合成新生物量所需的能量相关
 * @param dmbiomass 当日新增干物质 (kg/ha)
 * @param rg 生长呼吸系数 (g CH₂O/g 干物质)
 * @returns 生长呼吸消耗 (kg CH₂O/ha/d)
 */
export function calcGrowthRespiration(
  dmbiomass: number,
  rg: number
): number {
  // 生长呼吸 = 新增干物质 × (1/转换效率 - 1)
  // 转换效率 = 1 / (1 + rg)
  return dmbiomass * rg;
}

/**
 * 计算潜在干物质生产 - 基于CROPGRO模型
 * 总光合减去维持呼吸后可用于生长的碳水化合物
 * @param carbh2o 冠层总光合 (kg CH₂O/ha/d)
 * @param maintResp 维持呼吸 (kg CH₂O/ha/d)
 * @returns 可用于生长的碳水化合物 (kg CH₂O/ha/d)
 */
export function calcPotentialDryMatter(
  carbh2o: number,
  maintResp: number
): number {
  // 如果维持呼吸超过光合产物，则没有新的干物质生产
  // 剩余碳水化合物从储备中消耗
  return Math.max(0, carbh2o - maintResp);
}

/**
 * 计算干物质分配 - 基于CROPGRO模型的分配系数
 * 根据生长阶段和光热年龄分配干物质到各器官
 * @param availCH2O 可用碳水化合物 (kg CH₂O/ha/d)
 * @param stage 当前生长阶段
 * @param species 物种参数
 * @param ecotype 生态型参数
 * @param cultivar 品种参数
 * @param plant 植物状态
 * @returns 各器官新增干物质 {leaf, stem, root, fruit} (kg/ha/d)
 */
export function calcPartitioning(
  availCH2O: number,
  stage: GrowthStage,
  species: SpeciesParams,
  ecotype: EcotypeParams,
  cultivar: CultivarParams,
  plant: PlantState
): { leaf: number; stem: number; root: number; fruit: number } {
  if (availCH2O <= 0) {
    return { leaf: 0, stem: 0, root: 0, fruit: 0 };
  }

  // 基础分配系数 - 来自生态型参数
  let fLeaf = ecotype.partleaf;
  let fStem = ecotype.partstem;
  let fRoot = ecotype.partroot;
  let fFruit = ecotype.partfruit;

  // 根据生长阶段调整分配系数
  switch (stage) {
    case GrowthStage.Vegetative:
      // 营养生长期：主要分配给叶片和茎
      fLeaf = 0.45;
      fStem = 0.30;
      fRoot = 0.25;
      fFruit = 0;
      break;

    case GrowthStage.Flowering:
      // 开花期：开始向果实分配，但仍以营养生长为主
      fLeaf = 0.30;
      fStem = 0.25;
      fRoot = 0.20;
      fFruit = 0.25;
      break;

    case GrowthStage.Fruiting:
    case GrowthStage.Maturity:
    case GrowthStage.Harvest:
      // 结果期和收获期：果实分配占主导
      // 随光热年龄增加，果实分配比例增大
      const ageFactor = Math.min(1, plant.photoThermalAge / 1500);
      fFruit = 0.35 + 0.20 * ageFactor;
      fLeaf = 0.20 - 0.10 * ageFactor;
      fStem = 0.15 - 0.05 * ageFactor;
      fRoot = 0.30 - 0.05 * ageFactor;
      break;

    default:
      // 其他阶段不分配
      return { leaf: 0, stem: 0, root: 0, fruit: 0 };
  }

  // 归一化分配系数
  const total = fLeaf + fStem + fRoot + fFruit;
  if (total <= 0) return { leaf: 0, stem: 0, root: 0, fruit: 0 };

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
 * 计算叶片面积指数变化
 * 基于新增叶片干物质和比叶面积
 * @param currentLAI 当前LAI (m²/m²)
 * @param newLeafWt 新增叶片干重 (kg/ha)
 * @param senescedLeaf 衰老叶片干重 (kg/ha)
 * @param sla 比叶面积 (cm²/g)
 * @param laimax 最大叶面积指数
 * @returns 新的LAI (m²/m²)
 */
export function updateLAI(
  currentLAI: number,
  newLeafWt: number,
  senescedLeaf: number,
  sla: number,
  laimax: number
): number {
  // 比叶面积转换: cm²/g → m²/kg
  const slaM2 = sla * 0.1; // cm²/g × (m/100cm)² × (1000g/kg) × (10000m²/ha) = 0.1 m²/kg/ha

  // 新增叶面积
  const newLAI = newLeafWt * slaM2 / M2_PER_HA * M2_PER_HA; // 简化: newLeafWt(kg/ha) * sla(m²/kg) / 10000(ha/m²) * 10000

  // 衰老减少的叶面积
  const senLAI = senescedLeaf * slaM2 / M2_PER_HA * M2_PER_HA;

  // 更新LAI
  let lai = currentLAI + newLAI - senLAI;

  // 限制LAI范围
  lai = Math.max(0, Math.min(laimax, lai));

  return lai;
}

/**
 * 计算叶片衰老量 - 基于CROPGRO模型
 * @param plant 植物状态
 * @param species 物种参数
 * @param gdd 当日GDD (°C·d)
 * @returns 衰老叶片干重 (kg/ha/d)
 */
export function calcLeafSenescence(
  plant: PlantState,
  species: SpeciesParams,
  gdd: number
): number {
  // 只有在超过衰老开始GDD后才计算衰老
  if (plant.gdd < species.senstart) return 0;

  // 衰老速率与GDD和当前叶量成正比
  const senescence = plant.leafWt * species.senrate * gdd / 100;

  return Math.min(senescence, plant.leafWt * 0.05); // 每日最大衰老5%
}
