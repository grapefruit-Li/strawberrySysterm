/**
 * DSSAT 气象文件 (.WTH) 解析器
 *
 * 解析 DSSAT 格式的气象数据文件，包含站点信息和逐日气象数据。
 * 文件格式示例：
 *   *WEATHER DATA : STATION_NAME
 *   @ INSI LAT LONG ELEV TAV AMP REFHT WNDHT
 *    STNID  27.50   82.50    15  22.5  10.2  1.50  2.00
 *   @DATE  SRAD  TMAX  TMIN  RAIN  DEWP  WIND  PAR  EVAP  RHUM
 *    90001   8.5  18.3   5.8   0.0   5.2   2.1    0    1.5    65
 */

import type { WeatherStation, DailyWeather } from '@/engine/types'
import type { ParseResult } from './types'

/** DSSAT 中缺失值的标记 */
const MISSING_VALUE = -99

/**
 * 将字符串值转换为数值，-99 视为缺失值返回 0
 * DSSAT 引擎类型中数值字段为 number 类型，缺失值用 0 填充
 * @param val 待转换的字符串
 * @returns 数值（缺失值返回 0）
 */
function parseNum(val: string): number {
  const trimmed = val.trim()
  if (trimmed === '' || trimmed === '.' || trimmed === '-99' || trimmed === '-99.0') {
    return 0
  }
  const num = Number(trimmed)
  if (isNaN(num)) return 0
  // -99 系列值视为缺失
  if (num <= MISSING_VALUE + 0.5 && num >= MISSING_VALUE - 0.5) return 0
  return num
}

/**
 * 解析固定宽度列头的字段名和起始位置
 * DSSAT 使用 @ 开头的行定义列头，列名之间用空格分隔
 * 但列宽是固定的，需要根据列名位置确定数据列的起止位置
 *
 * @param headerLine 以 @ 开头的列头行
 * @returns 字段名和对应起始位置的数组
 */
function parseColumnHeaders(headerLine: string): { name: string; start: number }[] {
  // 去掉 @ 符号
  const line = headerLine.replace(/^@/, '').replace(/\r$/, '')
  const columns: { name: string; start: number }[] = []
  // 使用正则匹配所有字段名及其起始位置
  const regex = /\S+/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(line)) !== null) {
    columns.push({
      name: match[0].toUpperCase(),
      start: match.index,
    })
  }
  return columns
}

/**
 * 根据列头定义从固定宽度数据行中提取字段值
 *
 * @param dataLine 数据行
 * @param columns 列头定义
 * @returns 字段名到值的映射
 */
function parseFixedWidthLine(
  dataLine: string,
  columns: { name: string; start: number }[]
): Record<string, string> {
  const result: Record<string, string> = {}
  const line = dataLine.replace(/\r$/, '')

  for (let i = 0; i < columns.length; i++) {
    const col = columns[i]
    // 当前列的结束位置为下一列的起始位置，或行尾
    const end = i + 1 < columns.length ? columns[i + 1].start : line.length
    const value = line.substring(col.start, end)
    result[col.name] = value.trim()
  }

  return result
}

/**
 * 将 YYDDD 格式日期转换为 YYYYMMDD 数值格式
 * YYDDD: 2位年份 + 3位年内天数
 * 例如: 90001 -> 1990001 或 90001 -> 2090001
 *
 * @param yyddd YYDDD 格式的日期字符串
 * @returns YYYYMMDD 格式的数值日期
 */
function convertDate(yyddd: string): number {
  const trimmed = yyddd.trim()
  if (trimmed.length < 5) return 0

  const yy = parseInt(trimmed.substring(0, 2), 10)
  const ddd = parseInt(trimmed.substring(2), 10)

  // 简单的两位数年份处理：00-50 视为 2000-2050，51-99 视为 1951-1999
  const yyyy = yy <= 50 ? 2000 + yy : 1900 + yy

  // 根据年内天数计算月日
  const startOfYear = new Date(yyyy, 0, 1)
  const targetDate = new Date(startOfYear.getTime() + (ddd - 1) * 86400000)

  const month = targetDate.getMonth() + 1
  const day = targetDate.getDate()

  // 格式化为 YYYYMMDD 数值
  return yyyy * 10000 + month * 100 + day
}

/**
 * 解析 DSSAT 气象文件 (.WTH)
 *
 * @param content 文件内容字符串
 * @returns 解析结果，包含 WeatherStation 或错误信息
 */
