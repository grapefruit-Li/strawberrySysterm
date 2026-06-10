<script setup lang="ts">
import { ref, computed } from 'vue'
import { BookOpen, X } from 'lucide-vue-next'

const props = defineProps<{
  version: 'v1' | 'v2'
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const isVisible = ref(true)

function close() {
  isVisible.value = false
  setTimeout(() => emit('close'), 300)
}

const v1Manual = `# V1 使用手册

## 概述
版本一（模拟器模式）是基础的 DSSAT 草莓生长模拟工具，适合快速查看单点模拟结果。

## 页面功能

### 参数配置页
- 气象配置：选择区域气候预设或自定义逐日气象数据
- 土壤配置：设置土壤层数、深度、容重、田间持水量等参数
- 品种选择：从内置品种库中选择草莓品种
- 管理配置：设置灌溉、施肥、定植密度等

### 模拟运行页
- 启动模拟：点击开始模拟运行完整生命周期模拟
- 步进模式：逐日查看模拟过程，可暂停/继续
- 仪表盘：实时显示当前日期的 LAI、生物量、产量、水分胁迫等关键指标

### 结果分析页
- 逐日曲线：LAI、生物量、产量等参数的时间序列图
- 收获数据：各次采收的鲜果产量、干重、SSC、硬度等
- 水氮平衡：土壤水分、氮素动态变化
- 产量分布：产量按阶段的分布统计

## 操作步骤
1. 进入参数配置页，完成气象、土壤、品种、管理配置
2. 切换到模拟运行页，点击开始模拟
3. 查看仪表盘实时数据
4. 切换到结果分析页，查看详细图表和数据
5. 可导出结果为 CSV 或 JSON 格式`

const v2Manual = `# V2 使用手册

## 概述
版本二（决策引擎模式）是链式决策系统，将物候、产量、病虫害、农事操作串联，提供从预测到行动的完整闭环。

## 页面功能

### 1. 基础信息
选择品种、区域和定植配置，启动链式决策引擎。
- 品种选择：搜索框、类型筛选（短日型/日中性）、品种卡片网格（显示单果重、糖度、硬度、需冷量、营养积温等参数）
- 种植区域：区域卡片（显示年均温、年降雨、生长季、纬度）
- 定植配置：定植日期、种植密度、配置预览
- 生成方案：点击后运行链式模拟，自动跳转到物候方案页

### 2. 物候方案
展示物候发育预测和关键时间节点。
- 摘要卡片：当前GDD、当前阶段、距下阶段天数、预计采收开始
- 甘特图时间轴：水平条形图，展示各物候阶段的起止时间和持续天数
- GDD累积曲线：折线面积图，显示逐日累积热时间
- 物候事件列表：卡片式列表，包含阶段名称、预测日期、GDD范围、持续天数
- 阶段GDD进度：进度条面板，直观展示各阶段的GDD完成度

### 3. 植保IPM
病虫害风险预警和综合防治策略。
- 风险摘要：风险等级、高风险数、预警总数
- 风险预警指数图：多线折线图，每种病虫害一条线
- 病虫害预警卡片：网格布局，每张卡片显示病虫害名、风险等级、描述、适宜温湿度、关联阶段、防治建议
- IPM策略面板：预防为主、监测预警、综合防治、安全间隔四项策略
- 防治日历：近期防治计划列表

### 4. 农事操作
全生育期农事操作日历与执行标准。
- 指标卡片：灌溉方式（膜下滴灌）、建议施N量、覆膜类型、密度
- 阶段时间轴色条：横向彩色渐变条，标注整地、营养管理、促花、第一茬、高峰、拉秧各阶段的月份
- 操作卡片网格：按阶段分组的卡片，每张卡片含日期范围、操作名称、详细描述、关键参数
- 灌溉与施肥方案表：月份/阶段/灌溉量/频率/N-P2O5-K2O/用量

### 5. 产量预测
基于品种潜力和环境条件的产量预估。
- 指标卡片：鲜果总产（t/ha）、单果重（g）、第一茬占比（%）、采收天数
- 预测逐日产量：折线面积图，展示日产量变化趋势
- 第一/二茬占比：环形图（donut chart），显示头茬和二茬的产量比例
- 产量详细预测表：鲜果总产、单株产量、单果重、果数/株、果数/m2、头茬果产量、二茬果产量、头茬起始、采收高峰

## 链式决策流程

物候预测 --> 产量预估 --> 病虫害风险 --> 农事操作

决策逻辑示例：
- 根据GDD预测开花期，提前预警灰霉病风险
- 根据采收高峰，自动给出灌溉施肥方案
- 根据果实发育阶段，动态调整灌溉EC和排液率
- 根据基质水分平衡模型，推荐每日灌溉量与时段

## 操作步骤
1. 在基础信息页选择品种、区域、定植日期
2. 点击生成方案启动链式模拟
3. 依次查看物候方案、植保IPM、农事操作、产量预测
4. 各页面数据互通，模块间协同决策`

const activeVersion = ref(props.version)

function switchVersion(version: 'v1' | 'v2') {
  activeVersion.value = version
}

const currentContent = computed(() => {
  return activeVersion.value === 'v1' ? v1Manual : v2Manual
})

const renderedContent = computed(() => {
  return currentContent.value
    .split('\n')
    .map(line => {
      if (line.startsWith('## ')) return `<h2 class="text-lg font-bold text-midnight-100 mt-6 mb-3">${line.slice(3)}</h2>`
      if (line.startsWith('# ')) return `<h1 class="text-xl font-bold text-midnight-50 mt-0 mb-4">${line.slice(2)}</h1>`
      if (line.startsWith('- ')) return `<li class="ml-4 text-midnight-300">${line.slice(2)}</li>`
      if (line.startsWith('### ')) return `<h3 class="text-base font-semibold text-midnight-200 mt-4 mb-2">${line.slice(4)}</h3>`
      if (line.trim() === '') return '<br>'
      return `<p class="text-sm text-midnight-300 leading-relaxed">${line}</p>`
    })
    .join('')
})
</script>

<template>
  <transition name="slide">
    <div
      v-if="isVisible"
      class="fixed inset-0 z-50 flex justify-end"
    >
      <!-- 遮罩 -->
      <div
        class="absolute inset-0 bg-black/50 transition-opacity duration-300"
        @click="close"
      ></div>

      <!-- 抽屉面板 -->
      <div class="relative w-1/2 h-full bg-midnight-800 shadow-2xl flex flex-col overflow-hidden border-l border-midnight-600/30">
        <!-- 头部 -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-midnight-600/30 shrink-0">
          <div class="flex items-center gap-3">
            <BookOpen :size="20" class="text-strawberry-400" />
            <h2 class="text-lg font-bold text-midnight-50">使用手册</h2>
            <span
              class="text-xs px-2 py-0.5 rounded-full"
              :class="activeVersion === 'v1' ? 'bg-forest-500/20 text-forest-300' : 'bg-strawberry-500/20 text-strawberry-300'"
            >
              {{ activeVersion === 'v1' ? '版本一' : '版本二' }}
            </span>
          </div>
          <button
            class="p-2 rounded-lg text-midnight-400 hover:text-midnight-200 hover:bg-midnight-700/40 transition-colors"
            @click="close"
          >
            <X :size="18" />
          </button>
        </div>

        <!-- 版本切换 -->
        <div class="flex gap-2 px-6 py-3 border-b border-midnight-700/30 shrink-0">
          <button
            class="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            :class="activeVersion === 'v1'
              ? 'bg-forest-500/20 text-forest-300'
              : 'bg-midnight-700/40 text-midnight-400 hover:bg-midnight-700/60'"
            @click="switchVersion('v1')"
          >
            版本一 · 模拟器
          </button>
          <button
            class="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            :class="activeVersion === 'v2'
              ? 'bg-strawberry-500/20 text-strawberry-300'
              : 'bg-midnight-700/40 text-midnight-400 hover:bg-midnight-700/60'"
            @click="switchVersion('v2')"
          >
            版本二 · 决策引擎
          </button>
        </div>

        <!-- 内容区 -->
        <div class="flex-1 overflow-y-auto p-6">
          <div
            class="text-sm"
            v-html="renderedContent"
          ></div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
