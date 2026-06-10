/**
 * DSSAT CROPGRO-Strawberry 物候发育模块
 * 基于CROPGRO模型的物候发育计算
 * 包含生长度日(GDD)计算、发育速率计算和阶段转换逻辑
 */

import { GrowthStage, SpeciesParams, CultivarParams, EcotypeParams, PlantState } from './types';

/**
 * 计算生长度日(GDD) - 基于CROPGRO模型的三基点温度方法
 * 使用正弦波近似法计算每日热时间
 * @param tmin 日最低气温 (°C)
 * @param tmax 日最高气温 (°C)
 * @param tbase 基础温度 (°C) - 发育下限温度
 * @param topt 最适温度 (°C) - 发育最适温度
 * @param tmaxdev 发育上限温度 (°C) - 发育上限温度
 * @returns 每日热时间 (°C·d)
 */
export function calcGDD(
  tmin: number,
  tmax: number,
  tbase: number,
  topt: number,
  tmaxdev: number
): number {
  // 边界情况处理
  if (tmax <= tbase) return 0;
  if (tmin >= tmaxdev) return 0;

  // 限制温度范围
  const tminc = Math.max(tmin, tbase);
  const tmaxc = Math.min(tmax, tmaxdev);

  // 日平均温度
  const tavg = (tminc + tmaxc) / 2;

  let gdd: number;

  if (tavg <= topt) {
    // 温度在基础温度和最适温度之间，线性累积
    gdd = Math.max(0, tavg - tbase);
  } else {
    // 温度超过最适温度，使用CROPGRO的非线性衰减
    // 基于正弦曲线近似，在topt到tmaxdev之间线性递减
    const frac = (tmaxdev - tavg) / (tmaxdev - topt);
    gdd = Math.max(0, (topt - tbase) * frac);
  }

  return gdd;
}

/**
 * 计算光周期因子 - 基于CROPGRO模型
 * 短日照作物在光周期超过临界值时发育速率降低
 * @param daylength 日照时长 (h)
 * @param cphot 临界光周期 (h)
 * @param ppfpe 光周期敏感性系数 (h⁻¹)
 * @returns 光周期因子 (0-1)，1表示无光周期限制
 */
export function calcPhotoperiodFactor(
  daylength: number,
  cphot: number,
  ppfpe: number
): number {
  if (daylength <= cphot) return 1.0;
  // 当日照时数超过临界值时，发育速率按比例降低
  const ppf = 1.0 - ppfpe * (daylength - cphot);
  return Math.max(0, Math.min(1, ppf));
}

/**
 * 计算日照时长 - 基于纬度和日序
 * 使用天文公式计算日出日落时间
 * @param lat 纬度 (度)
 * @param dayOfYear 年内日序 (1-365)
 * @returns 日照时长 (h)
 */
export function calcDayLength(lat: number, dayOfYear: number): number {
  const latRad = (lat * Math.PI) / 180;
  // 太阳赤纬角
  const decAngle = -23.45 * Math.cos((2 * Math.PI * (dayOfYear + 10)) / 365);
  const decRad = (decAngle * Math.PI) / 180;

  // 日出时角
  const cosHA = -Math.tan(latRad) * Math.tan(decRad);

  // 极昼极夜处理
  if (cosHA <= -1) return 24; // 极昼
  if (cosHA >= 1) return 0;   // 极夜

  const ha = Math.acos(cosHA);
  // 日照时长 = 2 * 时角 / 15 (度转小时) + 大气折射修正
  const daylength = (2 * ha * 12) / Math.PI + 0.5; // 0.5h为晨昏蒙影修正

  return Math.max(0, Math.min(24, daylength));
}

/**
 * 计算发育速率 - 综合温度和光周期效应
 * @param gdd 当日生长度日 (°C·d)
 * @param daylength 日照时长 (h)
 * @param cphot 临界光周期 (h)
 * @param ppfpe 光周期敏感性系数
 * @returns 有效发育速率 (°C·d)
 */
