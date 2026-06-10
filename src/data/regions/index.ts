/**
 * 多区域气候数据模块
 * 提供种植区域配置和基于正弦温度模型的天气数据生成器
 * 支持4个典型草莓产区：佛罗里达、加利福尼亚、上海、昆明
 */

import type { RegionConfig, DailyWeather } from '@/engine/types'

// ==================== 区域配置 ====================

/** 佛罗里达 Balm 站点 - 亚热带气候 */
export const floridaBalmRegion: RegionConfig = {
  id: 'FL-BALM',
  name: 'Florida Balm',
  country: '美国',
  lat: 27.76,
  lon: -82.23,
  elevation: 40,
  avgTemp: 22.5,
  annualRain: 1300,
  growingSeason: '10月-5月',
  climateType: 'subtropical',
}

/** 加利福尼亚 Salinas - 地中海气候 */
export const californiaSalinasRegion: RegionConfig = {
  id: 'CA-SALINAS',
  name: 'California Salinas',
  country: '美国',
  lat: 36.68,
  lon: -121.66,
  elevation: 52,
  avgTemp: 14.5,
  annualRain: 400,
  growingSeason: '10月-7月',
  climateType: 'mediterranean',
}

/** 上海 - 亚热带季风气候 */
export const shanghaiRegion: RegionConfig = {
  id: 'CN-SHANGHAI',
  name: '上海 Shanghai',
  country: '中国',
  lat: 31.23,
  lon: 121.47,
  elevation: 4,
  avgTemp: 16.5,
  annualRain: 1100,
  growingSeason: '9月-5月',
  climateType: 'subtropical-monsoon',
}

/** 昆明 - 亚热带高原气候 */
export const kunmingRegion: RegionConfig = {
  id: 'CN-KUNMING',
  name: '昆明 Kunming',
  country: '中国',
  lat: 25.04,
  lon: 102.71,
  elevation: 1891,
  avgTemp: 15.0,
  annualRain: 1000,
  growingSeason: '9月-5月',
  climateType: 'subtropical-highland',
}

/** 所有内置区域配置 */
export const builtInRegions: RegionConfig[] = [
  floridaBalmRegion,
  californiaSalinasRegion,
  shanghaiRegion,
  kunmingRegion,
]

/** 别名导出，兼容旧引用 */
export { builtInRegions as regions }

// ==================== 天气生成器 ====================

/**
 * 可重复伪随机数生成器（Lehmer LCG）
 * 确保同一区域同一输入生成相同的天气序列
 */
function createRNG(seed: number) {
  let state = seed
  return () => {
    state = (state * 16807 + 0) % 2147483647
    return (state - 1) / 2147483646
  }
}

/**
 * 计算日长（日照时长）
 * 基于纬度和日序号的简化天文计算
 * @param latitude 纬度 (度)
 * @param dayOfYear 年内日序号 (1-365)
 * @returns 日照时长 (h)
 */
function calcDayLength(lat: number, dayOfYear: number): number {
  const rad = Math.PI / 180
  const latRad = lat * rad
  // 太阳赤纬角
  const declination = 23.45 * Math.sin(rad * (360 / 365) * (dayOfYear - 81))
  const decRad = declination * rad

  // 日出时角
  const cosHA = -Math.tan(latRad) * Math.tan(decRad)
  const hourAngle = Math.acos(Math.max(-1, Math.min(1, cosHA)))

  // 日照时长 = 2 * 时角 / 15 (度转小时)
  return (2 * hourAngle * 180 / Math.PI) / 15
}

/**
 * 基于区域配置生成逐日天气数据
 * 使用正弦温度模型 + 随机扰动生成逼真气象序列
 *
 * 温度模型：T(d) = tav + amp/2 * sin(2π(d-80)/365) + noise
 * 其中 d 为年内日序号，80为北半球最暖日偏移
 *
 * @param region 区域配置
 * @param startDate 起始日期 (YYYYMMDD)
 * @param days 生成天数
 * @returns 逐日气象数据数组
 */
