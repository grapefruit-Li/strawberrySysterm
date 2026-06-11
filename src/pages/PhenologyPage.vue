<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'

const simStore = useSimulationStore()
const configStore = useConfigStore()

/* 月份标签 */
const months = ['9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月']

/* 定植日期显示 */
const plantingDateDisplay = computed(() => {
  return configStore.plantingDate || '9/30'
})

/* 是否有模拟数据 */
const hasData = computed(() => simStore.phenologyEvents.length > 0)

/* 格式化日期数字为 M/D 格式 */
function formatDateShort(dateNum: number): string {
  const s = String(dateNum)
  const month = parseInt(s.slice(4, 6))
  const day = parseInt(s.slice(6, 8))
  return `${month}/${day}`
}

/* 物候阶段数据 - 从模拟结果派生 */
const phenologyStages = computed(() => {
  if (!hasData.value) return []
  const stageEmojiMap: Record<string, { emoji: string; colorClass: string }> = {
    '萌芽期': { emoji: '🌱', colorClass: 'green' },
    '营养生长期': { emoji: '🌱', colorClass: 'green' },
    '花芽分化期': { emoji: '🌸', colorClass: 'pink' },
    '开花期': { emoji: '🌸', colorClass: 'pink' },
    '结果期': { emoji: '🍓', colorClass: 'orange' },
    '果实膨大期': { emoji: '🍓', colorClass: 'orange' },
    '采收期': { emoji: '📦', colorClass: 'purple' },
  }
  return simStore.phenologyEvents.map(e => {
    const meta = stageEmojiMap[e.name] ?? { emoji: '🌿', colorClass: 'green' }
    return {
      emoji: meta.emoji,
      name: e.name,
      days: `${e.duration}天`,
      dateRange: `${formatDateShort(e.startDate)} – ${formatDateShort(e.endDate)}`,
      colorClass: meta.colorClass,
    }
  })
})

/* 时间轴关键节点 - 从物候事件派生 */
const timelineNodes = computed(() => {
  if (!hasData.value) return []
  const circledNums = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩']
  return simStore.phenologyEvents.map((e, idx) => ({
    num: circledNums[idx] ?? `${idx + 1}`,
    name: e.name,
    date: formatDateShort(e.startDate),
  }))
})

/* 各物候阶段参数表格数据 - 从物候事件和模拟结果派生 */
const phenologyParams = computed(() => {
  if (!hasData.value) return []
  return simStore.phenologyEvents.map(e => {
    // 从模拟结果中获取该阶段的温度和日长数据
    const stageResults = simStore.results.filter(r => {
      const dateStr = r.date
      const dateNum = parseInt(dateStr.replace(/-/g, ''))
      return dateNum >= e.startDate && dateNum <= e.endDate
    })
    const avgTemp = stageResults.length > 0
      ? Math.round(stageResults.reduce((s, r) => s + (r.tmax + r.tmin) / 2, 0) / stageResults.length)
      : '—'
    // 日长估算（简化：根据月份估算）
    const startMonth = Math.floor((e.startDate % 10000) / 100)
    const dayLengthMap: Record<number, number> = {
      9: 12.2, 10: 11.4, 11: 10.8, 12: 10.4, 1: 10.5, 2: 11.0, 3: 11.8, 4: 12.8, 5: 13.5
    }
    const dayLength = dayLengthMap[startMonth] ?? '—'

    const emojiMap: Record<string, string> = {
      '萌芽期': '🌱', '营养生长期': '🌱', '花芽分化期': '🌸',
      '开花期': '🌸', '结果期': '🫧', '果实膨大期': '🍓', '采收期': '📦',
    }
    return {
      stage: `${emojiMap[e.name] ?? '🌿'} ${e.name}`,
      start: formatDateShort(e.startDate),
      end: formatDateShort(e.endDate),
      days: e.duration,
      avgTemp,
      dayLength,
    }
  })
})

/* 时间轴段宽度计算 */
const timelineSegments = computed(() => {
  if (!hasData.value) return []
  const totalDays = simStore.phenologyEvents.reduce((s, e) => s + e.duration, 0) || 1
  const colorMap: Record<string, string> = {
    '萌芽期': 'green', '营养生长期': 'green', '花芽分化期': 'yellow',
    '开花期': 'yellow', '结果期': 'red', '果实膨大期': 'red', '采收期': 'red',
  }
  const emojiMap: Record<string, string> = {
    '萌芽期': '🌱', '营养生长期': '🌱', '花芽分化期': '🌸',
    '开花期': '🌸', '结果期': '🍓', '果实膨大期': '🍓', '采收期': '📦',
  }
  return simStore.phenologyEvents.map(e => ({
    name: `${emojiMap[e.name] ?? ''} ${e.name} ${e.duration}天`,
    width: Math.round((e.duration / totalDays) * 100),
    colorClass: colorMap[e.name] ?? 'green',
  }))
})
</script>

