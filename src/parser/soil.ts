/**
 * DSSAT 土壤文件 (.SOL) 解析器
 *
 * 解析 DSSAT 格式的土壤数据文件，支持一个文件中包含多个土壤剖面。
 * 文件格式示例：
 *   *SOIL: SOIL_ID  SOIL_NAME
 *   @ SITE        SLNM  SLCF  ...
 *    -99           -99   -99   ...
 *   @ SLON  SLAT  SLEV  ...
 *   @  SLB  SLMH  SLLL  SDUL  SSAT  SRGF  SSKS  SBDM  SLOC  ...
 *     5    Ap   0.115 0.268 0.439 1.000  0.60  1.38  1.50  ...
 *    15    Ap   0.115 0.268 0.439 0.866  0.60  1.38  1.50  ...
 */

import type { SoilProfile, SoilLayer } from '@/engine/types'
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
 * 解析单个土壤剖面
 *
 * @param lines 属于该剖面的所有行
 * @param warnings 警告信息收集数组
 * @returns SoilProfile 或 null（解析失败时）
 */
function parseSingleProfile(
  lines: string[],
  warnings: string[]
): SoilProfile | null {
  // 查找标题行 (*SOIL: SOIL_ID SOIL_NAME)
  let soilId = ''
  let profileName = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('*SOIL:') || trimmed.startsWith('*SOIL')) {
      const colonIdx = trimmed.indexOf(':')
      if (colonIdx !== -1) {
        const afterColon = trimmed.substring(colonIdx + 1).trim()
        // 格式: SOIL_ID  SOIL_NAME，ID 和名称之间用多个空格分隔
        const parts = afterColon.split(/\s{2,}/)
        soilId = parts[0] || ''
        profileName = parts.slice(1).join('  ').trim()
      } else {
        const afterStar = trimmed.substring(1).trim()
        const parts = afterStar.split(/\s{2,}/)
        soilId = parts[0] || ''
        profileName = parts.slice(1).join('  ').trim()
      }
      break
    }
  }

  if (!soilId) {
    warnings.push('未找到土壤标识符 (*SOIL:)')
    return null
  }

  // 解析土壤层数据
  const soilLayers: SoilLayer[] = []
  let currentColumns: { name: string; start: number }[] = []
  let inLayerSection = false
  let layerCounter = 0

  // 土壤剖面级别的额外属性（从文件中可能无法获取，使用默认值）
  let albedo = 0.0
  let u = 6.0
  let cn2 = 70
  let slnf = 1.0
  let slpf = 1.0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // 跳过空行和注释
    if (trimmed === '' || trimmed.startsWith('!')) continue
    // 跳过标题行
    if (trimmed.startsWith('*')) continue

    // 遇到列头行
    if (trimmed.startsWith('@')) {
      currentColumns = parseColumnHeaders(line)

      // 判断是否为土壤分层列头（包含 SLB 字段）
      if (currentColumns.some(c => c.name === 'SLB')) {
        inLayerSection = true
      } else {
        inLayerSection = false
        // 尝试从非分层列头的数据行中提取剖面级参数
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j].trim()
          if (nextLine === '' || nextLine.startsWith('!')) continue
          if (nextLine.startsWith('@')) break

          const fields = parseFixedWidthLine(lines[j], currentColumns)
          // 提取剖面级属性
          if ('SALB' in fields) albedo = parseNum(fields['SALB'])
          if ('U' in fields) u = parseNum(fields['U'])
          if ('CN2' in fields) cn2 = parseNum(fields['CN2'])
          if ('SLNF' in fields) slnf = parseNum(fields['SLNF'])
          if ('SLPF' in fields) slpf = parseNum(fields['SLPF'])
          break
        }
      }
      continue
    }

    // 数据行 - 土壤分层
    if (inLayerSection && currentColumns.length > 0) {
      const fields = parseFixedWidthLine(line, currentColumns)

      const slb = parseNum(fields['SLB'] || '')
      if (slb === 0) {
        warnings.push(`土壤剖面 ${soilId}：层深 SLB 为空，跳过该层`)
        continue
      }

      layerCounter++
      soilLayers.push({
        layerNum: layerCounter,
        sldm: slb,
        slll: parseNum(fields['SLLL'] || ''),
        sldul: parseNum(fields['SDUL'] || ''),
        slsat: parseNum(fields['SSAT'] || ''),
        slrgf: parseNum(fields['SRGF'] || ''),
        slks: parseNum(fields['SSKS'] || ''),
        slbdm: parseNum(fields['SBDM'] || ''),
        sloc: parseNum(fields['SLOC'] || ''),
        slph: parseNum(fields['SLHW'] || ''),
        slcl: parseNum(fields['SLCL'] || ''),
        slsi: parseNum(fields['SLSI'] || ''),
        slcf: parseNum(fields['SLCF'] || ''),
        slnh4: parseNum(fields['SLNH4'] || ''),
        slno3: parseNum(fields['SLNO3'] || ''),
      })
    }
  }

  return {
    soilId,
    name: profileName,
    albedo,
    u,
    cn2,
    slnf,
    slpf,
    layers: soilLayers,
  }
}

/**
 * 解析 DSSAT 土壤文件 (.SOL)
 *
 * @param content 文件内容字符串
 * @returns 解析结果，包含 SoilProfile 数组或错误信息
 */
export function parseSoilFile(content: string): ParseResult<SoilProfile[]> {
  const warnings: string[] = []

  if (!content || content.trim().length === 0) {
    return { success: false, error: '文件内容为空' }
  }

  const lines = content.split(/\r?\n/)

  // 将文件按土壤剖面分割（每个 *SOIL: 开头为一个新的剖面）
  const profileSections: string[][] = []
  let currentSection: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    // 遇到新的土壤剖面标题
    if (trimmed.startsWith('*SOIL') || (trimmed.startsWith('*') && /\*SOIL/i.test(trimmed))) {
      // 保存前一个剖面
      if (currentSection.length > 0) {
        profileSections.push(currentSection)
      }
      currentSection = [line]
    } else {
      currentSection.push(line)
    }
  }
  // 保存最后一个剖面
  if (currentSection.length > 0) {
    profileSections.push(currentSection)
  }

  // 如果没有找到 *SOIL 标记，将整个文件视为一个剖面
  if (profileSections.length === 0) {
    profileSections.push(lines)
  }

  const profiles: SoilProfile[] = []

  for (const section of profileSections) {
    const profile = parseSingleProfile(section, warnings)
    if (profile) {
      profiles.push(profile)
    }
  }

  if (profiles.length === 0) {
    return { success: false, error: '未解析到任何有效的土壤剖面' }
  }

  return {
    success: true,
    data: profiles,
    warnings,
  }
}
