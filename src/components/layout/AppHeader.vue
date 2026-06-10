<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { Activity, RotateCcw, Zap } from 'lucide-vue-next'
import type { SimulationStatus } from '@/stores/simulation'

const simulation = useSimulationStore()

/* 状态指示器配置 */
const statusConfig: Record<SimulationStatus, { label: string; color: string; pulse: boolean }> = {
  idle: { label: '空闲', color: 'bg-midnight-500', pulse: false },
  running: { label: '运行中', color: 'bg-forest-500', pulse: true },
  paused: { label: '已暂停', color: 'bg-amber-500', pulse: false },
  complete: { label: '已完成', color: 'bg-strawberry-500', pulse: false },
}

const currentStatus = computed(() => statusConfig[simulation.status])
</script>

<template>
  <header class="h-16 flex items-center justify-between px-6 border-b border-midnight-600/30 bg-midnight-800/60 backdrop-blur-md shrink-0">
    <!-- 左侧标题 -->
    <div class="flex items-center gap-3">
      <h1 class="font-heading text-xl text-midnight-50">草莓作物模拟系统</h1>
    </div>

    <!-- 右侧状态和操作 -->
    <div class="flex items-center gap-4">
      <!-- 模拟状态指示器 -->
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-midnight-700/50">
        <span
          class="w-2.5 h-2.5 rounded-full"
          :class="[currentStatus.color, currentStatus.pulse ? 'animate-pulse' : '']"
        />
        <span class="text-xs text-midnight-300">{{ currentStatus.label }}</span>
      </div>

      <!-- 快速操作按钮 -->
      <button
        v-if="simulation.status === 'idle' || simulation.status === 'complete'"
        class="ghost-btn flex items-center gap-1.5 text-sm"
        @click="simulation.startSimulation()"
      >
        <Zap :size="14" />
        <span>快速模拟</span>
      </button>

      <button
        v-if="simulation.status !== 'idle'"
        class="ghost-btn flex items-center gap-1.5 text-sm"
        @click="simulation.resetSimulation()"
      >
        <RotateCcw :size="14" />
        <span>重置</span>
      </button>
    </div>
  </header>
</template>
