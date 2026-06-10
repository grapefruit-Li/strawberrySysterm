/**
 * DSSAT CROPGRO-Strawberry 果实品质预测模块
 * 基于Hopf et al. (2022)回归模型
 * 预测可溶性固形物含量(SSC)、可滴定酸度和硬度
 * 这些品质指标受采收前气象条件的影响
 */

import { DailyWeather, HarvestRecord } from './types';

/**
 * 计算采收前N天的气象指数
 * 用于品质预测的累积气象变量
 * @param weatherData 气象数据数组
 * @param harvestDateIndex 收获日在数组中的索引
 * @param days 回溯天数
 * @returns 气象指数 {avgT, avgSRAD, totalRain, avgRH, avgDayNightDiff}
 */
export function calcPreHarvestWeatherIndices(
  weatherData: DailyWeather[],
  harvestDateIndex: number,
  days: number
): {
  avgT: number;
  avgSRAD: number;
  totalRain: number;
  avgRH: number;
  avgDayNightDiff: number;
} {
  const startIdx = Math.max(0, harvestDateIndex - days);
  const count = harvestDateIndex - startIdx;

  if (count <= 0) {
    return { avgT: 20, avgSRAD: 15, totalRain: 0, avgRH: 70, avgDayNightDiff: 10 };
  }

  let sumT = 0, sumSRAD = 0, sumRain = 0, sumRH = 0, sumDNDiff = 0;

  for (let i = startIdx; i < harvestDateIndex; i++) {
    const w = weatherData[i];
    sumT += (w.tmax + w.tmin) / 2;
    sumSRAD += w.srad;
    sumRain += w.rain;
    sumRH += w.rhum;
    sumDNDiff += w.tmax - w.tmin;
  }

  return {
    avgT: sumT / count,
    avgSRAD: sumSRAD / count,
    totalRain: sumRain,
    avgRH: sumRH / count,
    avgDayNightDiff: sumDNDiff / count,
  };
}

/**
 * 预测可溶性固形物含量 (SSC, %)
 * 基于Hopf et al. (2022)的回归模型
 * SSC受采收前温度、辐射和降水的影响
 * 高温降低SSC，高辐射增加SSC，降水过多降低SSC
 * @param baseSSC 基准SSC (%) - 来自物种/品种参数
 * @param preHarvestWeather 采收前气象指数
 * @param preHarvestDays 回溯天数 (通常7-14天)
 * @returns 预测SSC (%)
 */
export function predictSSC(
  baseSSC: number,
  preHarvestWeather: {
    avgT: number;
    avgSRAD: number;
    totalRain: number;
    avgRH: number;
    avgDayNightDiff: number;
  },
  preHarvestDays: number = 10
): number {
  // 参考温度 (°C) - 基准SSC对应的温度
  const refT = 18;
  // 参考辐射 (MJ/m²/d)
  const refSRAD = 15;

  // 温度效应: 高温降低SSC
  // 系数约 -0.15 %/°C (基于Hopf et al. 2022)
  const tempEffect = -0.15 * (preHarvestWeather.avgT - refT);

  // 辐射效应: 高辐射增加SSC
  // 系数约 +0.05 %/(MJ/m²/d)
  const sradEffect = 0.05 * (preHarvestWeather.avgSRAD - refSRAD);

  // 降水效应: 降水过多稀释SSC
  // 系数约 -0.02 %/mm
  const rainEffect = -0.02 * preHarvestWeather.totalRain;

  // 昼夜温差效应: 大温差有利于糖分积累
  // 系数约 +0.08 %/°C
  const dndEffect = 0.08 * (preHarvestWeather.avgDayNightDiff - 10);

  // 综合预测
  const ssc = baseSSC + tempEffect + sradEffect + rainEffect + dndEffect;

  // SSC合理范围限制 (草莓典型范围5-15%)
  return Math.max(4, Math.min(16, ssc));
}

/**
 * 预测可滴定酸度 (Titratable Acidity, meq/100g)
 * 基于Hopf et al. (2022)的回归模型
 * 酸度受采收前温度和辐射的影响
 * 高温降低酸度，低辐射增加酸度
 * @param baseAcidity 基准酸度 (meq/100g)
 * @param preHarvestWeather 采收前气象指数
 * @param preHarvestDays 回溯天数
 * @returns 预测酸度 (meq/100g)
 */
