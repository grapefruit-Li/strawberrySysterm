<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'

const simStore = useSimulationStore()
const configStore = useConfigStore()

/* 参数卡片数据 */
const paramCards = [
  { emoji: '💧', label: '灌溉方式', value: '滴灌', note: '节水30%，推荐方式' },
  { emoji: '🧪', label: '建议施N量', value: '180 kg/ha', note: '分3次施用' },
  { emoji: '🎬', label: '覆膜', value: '黑膜', note: '抑草+保温' },
  { emoji: '🌱', label: '密度', value: '4.5 株/m²', note: '推荐4.0-5.0' },
]

/* 月份标签 */
const months = ['10月', '11月', '12月', '1月', '2月', '3月']

/* 操作卡片数据 */
const operationCards = [
  {
    period: '定植期',
    stage: '整地',
    stageClass: 'green',
    items: ['土壤消毒（太阳能消毒7-10天）', '施基肥（有机肥3000kg/ha）', '起垄做畦（畦宽60cm）', '铺设滴灌带和黑膜'],
  },
  {
    period: '定植期',
    stage: '定植',
    stageClass: 'green',
    items: ['选择健壮无病苗', '定植深度适中（心不埋土）', '浇足定植水', '遮阳网覆盖3-5天'],
  },
  {
    period: '营养生长期',
    stage: '营养管理',
    stageClass: 'light-green',
    items: ['追施氮肥（尿素15kg/ha）', '滴灌保持土壤湿润', '摘除老叶和病叶', '中耕除草'],
  },
  {
    period: '花芽分化期',
    stage: '促花',
    stageClass: 'yellow',
    items: ['控氮增磷钾', '叶面喷施0.3%磷酸二氢钾', '适当控水促花芽分化', '摘除匍匐茎'],
  },
  {
    period: '开花结果期',
    stage: '第一茬',
    stageClass: 'orange',
    items: ['放蜂授粉或人工辅助授粉', '追施钾肥促果膨大', '疏花疏果（每株留5-6果）', '温湿度调控防灰霉'],
  },
  {
    period: '采收期',
    stage: '高峰管理',
    stageClass: 'red',
    items: ['及时采收（8成熟）', '追施平衡肥恢复树势', '加强病虫害监测', '保持土壤水分均匀'],
  },
  {
    period: '采收期',
    stage: '持续采收',
    stageClass: 'red',
    items: ['每2-3天采收一次', '分级包装', '追肥补充营养', '清除病果烂果'],
  },
  {
    period: '采收后期',
    stage: '二茬管理',
    stageClass: 'orange',
    items: ['修剪整理植株', '追施促花肥', '病虫害综合防治', '水分管理'],
  },
  {
    period: '拉秧期',
    stage: '拉秧',
    stageClass: 'brown',
    items: ['清除残株和地膜', '土壤深翻晒垡', '记录全年数据', '制定下季计划'],
  },
]

/* 灌溉施肥方案表格 */
const irrigationFertilizerPlans = [
  { stage: '定植期', irrigation: '25mm/次，3次/周', fertilizer: '基肥：有机肥3000kg/ha', n: '60', p: '60', k: '60' },
  { stage: '营养生长期', irrigation: '15mm/次，2次/周', fertilizer: '追肥：尿素15kg/ha', n: '45', p: '0', k: '0' },
  { stage: '花芽分化期', irrigation: '10mm/次，1次/周', fertilizer: '叶面：0.3%KH₂PO₄', n: '0', p: '30', k: '30' },
  { stage: '开花坐果期', irrigation: '15mm/次，2次/周', fertilizer: '追肥：KNO₃ 20kg/ha', n: '15', p: '0', k: '45' },
  { stage: '果实膨大期', irrigation: '20mm/次，2次/周', fertilizer: '追肥：复合肥25kg/ha', n: '30', p: '30', k: '30' },
  { stage: '采收期', irrigation: '15mm/次，2次/周', fertilizer: '追肥：平衡肥15kg/ha', n: '15', p: '15', k: '15' },
]
</script>

