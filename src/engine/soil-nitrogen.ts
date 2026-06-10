/**
 * DSSAT CROPGRO-Strawberry 土壤氮素平衡模块
 * 基于CROPGRO模型的简化土壤氮素平衡计算
 * 包含矿化、硝化、反硝化、植物氮吸收和氮胁迫计算
 */

import { SoilProfile, SoilState, PlantState, SpeciesParams, GrowthStage } from './types';

/** 矿化速率常数 (d⁻¹) */
const MINERALIZATION_RATE = 0.003;
/** 硝化速率常数 (d⁻¹) */
const NITRIFICATION_RATE = 0.005;
/** 反硝化速率常数 (d⁻¹) */
const DENITRIFICATION_RATE = 0.002;
/** 氮素淋洗系数 */
const LEACHING_COEFF = 0.5;

/**
 * 计算土壤矿化 - 有机氮转化为无机氮
 * 基于温度、水分和土壤有机质含量的简化模型
 * @param sloc 土壤有机碳含量 (%)
 * @param slbdm 容重 (g/cm³)
 * @param sldm 层厚度 (cm)
 * @param sw 当前体积含水量 (cm³/cm³)
 * @param slll 下限含水量 (cm³/cm³)
 * @param sldul 排水上限含水量 (cm³/cm³)
 * @param tavg 日平均温度 (°C)
 * @param slnf 土壤氮素矿化因子 (0-1)
 * @param slph 土壤pH值
 * @returns 矿化速率 (kg N/ha/d)，正值表示矿化释放
 */
export function calcMineralization(
  sloc: number,
  slbdm: number,
  sldm: number,
  sw: number,
  slll: number,
  sldul: number,
  tavg: number,
  slnf: number,
  slph: number
): number {
  // 土壤有机氮含量估算 (基于C/N比 ≈ 10)
  const cToN = 10;
  const organicN = sloc / cToN; // % N

  // 每公顷该层土壤质量 (kg/ha)
  const layerMass = slbdm * sldm * 1e5; // g/cm³ × cm × 1e5 cm²/ha → kg/ha (近似)

  // 有机氮总量 (kg N/ha)
  const totalOrganicN = organicN * layerMass / 100;

  // 温度因子 - 基于van't Hoff方程
  let tempFactor = 0;
  if (tavg > 0) {
    tempFactor = Math.pow(2, (tavg - 35) / 10);
    tempFactor = Math.min(1, Math.max(0, tempFactor));
  }

  // 水分因子 - 基于充气孔隙度
  let waterFactor = 0;
  if (sw > slll) {
    const wfps = sw / sldul; // 充水孔隙比例
    if (wfps < 0.3) {
      waterFactor = wfps / 0.3;
    } else if (wfps > 1.0) {
      waterFactor = Math.max(0, 1 - (wfps - 1.0) * 2);
    } else {
      waterFactor = 1.0;
    }
  }

  // pH因子
  let phFactor = 1.0;
  if (slph < 5.0) {
    phFactor = slph / 5.0;
  } else if (slph > 8.0) {
    phFactor = Math.max(0, 1 - (slph - 8.0) / 2);
  }

  // 矿化速率 = 基础速率 × 温度因子 × 水分因子 × pH因子 × 土壤因子
  const mineralization = totalOrganicN * MINERALIZATION_RATE * tempFactor * waterFactor * phFactor * slnf;

  return Math.max(0, mineralization);
}

/**
 * 计算硝化作用 - 铵态氮转化为硝态氮
 * @param nh4 铵态氮含量 (kg N/ha)
 * @param sw 当前体积含水量 (cm³/cm³)
 * @param slll 下限含水量 (cm³/cm³)
 * @param sldul 排水上限含水量 (cm³/cm³)
 * @param slsat 饱和含水量 (cm³/cm³)
 * @param tavg 日平均温度 (°C)
 * @param slph 土壤pH值
 * @returns 硝化速率 (kg N/ha/d)，正值表示NH4→NO3转化
 */
export function calcNitrification(
  nh4: number,
  sw: number,
  slll: number,
  sldul: number,
  slsat: number,
  tavg: number,
  slph: number
): number {
  if (nh4 <= 0) return 0;

  // 温度因子
  let tempFactor = 0;
  if (tavg > 5) {
    tempFactor = Math.min(1, (tavg - 5) / 20);
  }

  // 水分因子 - 硝化需要好氧条件
  let waterFactor = 0;
  const wfps = sw / slsat; // 充水孔隙比例
  if (wfps > 0.1 && wfps < 0.8) {
    waterFactor = 1 - Math.abs(wfps - 0.5) / 0.5;
  } else if (wfps >= 0.8) {
    waterFactor = Math.max(0, 1 - (wfps - 0.8) * 5);
  }

  // pH因子 - 硝化最适pH 7-8
  let phFactor = 1.0;
  if (slph < 6.0) {
    phFactor = slph / 6.0;
  }

  // 硝化速率
  const nitrification = nh4 * NITRIFICATION_RATE * tempFactor * waterFactor * phFactor;

  return Math.max(0, Math.min(nitrification, nh4 * 0.5)); // 最多硝化50%的NH4
}

