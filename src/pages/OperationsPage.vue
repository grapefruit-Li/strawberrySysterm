<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'
import type { FarmOperation, OperationType, OperationPriority } from '@/engine/types'
import {
  Sprout,
  Droplets,
  Scissors,
  Bug,
  Cherry,
  CalendarCheck,
  Shield,
  AlertCircle,
  CheckCircle2,
  Clock,
  ListChecks,
  Info,
} from 'lucide-vue-next'

const simulation = useSimulationStore()
const config = useConfigStore()

/* 农事操作列表 */
const operations = computed<FarmOperation[]>(() => simulation.farmOperations)

/* 高优先级数 */
const highPriorityCount = computed(() =>
  operations.value.filter(o => o.priority === 'high').length
)

/* 摘要卡片 */
const summaryCards = computed(() => [
  { label: '操作总数', value: `${operations.value.length}项`, icon: CalendarCheck, color: 'text-strawberry-400' },
  { label: '高优先级数', value: `${highPriorityCount.value}项`, icon: AlertCircle, color: 'text-amber-400' },
  { label: '保护操作', value: `${operations.value.filter(o => o.type === 'pest_control').length}项`, icon: Shield, color: 'text-forest-400' },
])

/* 操作类型图标 */
function typeIcon(type: OperationType) {
  const map: Record<OperationType, any> = {
    irrigation: Droplets,
    fertilizer: Sprout,
    pruning: Scissors,
    pest_control: Bug,
    harvest: Cherry,
    planting: Sprout,
    monitoring: ListChecks,
  }
  return map[type] || ListChecks
}

/* 操作类型颜色 */
function typeColor(type: OperationType): string {
  const map: Record<OperationType, string> = {
    irrigation: '#3B82F6',
    fertilizer: '#2D6A4F',
    pruning: '#8B5CF6',
    pest_control: '#F59E0B',
    harvest: '#E63946',
    planting: '#4ADE80',
    monitoring: '#9CA3AF',
  }
  return map[type] || '#9CA3AF'
}

/* 操作类型中文名 */
function typeName(type: OperationType): string {
  const map: Record<OperationType, string> = {
    irrigation: '灌溉',
    fertilizer: '施肥',
    pruning: '修剪',
    pest_control: '植保',
    harvest: '采收',
    planting: '种植',
    monitoring: '监测',
  }
  return map[type] || type
}

/* 优先级样式 */
function priorityClass(priority: OperationPriority): string {
  const map: Record<OperationPriority, string> = {
    low: 'bg-midnight-600/50 text-midnight-300',
    medium: 'bg-blue-500/20 text-blue-400',
    high: 'bg-amber-500/20 text-amber-400',
    urgent: 'bg-red-500/20 text-red-400',
  }
  return map[priority]
}

/* 优先级中文名 */
function priorityName(priority: OperationPriority): string {
  const map: Record<OperationPriority, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  }
  return map[priority]
}

/* 按阶段分组操作 */
const groupedByStage = computed(() => {
  const groups = new Map<string, FarmOperation[]>()
  for (const op of operations.value) {
    /* relatedStage已是string */
    const stageStr = op.relatedStage
    if (!groups.has(stageStr)) {
      groups.set(stageStr, [])
    }
    groups.get(stageStr)!.push(op)
  }
  return [...groups.entries()]
})

/* 灌溉方案 */
const irrigationSchedule = computed(() =>
  operations.value.filter(o => o.type === 'irrigation')
)

/* 施肥方案 */
const fertilizationSchedule = computed(() =>
  operations.value.filter(o => o.type === 'fertilizer')
)
</script>

