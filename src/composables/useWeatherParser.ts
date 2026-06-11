import * as XLSX from 'xlsx'
import type { WeatherRecord } from '@/stores/config'

/**
 * 共享气象文件解析器
 * 支持 .WTH (DSSAT格式) 和 .xlsx/.xls (Excel格式)
 */

/** 解析 DSSAT .WTH 文件内容为 WeatherRecord[] */
export function parseWTHContent(content: string): WeatherRecord[] {
  // Same logic as the inline parser in DataPage.vue and BasicInfoPage.vue
  // Copy the implementation from DataPage.vue's parseWTHContent function
  const lines = content.split(/\r?\n/).filter(l => l.trim())
  const records: WeatherRecord[] = []
  let headerLineIdx = -1
  let headerCols: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (trimmed.startsWith('@') && trimmed.toUpperCase().includes('DATE')) {
      headerLineIdx = i
      headerCols = trimmed.substring(1).trim().split(/\s+/).map(c => c.toUpperCase())
      break
    }
  }
  if (headerLineIdx < 0) return records
  const colIdx: Record<string, number> = {}
  headerCols.forEach((col, idx) => { colIdx[col] = idx })
  for (let i = headerLineIdx + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (!trimmed || trimmed.startsWith('*') || trimmed.startsWith('@') || trimmed.startsWith('!')) continue
    const parts = trimmed.split(/\s+/)
    if (parts.length < 3) continue
    const dateVal = parts[colIdx['DATE'] ?? 0]
    if (!dateVal) continue
    let year: number, month: number, day: number
    const dateNum = parseInt(dateVal, 10)
    if (dateVal.length <= 5) {
      const yy = Math.floor(dateNum / 1000)
      year = yy >= 50 ? 1900 + yy : 2000 + yy
      const doy = dateNum % 1000
      const d = new Date(year, 0, doy)
      month = d.getMonth() + 1
      day = d.getDate()
    } else {
      year = Math.floor(dateNum / 1000)
      const doy = dateNum % 1000
      const d = new Date(year, 0, doy)
      month = d.getMonth() + 1
      day = d.getDate()
    }
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const srad = colIdx['SRAD'] !== undefined ? parseFloat(parts[colIdx['SRAD']]) || 0 : 0
    const tmax = colIdx['TMAX'] !== undefined ? parseFloat(parts[colIdx['TMAX']]) || 0 : 0
    const tmin = colIdx['TMIN'] !== undefined ? parseFloat(parts[colIdx['TMIN']]) || 0 : 0
    const rain = colIdx['RAIN'] !== undefined ? parseFloat(parts[colIdx['RAIN']]) || 0 : 0
    records.push({ date: dateStr, srad, tmax, tmin, rain, co2: 410 })
  }
  return records
}

/** 解析 Excel 文件 (.xlsx/.xls) 为 WeatherRecord[] */
export function parseExcelWeather(arrayBuffer: ArrayBuffer): WeatherRecord[] {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!firstSheet) return []

  // Convert to JSON array - header row becomes keys
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet)
  if (rows.length === 0) return []

  const records: WeatherRecord[] = []
  for (const row of rows) {
    // Support various column name formats (Chinese or English)
    const date = row['日期'] || row['date'] || row['DATE'] || row['Date'] || ''
    const srad = Number(row['太阳辐射(MJ/m²)'] || row['辐射(MJ/m²)'] || row['srad'] || row['SRAD'] || row['Srad'] || 0)
    const tmax = Number(row['最高温(℃)'] || row['最高温(°C)'] || row['tmax'] || row['TMAX'] || row['Tmax'] || 0)
    const tmin = Number(row['最低温(℃)'] || row['最低温(°C)'] || row['tmin'] || row['TMIN'] || row['Tmin'] || 0)
    const rain = Number(row['降水量(mm)'] || row['降水(mm)'] || row['rain'] || row['RAIN'] || row['Rain'] || 0)

    if (!date) continue

    // Parse date - support YYYY-MM-DD, YYYY/MM/DD, YYYYMMDD, Excel date number
    let dateStr = ''
    if (typeof date === 'number') {
      // Excel serial date number
      const d = XLSX.SSF.parse_date_code(date)
      if (d) {
        dateStr = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
      }
    } else {
      const dateStr_raw = String(date).trim()
      // Try YYYY-MM-DD or YYYY/MM/DD
      const match = dateStr_raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
      if (match) {
        dateStr = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
      } else {
        // Try YYYYMMDD
        const match2 = dateStr_raw.match(/^(\d{4})(\d{2})(\d{2})$/)
        if (match2) {
          dateStr = `${match2[1]}-${match2[2]}-${match2[3]}`
        }
      }
    }

    if (!dateStr) continue

    records.push({ date: dateStr, srad, tmax, tmin, rain, co2: 410 })
  }

  return records
}