export function calcDevelopmentRate(
  gdd: number,
  daylength: number,
  cphot: number,
  ppfpe: number
): number {
  const ppf = calcPhotoperiodFactor(daylength, cphot, ppfpe);
  return gdd * ppf;
}

/**
 * 判断生长阶段转换 - 基于累积GDD
 * CROPGRO模型使用GDD累积来确定阶段转换
 * @param plant 当前植物状态
 * @param species 物种参数
 * @param cultivar 品种参数
 * @param ecotype 生态型参数
 * @param todayGDD 当日有效GDD (°C·d)
 * @returns 更新后的生长阶段
 */
export function determineStageTransition(
  plant: PlantState,
  species: SpeciesParams,
  cultivar: CultivarParams,
  ecotype: EcotypeParams,
  todayGDD: number
): GrowthStage {
  const newGDD = plant.gdd + todayGDD;
  let newStage = plant.stage;

  // 使用品种参数覆盖物种参数中的阶段阈值
  const p1Threshold = cultivar.p1v || species.p1;
  const p2Threshold = p1Threshold + (cultivar.p1r || species.p2);
  const p3Threshold = p2Threshold + (cultivar.p3 || species.p3);
  const p4Threshold = p3Threshold + (cultivar.p4 || species.p4);

  switch (plant.stage) {
    case GrowthStage.PrePlanting:
      // 播种后立即进入萌芽期
      newStage = GrowthStage.Germinating;
      break;

    case GrowthStage.Germinating:
      // 萌芽完成，累积GDD超过萌芽需求
      if (newGDD >= species.pgerm) {
        newStage = GrowthStage.Vegetative;
      }
      break;

    case GrowthStage.Vegetative:
      // 营养生长完成，累积GDD超过营养生长阈值
      if (newGDD >= p2Threshold) {
        newStage = GrowthStage.Flowering;
      }
      break;

    case GrowthStage.Flowering:
      // 开花阶段完成
      if (newGDD >= p3Threshold) {
        newStage = GrowthStage.Fruiting;
      }
      break;

    case GrowthStage.Fruiting:
      // 结果阶段完成
      if (newGDD >= p4Threshold) {
        newStage = GrowthStage.Maturity;
      }
      break;

    case GrowthStage.Maturity:
      // 成熟后进入收获期
      // 草莓为连续结果作物，成熟后可多次收获
      newStage = GrowthStage.Harvest;
      break;

    case GrowthStage.Harvest:
      // 收获期持续到模拟结束
      // 草莓可持续开花结果，不自动转入End阶段
      break;

    case GrowthStage.End:
      break;
  }

  return newStage;
}

/**
 * 计算从日期获取年内日序
 * @param date YYYYMMDD格式的日期
 * @returns 年内日序 (1-365/366)
 */
export function getDayOfYear(date: number): number {
  const year = Math.floor(date / 10000);
  const month = Math.floor((date % 10000) / 100);
  const day = date % 100;

  // 每月累计天数（非闰年）
  const monthDays = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let doy = monthDays[month - 1] + day;

  // 闰年修正
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  if (isLeap && month > 2) {
    doy += 1;
  }

  return doy;
}

/**
 * 计算热时间对发育的胁迫因子
 * 当温度偏离最适范围时降低发育速率
 * @param tavg 日平均温度 (°C)
 * @param tbase 基础温度 (°C)
 * @param topt 最适温度 (°C)
 * @param tmaxdev 上限温度 (°C)
 * @returns 温度胁迫因子 (0-1)
 */
export function calcTemperatureStress(
  tavg: number,
  tbase: number,
  topt: number,
  tmaxdev: number
): number {
  if (tavg <= tbase) return 0;
  if (tavg >= tmaxdev) return 0;
  if (tavg <= topt) {
    return (tavg - tbase) / (topt - tbase);
  }
  // 高温胁迫
  return (tmaxdev - tavg) / (tmaxdev - topt);
}