export function generateWeather(
  region: RegionConfig,
  startDate: number,
  days: number
): DailyWeather[] {
  const weatherData: DailyWeather[] = []

  // 解析起始日期
  const startYear = Math.floor(startDate / 10000)
  const startMonth = Math.floor((startDate % 10000) / 100)
  const startDay = startDate % 100

  // 使用区域id的哈希作为随机种子，确保可重复性
  let seedVal = 0
  for (let i = 0; i < region.id.length; i++) {
    seedVal = seedVal * 31 + region.id.charCodeAt(i)
  }
  seedVal = Math.abs(seedVal) + startYear
  const random = createRNG(seedVal)

  // 海拔修正：每升高100m温度降低0.65°C
  const elevationLapse = region.elevation > 500 ? (region.elevation - 500) * 0.0065 : 0
  const adjustedTav = region.avgTemp - elevationLapse

  // 降水参数：根据气候区域调整
  const rainParams = getRainParams(region.climateType)

  let current = new Date(startYear, startMonth - 1, startDay)

  for (let i = 0; i < days; i++) {
    const dayOfYear = getDayOfYear(current)
    const dateNum = current.getFullYear() * 10000 + (current.getMonth() + 1) * 100 + current.getDate()

    // ===== 温度计算：正弦模型 =====
    // 根据气候类型估算年温度振幅
    const amp = getTempAmplitude(region.climateType)
    const tempPhase = (2 * Math.PI * (dayOfYear - 80)) / 365
    const tempAnomaly = (amp / 2) * Math.sin(tempPhase)

    // 日均温
    const tavg = adjustedTav + tempAnomaly

    // 日温差
    const diurnalRange = getDiurnalRange(region.climateType, dayOfYear)

    // 最高温与最低温
    const tmaxBase = tavg + diurnalRange / 2
    const tminBase = tavg - diurnalRange / 2

    // 添加随机扰动
    const tmaxNoise = (random() - 0.5) * 6
    const tminNoise = (random() - 0.5) * 5
    const tmax = Math.round((tmaxBase + tmaxNoise) * 10) / 10
    const tmin = Math.round((tminBase + tminNoise) * 10) / 10

    // ===== 太阳辐射计算 =====
    const dayLength = calcDayLength(Math.abs(region.lat), dayOfYear)
    const clearSkySrad = estimateClearSkySrad(Math.abs(region.lat), dayOfYear)
    const cloudFactor = 0.5 + 0.5 * random()
    const srad = Math.round(clearSkySrad * cloudFactor * 10) / 10

    // ===== 降水计算 =====
    const isRainDay = random() < getRainProbability(rainParams, dayOfYear)
    const rain = isRainDay ? generateRainAmount(random, rainParams, dayOfYear) : 0

    // ===== 湿度估算 =====
    const rhum = estimateRelativeHumidity(tmax, tmin, rain, region.climateType)

    // ===== 露点温度 =====
    const dewp = Math.round((tmin - (100 - rhum) / 5) * 10) / 10

    // ===== 蒸发量 =====
    const evap = Math.round(Math.max(0, srad * 0.4 + (tmax - tmin) * 0.2) * 10) / 10

    // ===== 风速 =====
    const wind = Math.round((50 + random() * 100) * 10) / 10

    // ===== 光合有效辐射 =====
    const par = Math.round(srad * 0.5 * 10) / 10

    weatherData.push({
      date: dateNum,
      srad,
      tmax,
      tmin,
      rain,
      dewp,
      wind,
      par,
      evap,
      rhum,
    })

    // 下一天
    current = new Date(current.getTime() + 86400000)
  }

  return weatherData
}

// ==================== 辅助函数 ====================

/** 根据气候类型估算年温度振幅 */
function getTempAmplitude(climateType: string): number {
  switch (climateType) {
    case 'subtropical': return 9.0
    case 'mediterranean': return 6.5
    case 'subtropical-monsoon': return 12.5
    case 'subtropical-highland': return 5.0
    default: return 10.0
  }
}

/** 获取年内日序号 (1-365) */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / 86400000)
}

/** 降水参数配置 */
interface RainParams {
  annualRainDays: number
  monthlyFactor: number[]
  meanRainAmount: number
}

