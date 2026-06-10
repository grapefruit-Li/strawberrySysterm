/**
 * DSSAT 解析器专用类型定义
 * 包含解析结果类型和文件格式类型
 */

import type {
  WeatherStation,
  SoilProfile,
  CultivarParams,
  SpeciesParams,
  EcotypeParams,
} from '@/engine/types'

// ============ 解析结果类型 ============

/** 解析成功结果 */
export interface ParseSuccess<T> {
  /** 是否解析成功 */
  success: true
  /** 解析后的数据 */
  data: T
  /** 解析过程中的警告信息 */
  warnings: string[]
}

/** 解析失败结果 */
export interface ParseError {
  /** 是否解析成功 */
  success: false
  /** 错误信息 */
  error: string
  /** 错误所在行号（可选） */
  line?: number
}

/** 解析结果联合类型，支持成功和错误两种状态 */
export type ParseResult<T> = ParseSuccess<T> | ParseError

// ============ 文件格式类型 ============

/** DSSAT 文件类型标识 */
export type DssatFileType = 'wth' | 'sol' | 'cul' | 'spe' | 'eco'

/** 气象文件格式元数据 */
export interface WeatherFileFormat {
  type: 'wth'
  /** 站点名称 */
  stationName: string
}

/** 土壤文件格式元数据 */
export interface SoilFileFormat {
  type: 'sol'
  /** 土壤剖面数量 */
  profileCount: number
}

/** 品种文件格式元数据 */
export interface CultivarFileFormat {
  type: 'cul'
  /** 品种数量 */
  cultivarCount: number
}

/** 物种文件格式元数据 */
export interface SpeciesFileFormat {
  type: 'spe'
  /** 物种名称 */
  speciesName: string
}

/** 生态型文件格式元数据 */
export interface EcotypeFileFormat {
  type: 'eco'
  /** 生态型数量 */
  ecotypeCount: number
}

/** 文件格式联合类型 */
export type FileFormat =
  | WeatherFileFormat
  | SoilFileFormat
  | CultivarFileFormat
  | SpeciesFileFormat
  | EcotypeFileFormat

// ============ 解析结果映射类型 ============

/** 各文件类型对应的解析结果数据类型 */
export interface ParseResultMap {
  wth: WeatherStation
  sol: SoilProfile[]
  cul: CultivarParams[]
  spe: SpeciesParams
  eco: EcotypeParams[]
}