<template>
  <div class="space-y-6">
    <!-- 无数据提示 -->
    <div
      v-if="simulation.status === 'idle'"
      class="glass-card p-12 text-center"
    >
      <Sprout :size="48" class="mx-auto text-midnight-500 mb-4" />
      <h3 class="font-heading text-xl text-midnight-300 mb-2">尚未运行模拟</h3>
      <p class="text-midnight-500">请先在基础信息页面完成配置并生成方案</p>
    </div>

    <template v-else>
      <!-- 顶部摘要卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="card in summaryCards"
          :key="card.label"
          class="stat-card"
        >
          <div class="flex items-center gap-2 mb-1">
            <component :is="card.icon" :size="14" :class="card.color" />
            <span class="stat-label">{{ card.label }}</span>
          </div>
          <span class="stat-value text-lg">{{ card.value }}</span>
        </div>
      </div>

      <!-- 操作时间轴 + 侧面板 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 操作时间轴 -->
        <div class="lg:col-span-2 glass-card p-5">
          <h2 class="section-title">操作时间轴</h2>
          <div class="space-y-6">
            <div
              v-for="[stage, ops] in groupedByStage"
              :key="stage"
            >
              <!-- 阶段标题 -->
              <div class="flex items-center gap-2 mb-3">
                <span class="w-3 h-3 rounded-full bg-strawberry-500" />
                <h3 class="font-heading text-midnight-100">{{ stage }}</h3>
              </div>

              <!-- 操作卡片 -->
              <div class="ml-4 space-y-3 border-l-2 border-midnight-600/30 pl-4">
                <div
                  v-for="(op, idx) in ops"
                  :key="`${op.plannedDate}-${op.type}-${idx}`"
                  class="relative p-3 rounded-lg border transition-all duration-200 border-midnight-600/20 bg-midnight-800/40"
                >
                  <!-- 时间轴节点 -->
                  <span
                    class="absolute -left-[22px] top-4 w-3 h-3 rounded-full border-2 bg-midnight-800 border-midnight-500"
                  />

                  <!-- 操作头部 -->
                  <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-2">
                      <component
                        :is="typeIcon(op.type)"
                        :size="16"
                        :style="{ color: typeColor(op.type) }"
                      />
                      <span class="text-sm font-medium text-midnight-100">
                        {{ op.name }}
                      </span>
                    </div>
                    <span
                      class="text-xs px-2 py-0.5 rounded-full"
                      :class="priorityClass(op.priority)"
                    >
                      {{ priorityName(op.priority) }}
                    </span>
                  </div>

                  <!-- 操作详情 -->
                  <p class="text-xs text-midnight-400 mb-1">{{ op.description }}</p>
                  <div class="flex items-center gap-3 text-xs text-midnight-500">
                    <span class="flex items-center gap-1">
                      <CalendarCheck :size="12" />
                      {{ op.plannedDate }}
                    </span>
                    <span class="flex items-center gap-1">
                      <component :is="typeIcon(op.type)" :size="10" />
                      {{ typeName(op.type) }}
                    </span>
                  </div>

                  <!-- 操作参数 -->
                  <div
                    v-if="op.params && Object.keys(op.params).length > 0"
                    class="mt-2 flex flex-wrap gap-1"
                  >
                    <span
                      v-for="(val, key) in op.params"
                      :key="key"
                      class="text-xs px-2 py-0.5 rounded bg-midnight-700/50 text-midnight-300"
                    >
                      {{ key }}: {{ val }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 无操作 -->
            <div
              v-if="operations.length === 0"
              class="text-center py-8 text-midnight-500 text-sm"
            >
              暂无农事操作建议
            </div>
          </div>
        </div>

        <!-- 侧面板 -->
        <div class="space-y-6">
          <!-- 当前阶段操作速览 -->
          <div class="glass-card p-5">
            <h2 class="section-title flex items-center gap-2">
              <Info :size="18" class="text-blue-400" />
              操作速览
            </h2>
            <div class="space-y-2">
              <div
                v-for="(op, idx) in operations.slice(0, 5)"
                :key="'quick-' + idx"
                class="flex items-center gap-2 p-2 rounded bg-midnight-800/40"
              >
                <component
                  :is="typeIcon(op.type)"
                  :size="14"
                  :style="{ color: typeColor(op.type) }"
                />
                <span class="text-xs text-midnight-200 flex-1">{{ op.name }}</span>
                <span
                  class="text-xs px-1.5 py-0.5 rounded"
                  :class="priorityClass(op.priority)"
                >
                  {{ priorityName(op.priority) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 灌溉方案 -->
          <div class="glass-card p-5">
            <h2 class="section-title flex items-center gap-2">
              <Droplets :size="18" class="text-blue-400" />
              灌溉方案
            </h2>
            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="border-b border-midnight-600/30">
                    <th class="text-left py-2 text-midnight-400 font-medium">日期</th>
                    <th class="text-left py-2 text-midnight-400 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(irr, idx) in irrigationSchedule"
                    :key="idx"
                    class="border-b border-midnight-600/10"
                  >
                    <td class="py-1.5 text-midnight-200">{{ irr.plannedDate }}</td>
                    <td class="py-1.5 text-midnight-200">{{ irr.name }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 施肥方案 -->
          <div class="glass-card p-5">
            <h2 class="section-title flex items-center gap-2">
              <Sprout :size="18" class="text-forest-400" />
              施肥方案
            </h2>
            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="border-b border-midnight-600/30">
                    <th class="text-left py-2 text-midnight-400 font-medium">日期</th>
                    <th class="text-left py-2 text-midnight-400 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(fert, idx) in fertilizationSchedule"
                    :key="idx"
                    class="border-b border-midnight-600/10"
                  >
                    <td class="py-1.5 text-midnight-200">{{ fert.plannedDate }}</td>
                    <td class="py-1.5 text-midnight-200">{{ fert.name }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
