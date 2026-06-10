/**
 * DSSAT 生态型文件 (.ECO) 解析器
 *
 * 解析 DSSAT 格式的生态型参数文件，格式与品种文件类似。
 * 文件格式示例：
 *   *ECOTYPE DATA
 *   @ ECO#  ECONAME......... METHOD  P1  P2F  P3  P4  P2O  P2RX
 *    IB001  DEFAULT          1      200  150  300  400   0    0
 *    IB002  TROPICAL         1      180  140  280  380   0    0
 *
 * 注意：生态型名称列可能包含空格，且列名用点号填充
 */

import type { EcotypeParams } from '@/engine/types'
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
 * 生态型文件的列名可能用点号填充（如 ECONAME.........），需要去除点号
 *
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
 * 解析 DSSAT 生态型文件 (.ECO)
 *
 * @param content 文件内容字符串
 * @returns 解析结果，包含 EcotypeParams 数组或错误信息
 */
export function parseEcotypeFile(content: string): ParseResult<EcotypeParams[]> {
  const warnings: string[] = []

  if (!content || content.trim().length === 0) {
    return { success: false, error: '文件内容为空' }
  }

  const lines = content.split(/\r?\n/)

  // 查找列头行 (@ ECO# ECONAME......... ...)
  let columns: { name: string; start: number }[] = []
  let headerIdx = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed.startsWith('@')) {
      columns = parseColumnHeaders(line)
      headerIdx = i
      break
    }
  }

  if (headerIdx === -1 || columns.length === 0) {
    return { success: false, error: '未找到生态型参数列头 (@ ECO# ECONAME ...)' }
  }

  // 解析数据行
  const ecotypes: EcotypeParams[] = []

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // 空行或注释行跳过
    if (trimmed === '' || trimmed.startsWith('!')) continue
    // 遇到新的列头定义则停止
    if (trimmed.startsWith('@')) break

    const fields = parseFixedWidthLine(line, columns)

    // ECO# 是生态型编号，必填
    const ecoCode = fields['ECO#'] || ''
    if (!ecoCode) {
      warnings.push(`第 ${i + 1} 行：缺少生态型编号 (ECO#)，跳过该行`)
      continue
    }

    const name = fields['ECONAME'] || ''

    ecotypes.push({
      ecoCode,
      name,
      tbase: parseNum(fields['TBASE'] || fields['TB'] || ''),
      topt: parseNum(fields['TOPT'] || fields['TU'] || ''),
      tmax: parseNum(fields['TMAX'] || ''),
      cphot: parseNum(fields['CPHOT'] || fields['CPP'] || ''),
      ppfpe: parseNum(fields['PPFPE'] || fields['PPSEN'] || ''),
      laimax: parseNum(fields['LAIMAX'] || ''),
      sla: parseNum(fields['SLA'] || ''),
      photosynmax: parseNum(fields['PHOTOSYNMAX'] || fields['PGMAX'] || ''),
      rm25leaf: parseNum(fields['RM25LEAF'] || ''),
      rm25stem: parseNum(fields['RM25STEM'] || ''),
      rm25root: parseNum(fields['RM25ROOT'] || ''),
      rm25fruit: parseNum(fields['RM25FRUIT'] || ''),
      rg: parseNum(fields['RG'] || ''),
      partleaf: parseNum(fields['PARTLEAF'] || ''),
      partstem: parseNum(fields['PARTSTEM'] || ''),
      partroot: parseNum(fields['PARTROOT'] || ''),
      partfruit: parseNum(fields['PARTFRUIT'] || ''),
      pltdensity: parseNum(fields['PLTDENSITY'] || ''),
      rowspc: parseNum(fields['ROWSPC'] || ''),
      rtdepinit: parseNum(fields['RTDEPINIT'] || ''),
      rtdepmax: parseNum(fields['RTDEPMAX'] || ''),
    })
  }

  if (ecotypes.length === 0) {
    return { success: false, error: '未解析到任何生态型数据' }
  }

  return {
    success: true,
    data: ecotypes,
    warnings,
  }
}
