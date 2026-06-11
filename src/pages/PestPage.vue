<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useConfigStore } from '@/stores/config'
import { useChart } from '@/composables/useChart'
import VChart from 'vue-echarts'

const simStore = useSimulationStore()
const configStore = useConfigStore()
const { riskIndexOption } = useChart()

/* 风险卡片数据 */
const pestRisks = [
  {
    emoji: '🍄',
    name: '灰霉病',
    topColor: '#8B5CF6',
    highRiskPeriod: '11月-1月',
    trigger: '低温高湿，相对湿度>85%',
  },
  {
    emoji: '🐛',
    name: '蚜虫',
    topColor: 'var(--accent-orange)',
    highRiskPeriod: '2月-3月',
    trigger: '气温回升，新梢萌发期',
  },
  {
    emoji: '🕷️',
    name: '红蜘蛛',
    topColor: 'var(--accent-green)',
    highRiskPeriod: '2月-3月',
    trigger: '干旱少雨，气温>20°C',
  },
  {
    emoji: '🦠',
    name: '白粉病',
    topColor: '#EC4899',
    highRiskPeriod: '1月-3月',
    trigger: '昼夜温差大，通风不良',
  },
]

/* 防治方案表格数据 */
const controlPlans = [
  { stage: '定植期', pest: '综合预防', measure: '种苗消毒，50%多菌灵800倍液浸根', method: '浸根', timing: '定植前1天' },
  { stage: '营养生长期', pest: '蚜虫', measure: '10%吡虫啉可湿性粉剂2000倍液', method: '喷雾', timing: '发现即治' },
  { stage: '花芽分化期', pest: '灰霉病', measure: '50%速克灵1500倍液', method: '喷雾', timing: '11月中旬预防' },
  { stage: '开花期', pest: '灰霉病', measure: '降低湿度，通风换气', method: '农艺措施', timing: '持续' },
  { stage: '结果期', pest: '红蜘蛛', measure: '1.8%阿维菌素3000倍液', method: '喷雾', timing: '2月初预防' },
  { stage: '采收期', pest: '白粉病', measure: '25%三唑酮1500倍液', method: '喷雾', timing: '发病初期' },
]

/* IPM核心原则 */
const ipmPrinciples = [
  {
    num: 1,
    title: '预防为主',
    desc: '优先采用农业防治和物理防治，创造不利于病虫害发生的环境条件',
  },
  {
    num: 2,
    title: '综合防治',
    desc: '协调运用农业、物理、生物和化学防治手段，减少单一依赖化学农药',
  },
  {
    num: 3,
    title: '精准施药',
    desc: '基于监测预警数据，在最佳防治窗口期精准施药，提高防治效果',
  },
  {
    num: 4,
    title: '安全间隔',
    desc: '严格遵守农药安全间隔期，确保采收时农药残留符合标准',
  },
]
</script>

<template>
  <div class="pest-page">
    <!-- 页面标题 -->
    <div style="margin-bottom: 24px">
      <h1 class="page-title">植保 IPM</h1>
      <p class="page-subtitle">基于物候期的综合病虫害防治方案 · 112天风险期</p>
    </div>

    <!-- 4个风险卡片 -->
    <div class="risk-cards-row">
      <div
        v-for="risk in pestRisks"
        :key="risk.name"
        class="risk-card"
      >
        <div class="risk-top" :style="{ backgroundColor: risk.topColor }"></div>
        <div class="risk-body">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px">
            <span style="font-size: 20px">{{ risk.emoji }}</span>
            <span style="font-size: 14px; font-weight: 600; color: var(--text-primary)">{{ risk.name }}</span>
          </div>
          <div style="margin-bottom: 6px">
            <span style="font-size: 11px; color: var(--text-muted)">高风险期：</span>
            <span style="font-size: 13px; color: var(--accent-orange); font-weight: 500">{{ risk.highRiskPeriod }}</span>
          </div>
          <div>
            <span style="font-size: 11px; color: var(--text-muted)">触发条件：</span>
            <span style="font-size: 12px; color: var(--text-secondary)">{{ risk.trigger }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 月度风险指数图表 -->
    <div class="section-block">
      <h2 class="section-title">月度风险指数</h2>
      <VChart :option="riskIndexOption" class="echarts-container" style="height: 320px" />
    </div>

    <!-- 防治方案表格 -->
    <div class="section-block">
      <h2 class="section-title">防治方案</h2>
      <div style="overflow-x: auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>生育阶段</th>
              <th>目标病虫害</th>
              <th>防治措施</th>
              <th>施药方式</th>
              <th>时机</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="plan in controlPlans" :key="plan.stage + plan.pest">
              <td>{{ plan.stage }}</td>
              <td>{{ plan.pest }}</td>
              <td>{{ plan.measure }}</td>
              <td>{{ plan.method }}</td>
              <td>{{ plan.timing }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- IPM核心原则 -->
    <div class="section-block">
      <h2 class="section-title">IPM 核心原则</h2>
      <div class="principles-grid">
        <div
          v-for="principle in ipmPrinciples"
          :key="principle.num"
          class="principle-item"
        >
          <div class="principle-num">{{ principle.num }}</div>
          <div class="principle-content">
            <div style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px">
              {{ principle.title }}
            </div>
            <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.6">
              {{ principle.desc }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pest-page {
  max-width: 1100px;
}

/* 风险卡片行 */
.risk-cards-row {
  display: flex;
  gap: 16px;
  margin-bottom: 28px;
}

.risk-card {
  flex: 1;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: all 0.2s;
}

.risk-card:hover {
  border-color: var(--border-light);
  box-shadow: var(--shadow);
}

.risk-top {
  height: 4px;
}

.risk-body {
  padding: 16px;
}

/* 区块 */
.section-block {
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 20px;
  margin-bottom: 20px;
}

/* IPM原则网格 */
.principles-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.principle-item {
  display: flex;
  gap: 14px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 10px;
  border: 1px solid var(--border-color);
}

.principle-num {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--highlight-bg);
  color: var(--accent-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.principle-content {
  flex: 1;
}
</style>