export function predictAcidity(
  baseAcidity: number,
  preHarvestWeather: {
    avgT: number;
    avgSRAD: number;
    totalRain: number;
    avgRH: number;
    avgDayNightDiff: number;
  },
  preHarvestDays: number = 10
): number {
  // 参考温度
  const refT = 18;
  // 参考辐射
  const refSRAD = 15;

  // 温度效应: 高温加速有机酸降解，降低酸度
  // 系数约 -0.08 meq/100g/°C
  const tempEffect = -0.08 * (preHarvestWeather.avgT - refT);

  // 辐射效应: 高辐射促进酸代谢，降低酸度
  // 系数约 -0.03 meq/100g/(MJ/m²/d)
  const sradEffect = -0.03 * (preHarvestWeather.avgSRAD - refSRAD);

  // 降水效应: 降水增加可能略微增加酸度
  const rainEffect = 0.005 * preHarvestWeather.totalRain;

  // 综合预测
  const acidity = baseAcidity + tempEffect + sradEffect + rainEffect;

  // 酸度合理范围 (草莓典型范围8-20 meq/100g)
  return Math.max(5, Math.min(25, acidity));
}

/**
 * 预测果实硬度 (Firmness, N)
 * 基于Hopf et al. (2022)的回归模型
 * 硬度受采收前温度、辐射和水分状况的影响
 * 高温降低硬度，低辐射降低硬度
 * @param baseFirmness 基准硬度 (N)
 * @param preHarvestWeather 采收前气象指数
 * @param preHarvestDays 回溯天数
 * @returns 预测硬度 (N)
 */
export function predictFirmness(
  baseFirmness: number,
  preHarvestWeather: {
    avgT: number;
    avgSRAD: number;
    totalRain: number;
    avgRH: number;
    avgDayNightDiff: number;
  },
  preHarvestDays: number = 10
): number {
  // 参考温度
  const refT = 18;
  // 参考辐射
  const refSRAD = 15;

  // 温度效应: 高温加速细胞壁降解，降低硬度
  // 系数约 -0.06 N/°C
  const tempEffect = -0.06 * (preHarvestWeather.avgT - refT);

  // 辐射效应: 高辐射有利于细胞壁结构维持
  // 系数约 +0.02 N/(MJ/m²/d)
  const sradEffect = 0.02 * (preHarvestWeather.avgSRAD - refSRAD);

  // 降水效应: 降水过多降低硬度 (细胞膨胀)
  const rainEffect = -0.01 * preHarvestWeather.totalRain;

  // 相对湿度效应: 高湿降低硬度
  const rhEffect = -0.01 * (preHarvestWeather.avgRH - 70);

  // 综合预测
  const firmness = baseFirmness + tempEffect + sradEffect + rainEffect + rhEffect;

  // 硬度合理范围 (草莓典型范围1.0-4.0 N)
  return Math.max(0.5, Math.min(5.0, firmness));
}

/**
 * 综合预测果实品质
 * @param baseSSC 基准SSC (%)
 * @param baseAcidity 基准酸度 (meq/100g)
 * @param baseFirmness 基准硬度 (N)
 * @param weatherData 气象数据数组
 * @param harvestDateIndex 收获日索引
 * @param preHarvestDays 回溯天数
 * @returns 品质预测结果 {ssc, acidity, firmness}
 */
export function predictFruitQuality(
  baseSSC: number,
  baseAcidity: number,
  baseFirmness: number,
  weatherData: DailyWeather[],
  harvestDateIndex: number,
  preHarvestDays: number = 10
): { ssc: number; acidity: number; firmness: number } {
  const weatherIndices = calcPreHarvestWeatherIndices(
    weatherData,
    harvestDateIndex,
    preHarvestDays
  );

  return {
    ssc: predictSSC(baseSSC, weatherIndices, preHarvestDays),
    acidity: predictAcidity(baseAcidity, weatherIndices, preHarvestDays),
    firmness: predictFirmness(baseFirmness, weatherIndices, preHarvestDays),
  };
}

/**
 * 更新收获记录中的品质指标
 * @param harvest 原始收获记录
 * @param quality 品质预测结果
 * @returns 更新后的收获记录
 */
export function updateHarvestQuality(
  harvest: HarvestRecord,
  quality: { ssc: number; acidity: number; firmness: number }
): HarvestRecord {
  return {
    ...harvest,
    ssc: quality.ssc,
    acidity: quality.acidity,
    firmness: quality.firmness,
  };
}
