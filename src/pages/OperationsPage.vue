<script setup lang="ts">
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'

const simStore = useSimulationStore()
const configStore = useConfigStore()

/* 参数卡片数据 */
const paramCards = [
  { icon: '💧', label: '灌溉方式', value: '膜下滴灌', note: '省肥·节水·高效' },
  { icon: '🧪', label: '建议施N量', value: '150-200 kg N/ha', note: '分6-12次施用' },
  { icon: '🎬', label: '覆膜', value: '黑膜', note: '提温+控草+降湿' },
  { icon: '🌱', label: '密度', value: '4.3 株/m²', note: '行距30cm 株距12cm' },
]

/* 月份标签 */
const months = ['9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月']

/* 操作卡片数据 */
const operationCards = [
  { period: '定植前9月初', stage: '整地起垄', stageClass: 'green', content: '深翻25-30cm，施有机肥2000kg+复合肥50kg，起垄宽60cm高25cm，沟宽30cm' },
  { period: '9/30', stage: '定植', stageClass: 'light-green', content: '双行种植，密度4.3株/m²，定植后浇透水20mm，遮阳网覆盖3-5天' },
  { period: '9/30-11/2', stage: '营养生长期', stageClass: 'light-green', content: '追施平衡肥，滴灌1次/天，叶面喷施0.2%磷酸二氢钾，及时摘除老叶' },
  { period: '10/23-11/2', stage: '花芽分化期', stageClass: 'yellow', content: '控温控湿促进花芽分化，悬挂黄板20块+蓝板10块/亩监测虫害' },
  { period: '11/2-11/20', stage: '开花坐果期', stageClass: 'yellow', content: '辅助授粉，喷施高钾肥，控制湿度60-70%，预防灰霉病' },
  { period: '11/20-1/3', stage: '第一茬果管理', stageClass: 'orange', content: '滴灌1-2次/天，疏果留2-3个/花序，重点防治灰霉病、红蜘蛛' },
  { period: '1/3-2/22', stage: '采收管理', stageClass: 'red', content: '早晨采收，果面80-90%着色，采后4°C预冷，及时补肥补水' },
  { period: '1/18-2/22', stage: '采收高峰-第二茬', stageClass: 'red', content: '产量最高期，需肥量大，重点防治红蜘蛛，保持充足水肥供应' },
  { period: '2/22', stage: '拉秧', stageClass: 'brown', content: '清洁田园，土壤消毒，设施维护保养，准备下一季生产' },
]

/* 灌溉施肥方案表格 */
const irrigationFertilizerPlans = [
  { month: '9月', stage: '定植-缓苗', irrigation: '5-8mm', frequency: '1次/天', npk: '20-20-20', amount: '5kg×2' },
  { month: '9月', stage: '营养生长', irrigation: '5-8mm', frequency: '1次/天', npk: '20-20-20', amount: '5kg×2' },
  { month: '10月', stage: '花芽分化-开花', irrigation: '4-6mm', frequency: '1次/天', npk: '10-30-20', amount: '8kg×2' },
  { month: '11月', stage: '第一茬果', irrigation: '6-8mm', frequency: '1-2次/天', npk: '15-15-30', amount: '8kg×3' },
  { month: '12月', stage: '采收高峰', irrigation: '6-10mm', frequency: '2次/天', npk: '16-8-32+Ca', amount: '8kg×4' },
  { month: '1月', stage: '采收后期', irrigation: '6-8mm', frequency: '1-2次/天', npk: '16-8-32+B', amount: '8kg×2' },
]
</script>

