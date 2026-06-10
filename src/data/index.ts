/**
 * 内置数据统一导出
 * 提供所有内置气象、土壤、物种、品种数据
 * 以及默认模拟配置生成函数
 */
import type { SimulationConfig, ManagementEvent } from '@/engine/types'

// 导入各类内置数据
import { floridaBalmWeather } from '@/data/weather/florida-balm'
import { floridaSandProfile } from '@/data/soil/florida-sand'
import { strawberrySpecies } from '@/data/species/strawberry'
import {
  floridaRadiance,
  floridaBrilliance,
  floridaShortDayEcotype,
  builtInCultivars,
  builtInEcotypes,
} from '@/data/cultivars/florida-cultivars'

// 统一导出所有内置数据
export {
  floridaBalmWeather,
  floridaSandProfile,
  strawberrySpecies,
  floridaRadiance,
  floridaBrilliance,
  floridaShortDayEcotype,
  builtInCultivars,
  builtInEcotypes,
}

/**
 * 日期字符串转YYYYMMDD数字格式
 */
function dateToNum(dateStr: string): number {
  return parseInt(dateStr.replace(/-/g, ''), 10)
}

/**
 * 生成默认模拟配置
 * 使用内置的佛罗里达Balm站点数据和Florida Radiance品种
 * @returns 完整的SimulationConfig对象
 */
export function defaultSimulationConfig(): SimulationConfig {
  const management: ManagementEvent[] = [
    {
      eventType: 'planting',
      date: 20201015,
      amount: 0,
      details: { description: '移栽定植 - Florida Radiance裸根苗', method: 'bare-root', depth: 10 },
    },
    {
      eventType: 'irrigation',
      date: 20201015,
      amount: 25,
      details: { description: '定植水 - 滴灌' },
    },
    {
      eventType: 'fertilizer',
      date: 20201020,
      amount: 450,
      details: { description: '基肥 - 10-10-10复合肥', fertilizerType: '10-10-10' },
    },
    {
      eventType: 'irrigation',
      date: 20201120,
      amount: 15,
      details: { description: '花期灌溉' },
    },
    {
      eventType: 'harvest',
      date: 20201220,
      amount: 0,
      details: { description: '首次采收' },
    },
    {
      eventType: 'fertilizer',
      date: 20210105,
      amount: 200,
      details: { description: '追肥 - 氮钾肥促果', fertilizerType: 'KNO3' },
    },
    {
      eventType: 'irrigation',
      date: 20210115,
      amount: 20,
      details: { description: '冬季补充灌溉' },
    },
    {
      eventType: 'fertilizer',
      date: 20210215,
      amount: 150,
      details: { description: '追肥 - 结果期补充', fertilizerType: 'KNO3' },
    },
  ]

  return {
    weather: floridaBalmWeather,
    soil: floridaSandProfile,
    species: strawberrySpecies,
    cultivar: floridaRadiance,
    ecotype: floridaShortDayEcotype,
    management,
    startDate: 20201015,
    endDate: 20210315,
  }
}

// 导出日期转换工具
export { dateToNum }