export function parseWeatherFile(content: string): ParseResult<WeatherStation> {
  const warnings: string[] = []

  if (!content || content.trim().length === 0) {
    return { success: false, error: '文件内容为空' }
  }

  // 按行分割
  const lines = content.split(/\r?\n/)

  // 查找标题行 (*WEATHER DATA : ...)
  let stationName = ''
  let headerLineIdx = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    // 匹配 *WEATHER DATA : STATION_NAME 格式
    if (line.startsWith('*WEATHER')) {
      const colonIdx = line.indexOf(':')
      if (colonIdx !== -1) {
        stationName = line.substring(colonIdx + 1).trim()
      }
      headerLineIdx = i
      break
    }
    // 也支持 *WTH 等简写格式
    if (line.startsWith('*') && !line.startsWith('@')) {
      const colonIdx = line.indexOf(':')
      if (colonIdx !== -1) {
        stationName = line.substring(colonIdx + 1).trim()
      }
      headerLineIdx = i
      break
    }
  }

  if (headerLineIdx === -1) {
    return { success: false, error: '未找到气象文件标题行 (*WEATHER DATA)' }
  }

  // 解析站点信息行 (@ INSI LAT LONG ELEV TAV AMP REFHT WNDHT)
  let stationColumns: { name: string; start: number }[] = []
  let stationDataLine = ''
  let stationHeaderIdx = -1

  for (let i = headerLineIdx + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '' || line.trimStart().startsWith('!')) continue

    if (line.trimStart().startsWith('@')) {
      stationColumns = parseColumnHeaders(line)
      stationHeaderIdx = i
      break
    }
  }

  if (stationHeaderIdx === -1 || stationColumns.length === 0) {
    return { success: false, error: '未找到站点信息列头 (@ INSI LAT LONG ...)' }
  }

  // 查找站点信息数据行
  for (let i = stationHeaderIdx + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '' || line.trimStart().startsWith('!')) continue
    stationDataLine = line
    break
  }

  if (!stationDataLine) {
    return { success: false, error: '未找到站点信息数据行' }
  }

  // 解析站点信息
  const stationFields = parseFixedWidthLine(stationDataLine, stationColumns)

  const stationId = stationFields['INSI'] || ''
  const lat = parseNum(stationFields['LAT'] || '')
  const lon = parseNum(stationFields['LONG'] || '')
  const elev = parseNum(stationFields['ELEV'] || '')
  const tav = parseNum(stationFields['TAV'] || '')
  const amp = parseNum(stationFields['AMP'] || '')
  const refht = parseNum(stationFields['REFHT'] || '')
  const wndht = parseNum(stationFields['WNDHT'] || '')

  // 解析逐日气象数据 (@DATE SRAD TMAX TMIN RAIN ...)
  let dailyColumns: { name: string; start: number }[] = []
  let dailyHeaderIdx = -1

  for (let i = stationHeaderIdx + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '' || line.trimStart().startsWith('!')) continue

    if (line.trimStart().startsWith('@')) {
      dailyColumns = parseColumnHeaders(line)
      dailyHeaderIdx = i
      break
    }
  }

  if (dailyHeaderIdx === -1 || dailyColumns.length === 0) {
    return { success: false, error: '未找到逐日数据列头 (@DATE SRAD TMAX ...)' }
  }

  // 解析逐日数据行
  const days: DailyWeather[] = []

  for (let i = dailyHeaderIdx + 1; i < lines.length; i++) {
    const line = lines[i]
    // 空行或注释行跳过
    if (line.trim() === '' || line.trimStart().startsWith('!')) continue
    // 遇到新的列头定义则停止
    if (line.trimStart().startsWith('@')) break

    const fields = parseFixedWidthLine(line, dailyColumns)

    // DATE 字段是必填的
    const dateStr = fields['DATE'] || ''
    if (!dateStr) {
      warnings.push(`第 ${i + 1} 行：缺少日期字段，跳过该行`)
      continue
    }

    // 将 YYDDD 格式转换为 YYYYMMDD 数值
    const date = convertDate(dateStr)

    days.push({
      date,
      srad: parseNum(fields['SRAD'] || ''),
      tmax: parseNum(fields['TMAX'] || ''),
      tmin: parseNum(fields['TMIN'] || ''),
      rain: parseNum(fields['RAIN'] || ''),
      dewp: parseNum(fields['DEWP'] || ''),
      wind: parseNum(fields['WIND'] || ''),
      par: parseNum(fields['PAR'] || ''),
      evap: parseNum(fields['EVAP'] || ''),
      rhum: parseNum(fields['RHUM'] || ''),
    })
  }

  if (days.length === 0) {
    warnings.push('未解析到任何逐日气象数据')
  }

  return {
    success: true,
    data: {
      stationId,
      name: stationName,
      lat,
      lon,
      elev,
      tav,
      amp,
      refht,
      wndht,
      days,
    },
    warnings,
  }
}