/**
 * 计算反硝化作用 - 硝态氮在厌氧条件下还原为气态氮
 * @param no3 硝态氮含量 (kg N/ha)
 * @param sw 当前体积含水量 (cm³/cm³)
 * @param sldul 排水上限含水量 (cm³/cm³)
 * @param slsat 饱和含水量 (cm³/cm³)
 * @param sloc 有机碳含量 (%)
 * @param tavg 日平均温度 (°C)
 * @returns 反硝化速率 (kg N/ha/d)，正值表示NO3损失
 */
export function calcDenitrification(
  no3: number,
  sw: number,
  sldul: number,
  slsat: number,
  sloc: number,
  tavg: number
): number {
  if (no3 <= 0) return 0;

  // 反硝化需要厌氧条件 (含水量接近或超过田间持水量)
  const wfps = sw / slsat;
  let waterFactor = 0;
  if (wfps > 0.8) {
    waterFactor = Math.pow((wfps - 0.8) / 0.2, 2);
  }

  // 温度因子
  let tempFactor = 0;
  if (tavg > 5) {
    tempFactor = Math.min(1, (tavg - 5) / 15);
  }

  // 碳源因子
  const carbonFactor = Math.min(1, sloc / 2);

  // 反硝化速率
  const denitrification = no3 * DENITRIFICATION_RATE * waterFactor * tempFactor * carbonFactor;

  return Math.max(0, Math.min(denitrification, no3 * 0.3)); // 最多损失30%的NO3
}

/**
 * 计算植物氮吸收 - 基于CROPGRO模型
 * 氮吸收取决于植物氮需求和土壤氮供应
 * @param plant 植物状态
 * @param soilState 土壤状态
 * @param soil 土壤剖面参数
 * @param species 物种参数
 * @param rootDepth 根系深度 (cm)
 * @returns 氮吸收量 (kg N/ha/d) 和各层吸收量
 */
export function calcNitrogenUptake(
  plant: PlantState,
  soilState: SoilState,
  soil: SoilProfile,
  species: SpeciesParams,
  rootDepth: number
): { totalUptake: number; layerUptake: number[] } {
  // 计算植物氮需求 - 基于各器官的临界氮浓度
  const leafNDemand = plant.leafWt * species.nleafhf - plant.leafN;
  const stemNDemand = plant.stemWt * species.nstem - plant.stemN;
  const rootNDemand = plant.rootWt * species.nroot - plant.rootN;
  const fruitNDemand = plant.fruitWt * species.nfruit - plant.fruitN;

  // 总氮需求 (kg N/ha/d)，限制为正值
  const totalDemand = Math.max(0, leafNDemand + stemNDemand + rootNDemand + fruitNDemand);

  if (totalDemand <= 0) {
    return { totalUptake: 0, layerUptake: new Array(soil.layers.length).fill(0) };
  }

  // 计算各层氮供应
  const layerUptake: number[] = [];
  let totalSupply = 0;

  let cumDepth = 0;
  for (let i = 0; i < soil.layers.length; i++) {
    const layer = soil.layers[i];
    cumDepth += layer.sldm;

    // 根系在该层的比例
    const layerTop = cumDepth - layer.sldm;
    const layerBottom = cumDepth;
    let rootFraction = 0;

    if (layerTop < rootDepth) {
      const rootInLayer = Math.min(layerBottom, rootDepth) - layerTop;
      rootFraction = (rootInLayer / layer.sldm) * layer.slrgf;
    }

    if (rootFraction <= 0) {
      layerUptake.push(0);
      continue;
    }

    // 可利用氮 = NO3 + NH4 (kg N/ha)
    const availableN = soilState.no3[i] + soilState.nh4[i];

    // 氮供应受根系分布和水分影响
    const sw = soilState.swContent[i];
    const waterFactor = Math.max(0.1, (sw - layer.slll) / (layer.sldul - layer.slll));

    // 供应速率 = 可利用氮 × 根系比例 × 水分因子 × 吸收系数
    const supply = availableN * rootFraction * waterFactor * 0.05; // 5%日吸收率

    layerUptake.push(Math.max(0, supply));
    totalSupply += supply;
  }

  // 实际吸收量 = min(需求, 供应)
  const totalUptake = Math.min(totalDemand, totalSupply);

  // 按比例分配到各层
  if (totalSupply > 0) {
    const ratio = totalUptake / totalSupply;
    for (let i = 0; i < layerUptake.length; i++) {
      layerUptake[i] *= ratio;
    }
  }

  return { totalUptake, layerUptake };
}

/**
 * 计算氮胁迫因子 - 基于CROPGRO模型
 * 氮胁迫由植物实际氮浓度与临界氮浓度的比值决定
 * @param plant 植物状态
 * @param species 物种参数
 * @param nSupply 氮供应 (kg N/ha/d)
 * @param nDemand 氮需求 (kg N/ha/d)
 * @returns 氮胁迫因子 (0-1, 1=无胁迫)
 */