<template>
  <div class="operations-page">
    <!-- 页面标题 -->
    <div style="margin-bottom: 24px">
      <h1 class="page-title">🚜 农事操作</h1>
      <p class="page-subtitle">161天方案 · 全生育期农事操作日历与执行标准</p>
    </div>

    <!-- 4个参数卡片 -->
    <div class="param-cards-row">
      <div
        v-for="card in paramCards"
        :key="card.label"
        class="param-card"
      >
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px">
          <span style="font-size: 20px">{{ card.emoji }}</span>
          <span style="font-size: 13px; color: var(--text-secondary)">{{ card.label }}</span>
        </div>
        <div style="font-size: 20px; font-weight: 700; color: var(--text-primary)">{{ card.value }}</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px">{{ card.note }}</div>
      </div>
    </div>

    <!-- 时间轴 -->
    <div class="section-block">
      <h2 class="section-title">全生育期时间轴</h2>

      <!-- 彩色进度条 -->
      <div class="timeline-bar">
        <div class="timeline-segment green" style="width: 15%">整地</div>
        <div class="timeline-segment light-green" style="width: 20%">营养管理</div>
        <div class="timeline-segment yellow" style="width: 15%">促花</div>
        <div class="timeline-segment orange" style="width: 20%">第一茬</div>
        <div class="timeline-segment red" style="width: 20%">高峰</div>
        <div class="timeline-segment brown" style="width: 10%">拉秧</div>
      </div>

      <!-- 月份标签行 -->
      <div class="month-labels">
        <div v-for="month in months" :key="month" class="month-label">{{ month }}</div>
      </div>
    </div>

    <!-- 操作卡片网格 -->
    <div class="section-block">
      <h2 class="section-title">操作详情</h2>
      <div class="ops-grid">
        <div
          v-for="card in operationCards"
          :key="card.stage"
          class="op-card"
        >
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px">
            <span class="stage-tag" :class="card.stageClass">{{ card.stage }}</span>
            <span style="font-size: 12px; color: var(--text-muted)">{{ card.period }}</span>
          </div>
          <ul class="op-list">
            <li v-for="(item, idx) in card.items" :key="idx">{{ item }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 灌溉施肥方案表格 -->
    <div class="section-block">
      <h2 class="section-title">灌溉施肥方案</h2>
      <div style="overflow-x: auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>生育阶段</th>
              <th>灌溉方案</th>
              <th>施肥方案</th>
              <th>N (kg/ha)</th>
              <th>P (kg/ha)</th>
              <th>K (kg/ha)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in irrigationFertilizerPlans" :key="row.stage">
              <td>{{ row.stage }}</td>
              <td>{{ row.irrigation }}</td>
              <td>{{ row.fertilizer }}</td>
              <td>{{ row.n }}</td>
              <td>{{ row.p }}</td>
              <td>{{ row.k }}</td>
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

/* 参数卡片行 */
.param-cards-row {
  display: flex;
  gap: 16px;
  margin-bottom: 28px;
}

.param-card {
  flex: 1;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 16px;
  transition: all 0.2s;
}

.param-card:hover {
  border-color: var(--border-light);
  box-shadow: var(--shadow);
}

/* 区块 */
.section-block {
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 20px;
  margin-bottom: 20px;
}

/* 时间轴进度条 */
.timeline-bar {
  display: flex;
  border-radius: 6px;
  overflow: hidden;
  height: 28px;
  margin-bottom: 8px;
}

/* 月份标签行 */
.month-labels {
  display: flex;
}

.month-label {
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

/* 操作卡片网格 */
.ops-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.op-card {
  background: var(--bg-secondary);
  border-radius: 10px;
  border: 1px solid var(--border-color);
  padding: 14px;
  transition: all 0.2s;
}

.op-card:hover {
  border-color: var(--border-light);
}

.op-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.op-list li {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 0;
  line-height: 1.5;
  position: relative;
  padding-left: 12px;
}

.op-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--text-muted);
}
</style>