/** 生成 Excel 气象数据模板并下载 */
export function downloadWeatherTemplate() {
  // Create template with sample data
  const headers = ['日期', '太阳辐射(MJ/m²)', '最高温(℃)', '最低温(℃)', '降水量(mm)']
  const sampleData = [
    ['2025-09-01', 18.5, 28.3, 18.5, 2.1],
    ['2025-09-02', 19.2, 29.1, 19.0, 0.0],
    ['2025-09-03', 17.8, 27.5, 17.8, 5.3],
    ['2025-09-04', 16.5, 26.0, 16.2, 12.5],
    ['2025-09-05', 20.1, 30.2, 20.0, 0.0],
    // ... add more sample rows to show the pattern
    ['2025-09-06', 19.5, 29.5, 19.2, 0.5],
    ['2025-09-07', 18.0, 27.8, 17.5, 3.2],
  ]

  const wsData = [headers, ...sampleData]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Set column widths
  ws['!cols'] = [
    { wch: 12 },  // 日期
    { wch: 18 },  // 太阳辐射
    { wch: 12 },  // 最高温
    { wch: 12 },  // 最低温
    { wch: 12 },  // 降水量
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '气象数据')

  // Add a readme sheet
  const readmeData = [
    ['草莓决策支持系统 - 气象数据模板说明'],
    [''],
    ['列名说明：'],
    ['日期', '格式：YYYY-MM-DD，如 2025-09-01'],
    ['太阳辐射(MJ/m²)', '日太阳辐射总量，单位 MJ/m²，典型范围 5-30'],
    ['最高温(℃)', '日最高气温，单位 ℃'],
    ['最低温(℃)', '日最低气温，单位 ℃'],
    ['降水量(mm)', '日降水量，单位 mm'],
    [''],
    ['注意事项：'],
    ['1. 日期列必填，格式为 YYYY-MM-DD'],
    ['2. 数据按日期升序排列'],
    ['3. 建议提供至少90天的连续气象数据'],
    ['4. 太阳辐射如缺失可填0，系统将根据纬度和日期估算'],
    ['5. 请删除示例数据后填入实际观测数据'],
    ['6. 也支持英文列名：date, srad, tmax, tmin, rain'],
  ]
  const readmeWs = XLSX.utils.aoa_to_sheet(readmeData)
  readmeWs['!cols'] = [{ wch: 20 }, { wch: 60 }]
  XLSX.utils.book_append_sheet(wb, readmeWs, '填写说明')

  XLSX.writeFile(wb, '草莓气象数据模板.xlsx')
}

/** 读取文件为文本 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string || '')
    reader.onerror = () => resolve('')
    reader.readAsText(file)
  })
}

/** 读取文件为 ArrayBuffer */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer || new ArrayBuffer(0))
    reader.onerror = () => resolve(new ArrayBuffer(0))
    reader.readAsArrayBuffer(file)
  })
}

/** 解析气象文件（自动识别格式） */
export async function parseWeatherFile(file: File): Promise<{ records: WeatherRecord[]; error?: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''

  if (ext === 'wth' || ext === 'cli') {
    const content = await readFileAsText(file)
    const records = parseWTHContent(content)
    if (records.length === 0) {
      return { records: [], error: '未找到有效的气象数据行，请检查文件格式' }
    }
    return { records }
  } else if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await readFileAsArrayBuffer(file)
    const records = parseExcelWeather(buffer)
    if (records.length === 0) {
      return { records: [], error: '未找到有效的气象数据行，请检查列名是否正确' }
    }
    return { records }
  } else {
    return { records: [], error: `不支持的文件格式: .${ext}，请使用 .WTH 或 .xlsx 文件` }
  }
}