/** 根据气候区域获取降水参数 */
function getRainParams(climateType: string): RainParams {
  switch (climateType) {
    case 'subtropical':
      return {
        annualRainDays: 110,
        monthlyFactor: [0.6, 0.6, 0.7, 0.6, 0.8, 1.4, 1.5, 1.5, 1.4, 1.0, 0.6, 0.5],
        meanRainAmount: 12,
      }
    case 'mediterranean':
      return {
        annualRainDays: 55,
        monthlyFactor: [1.5, 1.4, 1.2, 0.8, 0.3, 0.1, 0.05, 0.05, 0.1, 0.4, 0.9, 1.4],
        meanRainAmount: 8,
      }
    case 'subtropical-monsoon':
      return {
        annualRainDays: 125,
        monthlyFactor: [0.7, 0.9, 1.3, 1.2, 1.1, 1.6, 1.3, 1.0, 1.0, 0.7, 0.6, 0.5],
        meanRainAmount: 10,
      }
    case 'subtropical-highland':
      return {
        annualRainDays: 130,
        monthlyFactor: [0.3, 0.3, 0.4, 0.6, 1.4, 1.6, 1.6, 1.5, 1.3, 1.2, 0.5, 0.3],
        meanRainAmount: 9,
      }
    default:
      return {
        annualRainDays: 80,
        monthlyFactor: Array(12).fill(1),
        meanRainAmount: 10,
      }
  }
}

/** 获取某日的降水概率 */
function getRainProbability(params: RainParams, dayOfYear: number): number {
  const month = Math.floor((dayOfYear - 1) / 30.5)
  const monthIdx = Math.min(11, Math.max(0, month))
  const baseProb = params.annualRainDays / 365
  return Math.min(0.8, baseProb * params.monthlyFactor[monthIdx])
}

/** 生成降水量 */
function generateRainAmount(random: () => number, params: RainParams, _dayOfYear: number): number {
  const u = random()
  const amount = -params.meanRainAmount * Math.log(1 - u * 0.99)
  return Math.round(Math.min(80, amount) * 10) / 10
}

/** 根据气候区域和季节获取日温差 */
function getDiurnalRange(climateType: string, dayOfYear: number): number {
  const variation = Math.sin(dayOfYear * 0.1) * 1.5
  switch (climateType) {
    case 'subtropical':
      return 10 + variation
    case 'mediterranean':
      return 11 + variation
    case 'subtropical-monsoon':
      return 9 + variation
    case 'subtropical-highland':
      return 13 + variation
    default:
      return 10 + variation
  }
}

/** 估算晴天太阳辐射 (MJ/m²/d) */
function estimateClearSkySrad(lat: number, dayOfYear: number): number {
  const rad = Math.PI / 180
  const declination = 23.45 * Math.sin(rad * (360 / 365) * (dayOfYear - 81))
  const latRad = lat * rad
  const decRad = declination * rad

  const cosHA = -Math.tan(latRad) * Math.tan(decRad)
  const hourAngle = Math.acos(Math.max(-1, Math.min(1, cosHA)))

  const solarConstant = 1367
  const dayAngle = 2 * Math.PI * (dayOfYear - 1) / 365
  const R0 = (solarConstant / Math.PI) * (1 + 0.033 * Math.cos(dayAngle)) *
    (hourAngle * Math.sin(latRad) * Math.sin(decRad) +
     Math.cos(latRad) * Math.cos(decRad) * Math.sin(hourAngle))

  const clearSkyTransmittance = 0.75
  return Math.max(3, R0 * 0.0864 * clearSkyTransmittance)
}

/** 估算相对湿度 */
function estimateRelativeHumidity(
  tmax: number,
  tmin: number,
  rain: number,
  climateType: string
): number {
  let baseHumidity: number
  switch (climateType) {
    case 'subtropical':
      baseHumidity = 72
      break
    case 'mediterranean':
      baseHumidity = 60
      break
    case 'subtropical-monsoon':
      baseHumidity = 75
      break
    case 'subtropical-highland':
      baseHumidity = 68
      break
    default:
      baseHumidity = 70
  }

  const tempRange = tmax - tmin
  const humidityAdjust = -tempRange * 1.2
  const rainAdjust = rain > 0 ? Math.min(20, rain * 1.5) : 0

  return Math.round(Math.max(25, Math.min(100, baseHumidity + humidityAdjust + rainAdjust)))
}
