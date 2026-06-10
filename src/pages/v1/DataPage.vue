<script setup lang="ts">
import { ref } from 'vue'
import { useFileParser } from '@/composables/useFileParser'
import { useConfigStore } from '@/stores/config'
import {
  Upload,
  FileText,
  Trash2,
  Download,
  FolderOpen,
  Clock,
  X,
} from 'lucide-vue-next'

const { files, isDragging, handleDrop, handleFileInput, removeFile, clearFiles, exportConfig } = useFileParser()
const config = useConfigStore()

/* 模拟历史记录（示例数据） */
const history = ref([
  { id: '1', name: '红颜-南京-2025春', date: '2025-03-15 14:30', status: '已完成', days: 180 },
  { id: '2', name: '章姬-杭州-2025春', date: '2025-03-10 09:15', status: '已完成', days: 180 },
  { id: '3', name: '甜查理-青岛-2024秋', date: '2024-09-20 16:45', status: '已完成', days: 200 },
])

/* 支持的文件类型 */
const acceptedTypes = '.WTH,.wth,.SOL,.sol,.CUL,.cul,.SPE,.spe,.ECO,.eco'

/* 文件类型颜色 */
function fileTypeColor(type: string): string {
  const map: Record<string, string> = {
    WTH: 'text-cyan-400 bg-cyan-500/20',
    SOL: 'text-amber-400 bg-amber-500/20',
    CUL: 'text-strawberry-400 bg-strawberry-500/20',
    SPE: 'text-purple-400 bg-purple-500/20',
    ECO: 'text-forest-400 bg-forest-500/20',
  }
  return map[type] || 'text-midnight-300 bg-midnight-700/30'
}

/* 导出当前配置 */
function handleExportConfig() {
  exportConfig({
    station: {
      name: config.stationName,
      lat: config.stationLat,
      lon: config.stationLon,
      elev: config.stationElev,
    },
    soil: {
      name: config.soilName,
      layers: config.soilLayers,
    },
    cultivar: {
      name: config.cultivarName,
      params: config.cultivarParams,
    },
    management: {
      plantingDate: config.plantingDate,
      density: config.plantingDensity,
      irrigation: config.irrigationEvents,
      fertilizer: config.fertilizerEvents,
    },
  }, 'strawsim-config.json')
}
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <h2 class="section-title">数据管理</h2>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 文件上传区域 -->
      <div class="space-y-4">
        <div class="glass-card p-5">
          <h3 class="text-sm font-semibold text-midnight-200 mb-4 flex items-center gap-2">
            <Upload :size="16" />
            文件导入
          </h3>

          <!-- 拖放区域 -->
          <div
            class="drop-zone"
            :class="isDragging ? 'drop-zone-active' : ''"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @click="($refs.fileInput as HTMLInputElement)?.click()"
          >
            <FolderOpen :size="32" class="mx-auto mb-2 text-midnight-400" />
            <p class="text-sm text-midnight-300">拖放文件到此处，或点击选择</p>
            <p class="text-xs text-midnight-400 mt-1">
              支持 .WTH .SOL .CUL .SPE .ECO 格式
            </p>
            <input
              ref="fileInput"
              type="file"
              :accept="acceptedTypes"
              multiple
              class="hidden"
              @change="handleFileInput"
            />
          </div>
        </div>

        <!-- 已上传文件列表 -->
        <div v-if="files.length > 0" class="glass-card p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-midnight-200 flex items-center gap-2">
              <FileText :size="16" />
              已导入文件 ({{ files.length }})
            </h3>
            <button class="text-xs text-midnight-400 hover:text-strawberry-500 transition-colors" @click="clearFiles">
              清空
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="(file, idx) in files"
              :key="idx"
              class="flex items-center gap-3 p-3 rounded-lg bg-midnight-700/30"
            >
              <span
                class="text-xs font-mono px-2 py-0.5 rounded"
                :class="fileTypeColor(file.type)"
              >
                {{ file.type }}
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-midnight-200 truncate">{{ file.name }}</p>
                <p class="text-xs text-midnight-400">{{ file.lines.length }} 行</p>
              </div>
              <span v-if="file.error" class="text-xs text-strawberry-400">{{ file.error }}</span>
              <span v-else class="text-xs text-forest-400">✓</span>
              <button
                class="text-midnight-400 hover:text-strawberry-500 transition-colors"
                @click="removeFile(idx)"
              >
                <X :size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧面板 -->
      <div class="space-y-4">
        <!-- 导出配置 -->
        <div class="glass-card p-5">
          <h3 class="text-sm font-semibold text-midnight-200 mb-4 flex items-center gap-2">
            <Download :size="16" />
            数据导出
          </h3>
          <p class="text-sm text-midnight-400 mb-4">导出当前模拟配置为 JSON 文件，方便保存和分享。</p>
          <button class="strawberry-btn flex items-center gap-2" @click="handleExportConfig">
            <Download :size="14" />
            导出当前配置
          </button>
        </div>

        <!-- 模拟历史 -->
        <div class="glass-card p-5">
          <h3 class="text-sm font-semibold text-midnight-200 mb-4 flex items-center gap-2">
            <Clock :size="16" />
            模拟历史
          </h3>
          <div class="space-y-2">
            <div
              v-for="record in history"
              :key="record.id"
              class="flex items-center gap-3 p-3 rounded-lg bg-midnight-700/30 hover:bg-midnight-700/50 transition-colors cursor-pointer"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm text-midnight-200 truncate">{{ record.name }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-midnight-400">{{ record.date }}</span>
                  <span class="text-xs px-1.5 py-0.5 rounded bg-forest-500/20 text-forest-300">
                    {{ record.status }}
                  </span>
                </div>
              </div>
              <span class="text-xs text-midnight-400">{{ record.days }}天</span>
            </div>
          </div>
          <p v-if="history.length === 0" class="text-sm text-midnight-400 text-center py-4">
            暂无历史记录
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
