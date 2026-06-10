/**
 * 佛罗里达州Balm站点内置气象数据
 * DSSAT草莓模型主要验证站点
 * 数据覆盖2020年10月 - 2021年3月一个完整生长季
 */
import type { WeatherStation, DailyWeather } from '@/engine/types'

/**
 * 根据月份生成佛罗里达中部的典型日气象数据
 * 基于历史气象记录的统计特征
 */
function generateFloridaBalmWeather(): DailyWeather[] {
  const data: DailyWeather[] = []

  // 各月份的气象参数基线 [平均srad, 平均tmax, 平均tmin, 月降雨天数, 月均降雨量mm]
  const monthlyParams: Record<number, [number, number, number, number, number]> = {
    10: [16.5, 30.0, 18.5, 7, 80],   // 10月：温暖，偶有降雨
    11: [14.0, 26.5, 14.0, 5, 55],   // 11月：转凉
    12: [12.0, 23.5, 10.5, 5, 60],   // 12月：温和冬季
    1:  [12.5, 22.0, 8.5, 6, 65],    // 1月：最冷月
    2:  [14.0, 24.0, 10.5, 6, 70],   // 2月：开始回暖
    3:  [17.5, 27.0, 13.5, 6, 85],   // 3月：春季回暖
  }

  // 简单伪随机数生成器（确保可重复性）
  let seed = 20201001
  const random = () => {
    seed = (seed * 16807 + 0) % 2147483647
    return (seed - 1) / 2147483646
  }

  // 生成日期范围：2020-10-01 到 2021-03-31
  const startDate = new Date(2020, 9, 1) // 10月1日
  const endDate = new Date(2021, 2, 31)  // 3月31日

  let current = new Date(startDate)
  while (current <= endDate) {
    const month = current.getMonth() + 1
    const year = current.getFullYear()
    const params = monthlyParams[month] || monthlyParams[1]

    // 计算YYYYMMDD格式日期
    const dateNum = year * 10000 + (month) * 100 + current.getDate()

    // 添加日变化随机性
    const sradVar = (random() - 0.5) * 6
    const tmaxVar = (random() - 0.5) * 6
    const tminVar = (random() - 0.5) * 5

    // 降雨模拟：基于月降雨天数概率
    const rainProbability = params[3] / 30
    const isRainy = random() < rainProbability
    let rain = 0
    if (isRainy) {
      rain = Math.max(0.5, random() * random() * params[4] * 2)
    }

    // 降雨天太阳辐射降低
    const sradReduction = isRainy ? 0.4 + random() * 0.3 : 1.0
    const cloudEffect = isRainy ? 0.5 : 1.0

    const srad = Math.max(2, Math.round((params[0] + sradVar) * sradReduction * 10) / 10)
    const tmax = Math.round((params[1] + tmaxVar * cloudEffect) * 10) / 10
    const tmin = Math.round((params[2] + tminVar * 0.7) * 10) / 10
    const rainVal = Math.round(rain * 10) / 10

    data.push({
      date: dateNum,
      srad,
      tmax,
      tmin,
      rain: rainVal,
      dewp: Math.round((tmin + 2 + (random() - 0.5) * 4) * 10) / 10,
      wind: Math.round((50 + random() * 100) * 10) / 10,
      par: Math.round(srad * 0.5 * 10) / 10,
      evap: Math.round(srad * 0.15 * 10) / 10,
      rhum: Math.round((60 + random() * 30) * 10) / 10,
    })

    // 前进一天
    current = new Date(current.getTime() + 86400000)
  }

  return data
}

/** 佛罗里达Balm气象站点数据 */
export const floridaBalmWeather: WeatherStation = {
  stationId: 'UFGC',
  name: 'Balm, FL - UF Gulf Coast Research Center',
  lat: 27.76,
  lon: -82.23,
  elev: 15,
  tav: 22.5,
  amp: 10.2,
  refht: 1.5,
  wndht: 10.0,
  days: generateFloridaBalmWeather(),
}