<template>
  <div class="phenology-page">
    <div class="page-header">
      <h2 class="page-title">物候方案</h2>
      <p class="page-subtitle">基于积温模型 + 光周期响应预测的全年物候时间轴 · {{ plantingDateDisplay }}定植</p>
    </div>

    <!-- 无数据提示 -->
    <div v-if="!hasData" class="phenology-note">
      💡 尚无模拟数据，请先在基础信息页生成年度种植方案
    </div>

    <template v-else>
    <!-- 4个阶段卡片 flex一行 -->
    <div class="phenology-cards">
      <div
        v-for="stage in phenologyStages"
        :key="stage.name"
        class="phenology-card"
        :class="stage.colorClass"
      >
        <div class="phenology-label">{{ stage.emoji }} {{ stage.name }}</div>
        <div class="phenology-days">{{ stage.days }}</div>
        <div class="phenology-date">{{ stage.dateRange }}</div>
      </div>
    </div>

    <!-- 全生育期时间轴 section -->
    <div class="timeline-section">
      <h3 class="section-title">全生育期时间轴</h3>
      <div class="phenology-timeline">
        <div class="phenology-months">
          <span v-for="month in months" :key="month">{{ month }}</span>
        </div>
        <div class="phenology-bar">
          <div
            v-for="(seg, idx) in timelineSegments"
            :key="idx"
            class="phenology-segment"
            :class="seg.colorClass"
            :style="{ width: seg.width + '%' }"
          >{{ seg.name }}</div>
        </div>
      </div>
      <!-- 关键节点流程 -->
      <div class="key-nodes-flow">
        <template v-for="(node, idx) in timelineNodes" :key="node.num">
          <div class="key-node-flow-item">
            <span class="key-node-num">{{ node.num }}</span>
            <span class="key-node-name">{{ node.name }}</span>
            <span class="key-node-date">{{ node.date }}</span>
          </div>
          <span v-if="idx < timelineNodes.length - 1" class="key-node-arrow">→</span>
        </template>
      </div>
    </div>

    <!-- 各物候阶段参数表格 -->
    <div class="timeline-section">
      <h3 class="section-title">各物候阶段参数</h3>
      <div style="overflow-x: auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>阶段</th>
              <th>起</th>
              <th>止</th>
              <th>天数</th>
              <th>日均温°C</th>
              <th>日长hr</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in phenologyParams" :key="row.stage">
              <td>{{ row.stage }}</td>
              <td>{{ row.start }}</td>
              <td>{{ row.end }}</td>
              <td>{{ row.days }}</td>
              <td>{{ row.avgTemp }}</td>
              <td>{{ row.dayLength }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 底部提示 -->
    <div class="phenology-note">
      💡 {{ configStore.selectedCultivarFull?.name ?? configStore.cultivarName }} 为{{ configStore.cultivationMode === 'greenhouse' ? '温室' : '露地' }}栽培，{{ configStore.selectedCultivarFull?.type ?? '短日型' }}，日长&lt;11.5hr触发花芽分化
    </div>
    </template>
  </div>
</template>

<style scoped>
.phenology-page {
  max-width: 1100px;
}

.page-header {
  margin-bottom: 24px;
}

/* 4个阶段卡片 flex一行 */
.phenology-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 28px;
}

.phenology-card {
  flex: 1;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 20px;
  transition: all 0.2s;
  border-top: 4px solid transparent;
}

.phenology-card:hover {
  border-color: var(--border-light);
  box-shadow: var(--shadow);
}

.phenology-card.green { border-top-color: var(--accent-green); }
.phenology-card.pink { border-top-color: #EC4899; }
.phenology-card.orange { border-top-color: var(--accent-orange); }
.phenology-card.purple { border-top-color: #8B5CF6; }

.phenology-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.phenology-days {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.phenology-date {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 8px;
}

/* 时间轴区块 */
.timeline-section {
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 20px;
  margin-bottom: 20px;
}

.phenology-timeline {
  margin-bottom: 24px;
}

.phenology-months {
  display: flex;
  margin-bottom: 8px;
}

.phenology-months span {
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.phenology-bar {
  display: flex;
  border-radius: 6px;
  overflow: hidden;
  height: 28px;
}

.phenology-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
  font-weight: 500;
}

.phenology-segment.green { background-color: var(--accent-green); }
.phenology-segment.yellow { background-color: var(--accent-yellow); color: #333; }
.phenology-segment.red { background-color: var(--accent-red); }

/* 关键节点流程 */
.key-nodes-flow {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0;
}

.key-node-flow-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 70px;
}

.key-node-num {
  font-size: 14px;
  font-weight: 700;
  color: var(--accent-blue);
  margin-bottom: 4px;
}

.key-node-name {
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
}

.key-node-date {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.key-node-arrow {
  color: var(--text-muted);
  font-size: 16px;
  margin: 4px 4px 0;
  align-self: flex-start;
  line-height: 28px;
}

/* 底部提示 */
.phenology-note {
  background-color: rgba(234, 179, 8, 0.15);
  border: 1px solid rgba(234, 179, 8, 0.3);
  border-radius: 8px;
  padding: 14px 18px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 24px;
}
</style>
