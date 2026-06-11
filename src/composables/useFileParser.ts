import { ref } from 'vue'

/* 解析后的文件数据 */
export interface ParsedFile {
  name: string
  type: 'WTH' | 'SOL' | 'CUL' | 'SPE' | 'ECO' | 'JSON' | 'XLSX' | 'XLS' | 'CLI' | 'unknown'
  content: string
  lines: string[]
  parsed: boolean
  error?: string
}

/* 文件解析组合式函数 */
export function useFileParser() {
  const files = ref<ParsedFile[]>([])
  const isDragging = ref(false)

  /* 判断文件类型 */
  function getFileType(filename: string): ParsedFile['type'] {
    const ext = filename.split('.').pop()?.toUpperCase() || ''
    if (['WTH', 'SOL', 'CUL', 'SPE', 'ECO', 'JSON', 'XLSX', 'XLS', 'CLI'].includes(ext)) {
      return ext as ParsedFile['type']
    }
    return 'unknown'
  }

  /* 解析单个文件 */
  function parseFile(file: File): Promise<ParsedFile> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        const lines = content.split(/\r?\n/).filter(l => l.trim())
        const fileType = getFileType(file.name)

        const result: ParsedFile = {
          name: file.name,
          type: fileType,
          content,
          lines,
          parsed: fileType !== 'unknown',
        }

        if (fileType === 'unknown') {
          result.error = '不支持的文件格式'
        }

        resolve(result)
      }
      reader.onerror = () => {
        resolve({
          name: file.name,
          type: 'unknown',
          content: '',
          lines: [],
          parsed: false,
          error: '文件读取失败',
        })
      }
      reader.readAsText(file)
    })
  }

  /* 处理文件列表 */
  async function handleFiles(fileList: FileList | File[]) {
    const newFiles = Array.from(fileList)
    for (const file of newFiles) {
      const parsed = await parseFile(file)
      files.value.push(parsed)
    }
  }

  /* 处理拖放 */
  function handleDrop(event: DragEvent) {
    isDragging.value = false
    if (event.dataTransfer?.files) {
      handleFiles(event.dataTransfer.files)
    }
  }

  /* 处理文件选择 */
  function handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files) {
      handleFiles(input.files)
    }
  }

  /* 移除文件 */
  function removeFile(index: number) {
    files.value.splice(index, 1)
  }

  /* 清空文件 */
  function clearFiles() {
    files.value = []
  }

  /* 导出配置为 JSON */
  function exportConfig(data: object, filename: string = 'strawsim-config.json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  /* 导出数据为 CSV */
  function exportCSV(headers: string[], rows: string[][], filename: string = 'strawsim-data.csv') {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    files,
    isDragging,
    handleDrop,
    handleFileInput,
    handleFiles,
    removeFile,
    clearFiles,
    exportConfig,
    exportCSV,
  }
}