<template>
  <div class="operations-page">
    <div class="page-header">
      <h2 class="page-title">🚜 农事操作</h2>
      <p class="page-subtitle">161天方案 · 全生育期农事操作日历与执行标准</p>
    </div>

    <!-- 4个参数卡片 flex一行 -->
    <div class="operations-params">
      <div
        v-for="card in paramCards"
        :key="card.label"
        class="param-card"
      >
        <div class="param-icon">{{ card.icon }}</div>
        <div class="param-content">
          <div class="param-label">{{ card.label }}</div>
          <div class="param-value">{{ card.value }}</div>
          <div class="param-note">{{ card.note }}</div>
        </div>
      </div>
    </div>

    <!-- 时间轴 -->
    <div class="timeline-section">
      <h3 class="section-title">农事操作时间线</h3>
      <div class="ops-timeline">
        <div class="ops-timeline-bar">
          <div class="ops-segment green" style="width: 15%">整地</div>
          <div class="ops-segment light-green" style="width: 20%">营养管理</div>
          <div class="ops-segment yellow" style="width: 15%">促花</div>
          <div class="ops-segment orange" style="width: 20%">第一茬</div>
          <div class="ops-segment red" style="width: 20%">高峰</div>
          <div class="ops-segment brown" style="width: 10%">拉秧</div>
        </div>
        <div class="ops-timeline-months">
          <span v-for="month in months" :key="month">{{ month }}</span>
        </div>
      </div>
    </div>

    <!-- 操作卡片 5列grid -->
    <div class="operations-cards">
      <div
        v-for="card in operationCards"
        :key="card.stage"
        class="ops-card"
      >
        <div class="ops-card-header">
          <span class="ops-period">{{ card.period }}</span>
          <span class="ops-stage" :class="card.stageClass">{{ card.stage }}</span>
        </div>
        <div class="ops-card-content">{{ card.content }}</div>
      </div>
    </div>

    <!-- 灌溉施肥表格 -->
    <div class="timeline-section">
      <h3 class="section-title">灌溉施肥方案</h3>
      <div style="overflow-x: auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>月份</th>
              <th>阶段</th>
              <th>灌溉/天</th>
              <th>频率</th>
              <th>N-P₂O₅-K₂O</th>
              <th>用量/亩</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in irrigationFertilizerPlans" :key="row.month + row.stage">
              <td>{{ row.month }}</td>
              <td>{{ row.stage }}</td>
              <td>{{ row.irrigation }}</td>
              <td>{{ row.frequency }}</td>
              <td>{{ row.npk }}</td>
              <td>{{ row.amount }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.operations-page {
  max-width: 1100px;
}

.page-header {
  margin-bottom: 24px;
}

/* 4个参数卡片 flex一行 */
.operations-params {
  display: flex;
  gap: 16px;
  margin-bottom: 28px;
}

.param-card {
  flex: 1;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 20px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  transition: all 0.2s;
}

.param-card:hover {
  border-color: var(--border-light);
  box-shadow: var(--shadow);
}

.param-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.param-content {
  flex: 1;
}

.param-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.param-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.param-note {
  font-size: 11px;
  color: var(--text-muted);
}

/* 区块 */
.timeline-section {
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 20px;
  margin-bottom: 20px;
}

/* 时间轴 */
.ops-timeline {
  margin-bottom: 0;
}

.ops-timeline-bar {
  display: flex;
  border-radius: 6px;
  overflow: hidden;
  height: 28px;
  margin-bottom: 8px;
}

.ops-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
  font-weight: 500;
}

.ops-segment.green { background-color: var(--accent-green); }
.ops-segment.light-green { background-color: #4ade80; }
.ops-segment.yellow { background-color: var(--accent-yellow); color: #333; }
.ops-segment.orange { background-color: var(--accent-orange); }
.ops-segment.red { background-color: var(--accent-red); }
.ops-segment.brown { background-color: #78716c; }

.ops-timeline-months {
  display: flex;
}

.ops-timeline-months span {
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

/* 操作卡片 5列grid */
.operations-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.ops-card {
  background: var(--bg-card);
  border-radius: 10px;
  border: 1px solid var(--border-color);
  padding: 16px;
  transition: all 0.2s;
}

.ops-card:hover {
  border-color: var(--border-light);
  box-shadow: var(--shadow);
}

.ops-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.ops-period {
  font-size: 12px;
  color: var(--text-muted);
}

.ops-stage {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  color: white;
  white-space: nowrap;
}

.ops-stage.green { background-color: #22c55e; }
.ops-stage.light-green { background-color: #4ade80; }
.ops-stage.yellow { background-color: #eab308; color: #333; }
.ops-stage.orange { background-color: #f97316; }
.ops-stage.red { background-color: #ef4444; }
.ops-stage.brown { background-color: #78716c; }

.ops-card-content {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}
</style>
