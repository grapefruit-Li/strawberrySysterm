/**
 * DSSAT 品种文件 (.CUL) 解析器
 *
 * 解析 DSSAT 格式的品种参数文件。
 * 文件格式示例：
 *   *CULTIVAR DATA
 *   @VAR#  VRNAME.......... EXPNO  ECONO  P1V  P1R  P3  P4  P2O  P2RX
 *    IB0001 FLORA BRILLIANCE  .    IB001  200  150  300  400   0    0
 *    IB0002 FLORA RADIANCE   .    IB002  180  140  280  380   0    0
 *
 * 注意：品种名称列可能包含空格，且列名用点号填充（如 VRNAME..........）
 * 因此需要使用固定宽度列解析方式
 */

import type { CultivarParams } from '@/engine/types'
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
 * 品种文件的列名可能用点号填充（如 VRNAME..........），需要去除点号
 *
 * @param headerLine 以 @ 开头的列头行
 */
function parseColumnHeaders(headerLine: string): { name: string; start: number }[] {
  const line = headerLine.replace(/^@/, '').replace(/\r$/, '')
  const columns: { name: string; start: number }[] = []
  // 去除点号填充，匹配非空格非点号的连续字符
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
 * 解析 DSSAT 品种文件 (.CUL)
 *
 * @param content 文件内容字符串
 * @returns 解析结果，包含 CultivarParams 数组或错误信息
 */
export function parseCultivarFile(content: string): ParseResult<CultivarParams[]> {
  const warnings: string[] = []

  if (!content || content.trim().length === 0) {
    return { success: false, error: '文件内容为空' }
  }

  const lines = content.split(/\r?\n/)

  // 查找列头行 (@VAR# VRNAME.......... EXPNO ECONO ...)
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
    return { success: false, error: '未找到品种参数列头 (@VAR# VRNAME ...)' }
  }

  // 解析数据行
  const cultivars: CultivarParams[] = []

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // 空行或注释行跳过
    if (trimmed === '' || trimmed.startsWith('!')) continue
    // 遇到新的列头定义则停止
    if (trimmed.startsWith('@')) break

    const fields = parseFixedWidthLine(line, columns)

    // VAR# 是品种编号，必填
    const culCode = fields['VAR#'] || ''
    if (!culCode) {
      warnings.push(`第 ${i + 1} 行：缺少品种编号 (VAR#)，跳过该行`)
      continue
    }

    const name = fields['VRNAME'] || ''
    const ecoCode = fields['ECONO'] || ''
    const cropCode = fields['EXPNO'] || ''

    cultivars.push({
      culCode,
      name,
      ecoCode,
      cropCode,
      // 品种特有参数，从列头中提取已知字段
      p1v: parseNum(fields['P1V'] || ''),
      p1r: parseNum(fields['P1R'] || ''),
      p3: parseNum(fields['P3'] || ''),
      p4: parseNum(fields['P4'] || ''),
      laimax: parseNum(fields['LAIMAX'] || fields['P2O'] || ''),
      sla: parseNum(fields['SLA'] || fields['P2RX'] || ''),
      photosynmax: parseNum(fields['PHOTSYNMAX'] || fields['P5'] || ''),
      hi: parseNum(fields['HI'] || ''),
      fruitdm: parseNum(fields['FRUITDM'] || fields['P6'] || ''),
      nfruit: parseNum(fields['NFRUIT'] || ''),
      flrinterval: parseNum(fields['FLRINTERVAL'] || ''),
      maxfruitpertruss: parseNum(fields['MAXFRUITPERTRUSS'] || ''),
    })
  }

  if (cultivars.length === 0) {
    return { success: false, error: '未解析到任何品种数据' }
  }

  return {
    success: true,
    data: cultivars,
    warnings,
  }
}