export function calcNitrogenStressFactor(
  plant: PlantState,
  species: SpeciesParams,
  nSupply: number,
  nDemand: number
): number {
  if (nDemand <= 0) return 1.0;

  // 氮供应/需求比
  const nRatio = nSupply / nDemand;

  // 基于叶片氮浓度的胁迫计算
  const leafNConc = plant.leafWt > 0 ? plant.leafN / plant.leafWt : 0;
  const criticalN = (species.nleaflf + species.nleafhf) / 2;

  // 综合氮胁迫因子
  let nstres: number;
  if (leafNConc >= species.nleafhf) {
    nstres = 1.0;
  } else if (leafNConc <= species.nleaflf) {
    nstres = 0.0;
  } else {
    // 线性插值
    nstres = (leafNConc - species.nleaflf) / (species.nleafhf - species.nleaflf);
  }

  // 结合供应/需求比
  nstres = Math.min(nstres, nRatio);

  return Math.max(0, Math.min(1, nstres));
}

/**
 * 更新土壤氮素状态
 * @param soilState 土壤状态
 * @param soil 土壤剖面参数
 * @param tavg 日平均温度 (°C)
 * @param drainage 排水量 (mm)
 * @param nUptake 各层氮吸收量 (kg N/ha/d)
 * @param fertAmount 肥料施用量 (kg N/ha)
 * @returns 更新后的NO3和NH4数组
 */
export function updateSoilNitrogen(
  soilState: SoilState,
  soil: SoilProfile,
  tavg: number,
  drainage: number,
  nUptake: number[],
  fertAmount: number
): { no3: number[]; nh4: number[]; mineralization: number[] } {
  const newNO3 = [...soilState.no3];
  const newNH4 = [...soilState.nh4];
  const mineralization: number[] = [];

  for (let i = 0; i < soil.layers.length; i++) {
    const layer = soil.layers[i];

    // 1. 矿化作用 - 有机氮 → NH4
    const minRate = calcMineralization(
      layer.sloc, layer.slbdm, layer.sldm,
      soilState.swContent[i], layer.slll, layer.sldul,
      tavg, soil.slnf, layer.slph
    );
    mineralization.push(minRate);
    newNH4[i] += minRate;

    // 2. 硝化作用 - NH4 → NO3
    const nitRate = calcNitrification(
      newNH4[i], soilState.swContent[i],
      layer.slll, layer.sldul, layer.slsat,
      tavg, layer.slph
    );
    newNH4[i] -= nitRate;
    newNO3[i] += nitRate;

    // 3. 反硝化作用 - NO3 → N2/N2O (损失)
    const denitRate = calcDenitrification(
      newNO3[i], soilState.swContent[i],
      layer.sldul, layer.slsat,
      layer.sloc, tavg
    );
    newNO3[i] -= denitRate;

    // 4. 植物吸收
    newNO3[i] -= nUptake[i] * 0.8; // 80%从NO3吸收
    newNH4[i] -= nUptake[i] * 0.2; // 20%从NH4吸收

    // 5. 氮素淋洗 - NO3随排水移动
    if (i === 0 && drainage > 0) {
      const leachNO3 = newNO3[i] * LEACHING_COEFF * drainage / 100;
      newNO3[i] -= leachNO3;
      // 淋洗的NO3移到下一层（简化处理为损失）
    }

    // 6. 肥料施用 (仅表层)
    if (i === 0 && fertAmount > 0) {
      // 假设50%为铵态氮，50%为硝态氮
      newNH4[i] += fertAmount * 0.5;
      newNO3[i] += fertAmount * 0.5;
    }

    // 确保氮含量不为负
    newNO3[i] = Math.max(0, newNO3[i]);
    newNH4[i] = Math.max(0, newNH4[i]);
  }

  return { no3: newNO3, nh4: newNH4, mineralization };
}

/**
 * 计算植物氮需求
 * @param plant 植物状态
 * @param species 物种参数
 * @param newLeafDm 新增叶片干物质 (kg/ha)
 * @param newStemDm 新增茎干物质 (kg/ha)
 * @param newRootDm 新增根干物质 (kg/ha)
 * @param newFruitDm 新增果实干物质 (kg/ha)
 * @returns 氮需求量 (kg N/ha/d)
 */
export function calcNitrogenDemand(
  plant: PlantState,
  species: SpeciesParams,
  newLeafDm: number,
  newStemDm: number,
  newRootDm: number,
  newFruitDm: number
): number {
  // 新增组织的氮需求
  const leafNDemand = newLeafDm * species.nleafhf;
  const stemNDemand = newStemDm * species.nstem;
  const rootNDemand = newRootDm * species.nroot;
  const fruitNDemand = newFruitDm * species.nfruit;

  // 现有组织的氮亏缺 (如果低于临界浓度)
  const leafDeficit = Math.max(0, plant.leafWt * species.nleafhf - plant.leafN) * 0.05; // 每日补充5%
  const stemDeficit = Math.max(0, plant.stemWt * species.nstem - plant.stemN) * 0.05;
  const rootDeficit = Math.max(0, plant.rootWt * species.nroot - plant.rootN) * 0.05;

  return leafNDemand + stemNDemand + rootNDemand + fruitNDemand +
         leafDeficit + stemDeficit + rootDeficit;
}
