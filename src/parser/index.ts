/**
 * DSSAT 文件解析器统一导出模块
 *
 * 提供所有解析器的统一入口，以及文件类型检测和通用解析函数
 */

// 导出所有解析器
export { parseWeatherFile } from './weather'
export { parseSoilFile } from './soil'
export { parseCultivarFile } from './cultivar'
export { parseSpeciesFile } from './species'
export { parseEcotypeFile } from './ecotype'

// 导出类型
export type { ParseResult, ParseSuccess, ParseError, DssatFileType, FileFormat, ParseResultMap } from './types'

import type { DssatFileType, ParseResult, ParseResultMap } from './types'
import { parseWeatherFile } from './weather'
import { parseSoilFile } from './soil'
import { parseCultivarFile } from './cultivar'
import { parseSpeciesFile } from './species'
import { parseEcotypeFile } from './ecotype'

/**
 * 根据文件名检测 DSSAT 文件类型
 *
 * @param filename 文件名（含扩展名）
 * @returns 文件类型标识，无法识别时返回 null
 */
export function detectFileType(filename: string): DssatFileType | null {
  // 提取文件扩展名（去掉路径，取最后一个点之后的部分）
  const baseName = filename.split('/').pop() || filename
  const dotIdx = baseName.lastIndexOf('.')
  if (dotIdx === -1) return null

  const ext = baseName.substring(dotIdx + 1).toUpperCase()

  // DSSAT 文件扩展名映射
  switch (ext) {
    case 'WTH':
      return 'wth'
    case 'SOL':
      return 'sol'
    case 'CUL':
      return 'cul'
    case 'SPE':
      return 'spe'
    case 'ECO':
      return 'eco'
    default:
      return null
  }
}

/**
 * 通用 DSSAT 文件解析函数
 *
 * 根据指定的文件类型调用对应的解析器进行解析
 *
 * @param content 文件内容字符串
 * @param type 文件类型标识
 * @returns 解析结果
 */
export function parseDssatFile<T extends DssatFileType>(
  content: string,
  type: T
): ParseResult<ParseResultMap[T]> {
  switch (type) {
    case 'wth':
      return parseWeatherFile(content) as ParseResult<ParseResultMap[T]>
    case 'sol':
      return parseSoilFile(content) as ParseResult<ParseResultMap[T]>
    case 'cul':
      return parseCultivarFile(content) as ParseResult<ParseResultMap[T]>
    case 'spe':
      return parseSpeciesFile(content) as ParseResult<ParseResultMap[T]>
    case 'eco':
      return parseEcotypeFile(content) as ParseResult<ParseResultMap[T]>
    default:
      return {
        success: false,
        error: `不支持的文件类型: ${type}`,
      }
  }
}
