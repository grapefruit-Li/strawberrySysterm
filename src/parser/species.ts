/**
 * DSSAT 物种文件 (.SPE) 解析器
 *
 * 解析 DSSAT 格式的物种参数文件。
 * 物种文件结构较为灵活，通常包含：
 *   - 标题行 (*SPECIES)
 *   - 通用参数区（键值对格式）
 *   - 分区参数区（以 ! 或特定标记分隔的不同参数组）
 *
 * 简化解析：提取所有参数键值对，映射到 SpeciesParams 接口
 */

import type { SpeciesParams } from '@/engine/types'
import type { ParseResult } from './types'

/** DSSAT 中缺失值的标记 */
const MISSING_VALUE = -99

/**
 * 将字符串值转换为数值，-99 视为缺失值返回 0
 */
function parseNum(val: string): number {
  const trimmed = val.trim()
  if (trimmed === '' || trimmed === '.' || trimmed === '-99' || trimmed === '-99.0') {
    return 0
  }
  const num = Number(trimmed)
  if (isNaN(num)) return 0
  if (num <= MISSING_VALUE + 0.5 && num >= MISSING_VALUE - 0.5) return 0
  return num
}

/**
 * 解析固定宽度列头
 * @param headerLine 以 @ 开头的列头行
 */
function parseColumnHeaders(headerLine: string): { name: string; start: number }[] {
  const line = headerLine.replace(/^@/, '').replace(/\r$/, '')
  const columns: { name: string; start: number }[] = []
  // 去除点号填充
  const regex = /[^\s.]+/g
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
 */
function parseFixedWidthLine(
  dataLine: string,
  columns: { name: string; start: number }[]
): Record<string, string> {
  const result: Record<string, string> = {}
  const line = dataLine.replace(/\r$/, '')

  for (let i = 0; i < columns.length; i++) {
    const col = columns[i]
    const end = i + 1 < columns.length ? columns[i + 1].start : line.length
    const value = line.substring(col.start, end)
    result[col.name] = value.trim()
  }

  return result
}

/**
 * 解析 DSSAT 物种文件 (.SPE)
 *
 * @param content 文件内容字符串
 * @returns 解析结果，包含 SpeciesParams 或错误信息
 */
export function parseSpeciesFile(content: string): ParseResult<SpeciesParams> {
  const warnings: string[] = []

  if (!content || content.trim().length === 0) {
    return { success: false, error: '文件内容为空' }
  }

  const lines = content.split(/\r?\n/)

  // 查找物种名称（标题行 *SPECIES 或 *SPECIES:NAME）
  let speciesName = ''
  let cropCode = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('*SPECIES')) {
      const colonIdx = trimmed.indexOf(':')
      if (colonIdx !== -1) {
        speciesName = trimmed.substring(colonIdx + 1).trim()
      }
      break
    }
    // 也支持其他 * 开头的标题
    if (trimmed.startsWith('*') && !trimmed.startsWith('@')) {
      const colonIdx = trimmed.indexOf(':')
      if (colonIdx !== -1) {
        speciesName = trimmed.substring(colonIdx + 1).trim()
      } else {
        speciesName = trimmed.substring(1).trim()
      }
      break
    }
  }

  // 收集所有键值对参数
  const allParams: Record<string, number> = {}
  let currentColumns: { name: string; start: number }[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // 空行跳过
    if (trimmed === '') continue
    // 注释行跳过
    if (trimmed.startsWith('!')) continue
    // 标题行跳过
    if (trimmed.startsWith('*')) continue

    // 列头行
    if (trimmed.startsWith('@')) {
      currentColumns = parseColumnHeaders(line)
      continue
    }

    // 数据行
    if (currentColumns.length > 0) {
      // 使用固定宽度解析
      const fields = parseFixedWidthLine(line, currentColumns)
      for (const [key, val] of Object.entries(fields)) {
        allParams[key] = parseNum(val)
      }
    } else {
      // 没有列头时，尝试按空格分隔的键值对解析
      // 格式: PARAM_NAME  VALUE  [可选描述]
      const parts = trimmed.split(/\s+/)
      if (parts.length >= 2) {
        const paramName = parts[0].toUpperCase()
        allParams[paramName] = parseNum(parts[1])
      }
    }
  }

  // 从收集的参数中提取 cropCode
  cropCode = String(allParams['CROPCODE'] || allParams['CROP'] || '')

  // 构建 SpeciesParams 对象，使用收集的参数或默认值 0
  return {
    success: true,
    data: {
      cropCode,
      name: speciesName,
      pgerm: allParams['PGERM'] || 0,
      p1: allParams['P1'] || 0,
      p2: allParams['P2'] || 0,
      p3: allParams['P3'] || 0,
      p4: allParams['P4'] || 0,
      tbase: allParams['TBASE'] || allParams['TB'] || 0,
      topt: allParams['TOPT'] || allParams['TU'] || 0,
      tmax: allParams['TMAX'] || 0,
      ppfpe: allParams['PPFPE'] || allParams['PPSEN'] || 0,
      cphot: allParams['CPHOT'] || allParams['CPP'] || 0,
      laimax: allParams['LAIMAX'] || 0,
      lfext: allParams['LFEXT'] || 0,
      sla: allParams['SLA'] || 0,
      photosynmax: allParams['PHOTOSYNMAX'] || allParams['PGMAX'] || 0,
      quantumyield: allParams['QUANTUMYIELD'] || allParams['PARU'] || 0,
      rlf: allParams['RLF'] || 0,
      rst: allParams['RST'] || 0,
      rrt: allParams['RRT'] || 0,
      rm25leaf: allParams['RM25LEAF'] || 0,
      rm25stem: allParams['RM25STEM'] || 0,
      rm25root: allParams['RM25ROOT'] || 0,
      rm25fruit: allParams['RM25FRUIT'] || 0,
      rg: allParams['RG'] || 0,
      glf: allParams['GLF'] || 0,
      gst: allParams['GST'] || 0,
      grt: allParams['GRT'] || 0,
      gfr: allParams['GFR'] || 0,
      rdmax: allParams['RDMAX'] || allParams['RDPDMAX'] || 0,
      rgrw: allParams['RGRW'] || 0,
      senrate: allParams['SENRATE'] || 0,
      senstart: allParams['SENSTART'] || 0,
      himax: allParams['HIMAX'] || 0,
      seedn: allParams['SEEDN'] || 0,
      nleaflf: allParams['NLEAFLF'] || 0,
      nleafhf: allParams['NLEAFHF'] || 0,
      nstem: allParams['NSTEM'] || 0,
      nroot: allParams['NROOT'] || 0,
      nfruit: allParams['NFRUIT'] || 0,
      wfpu: allParams['WFPU'] || 0,
      wfeu: allParams['WFEU'] || 0,
      nfpu: allParams['NFPU'] || 0,
      nfeu: allParams['NFEU'] || 0,
      flrinterval: allParams['FLRINTERVAL'] || 0,
      maxfruitpertruss: allParams['MAXFRUITPERTRUSS'] || 0,
      fruitdm: allParams['FRUITDM'] || allParams['FRDM'] || 0,
      sscbase: allParams['SSCBASE'] || 0,
      acidbase: allParams['ACIDBASE'] || 0,
      firmbase: allParams['FIRMBASE'] || 0,
    },
    warnings,
  }
}
