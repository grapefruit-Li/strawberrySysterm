<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Beaker, Zap, ArrowRight } from 'lucide-vue-next'

const router = useRouter()

/* 选择版本 */
function selectVersion(version: 'v1' | 'v2') {
  router.push(version === 'v1' ? '/v1' : '/v2')
}
</script>

<template>
  <div class="version-select-page">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/4 -left-32 w-96 h-96 bg-forest-500/5 rounded-full blur-3xl" />
      <div class="absolute bottom-1/4 -right-32 w-96 h-96 bg-strawberry-500/5 rounded-full blur-3xl" />
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-midnight-700/30 rounded-full blur-3xl" />
    </div>

    <!-- 主内容 -->
    <div class="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <!-- 标题区域 -->
      <div class="text-center mb-16 fade-in-up">
        <h1 class="font-heading text-5xl md:text-7xl text-midnight-50 mb-4 tracking-tight">
          StrawSim
        </h1>
        <p class="text-lg md:text-xl text-midnight-300 font-body mb-2">
          草莓作物模拟系统
        </p>
        <p class="text-sm text-midnight-500 font-body">
          基于 DSSAT CROPGRO-Strawberry 模型
        </p>
      </div>

      <!-- 版本选择卡片 -->
      <div class="flex flex-col md:flex-row gap-8 w-full max-w-4xl">
        <!-- V1 模拟器模式 -->
        <div class="version-card group flex-1 fade-in-up-delay">
          <div class="glass-card p-8 h-full transition-all duration-300 hover:border-forest-500/40 hover:shadow-xl hover:shadow-forest-500/10 hover:-translate-y-1">
            <!-- 图标 -->
            <div class="w-14 h-14 rounded-2xl bg-forest-500/15 flex items-center justify-center mb-6 group-hover:bg-forest-500/25 transition-colors duration-300">
              <Beaker :size="28" class="text-forest-400" />
            </div>

            <!-- 标题 -->
            <h2 class="font-heading text-2xl text-midnight-50 mb-2">版本一 · 模拟器模式</h2>
            <p class="text-sm text-midnight-300 mb-6">
              经典模拟器界面，配置参数→运行模拟→分析结果。适合研究人员和高级用户。
            </p>

            <!-- 特性列表 -->
            <ul class="space-y-2.5 mb-8">
              <li class="flex items-center gap-2.5 text-sm text-midnight-200">
                <span class="w-1.5 h-1.5 rounded-full bg-forest-500 shrink-0" />
                参数配置
              </li>
              <li class="flex items-center gap-2.5 text-sm text-midnight-200">
                <span class="w-1.5 h-1.5 rounded-full bg-forest-500 shrink-0" />
                实时模拟
              </li>
              <li class="flex items-center gap-2.5 text-sm text-midnight-200">
                <span class="w-1.5 h-1.5 rounded-full bg-forest-500 shrink-0" />
                结果分析
              </li>
              <li class="flex items-center gap-2.5 text-sm text-midnight-200">
                <span class="w-1.5 h-1.5 rounded-full bg-forest-500 shrink-0" />
                品种库
              </li>
              <li class="flex items-center gap-2.5 text-sm text-midnight-200">
                <span class="w-1.5 h-1.5 rounded-full bg-forest-500 shrink-0" />
                数据管理
              </li>
            </ul>

            <!-- 按钮 -->
            <button
              class="w-full flex items-center justify-center gap-2 bg-forest-500 hover:bg-forest-600 text-white font-semibold px-5 py-3 rounded-lg transition-all duration-200 shadow-lg shadow-forest-500/25 hover:shadow-forest-500/40 active:scale-95"
              @click="selectVersion('v1')"
            >
              <span>进入版本一</span>
              <ArrowRight :size="16" />
            </button>
          </div>
        </div>

        <!-- V2 决策引擎模式 -->
        <div class="version-card group flex-1 fade-in-up-delay-2">
          <div class="glass-card p-8 h-full transition-all duration-300 hover:border-strawberry-500/40 hover:shadow-xl hover:shadow-strawberry-500/10 hover:-translate-y-1">
            <!-- 图标 -->
            <div class="w-14 h-14 rounded-2xl bg-strawberry-500/15 flex items-center justify-center mb-6 group-hover:bg-strawberry-500/25 transition-colors duration-300">
              <Zap :size="28" class="text-strawberry-400" />
            </div>

            <!-- 标题 -->
            <h2 class="font-heading text-2xl text-midnight-50 mb-2">版本二 · 决策引擎模式</h2>
            <p class="text-sm text-midnight-300 mb-6">
              链式决策系统，物候→产量→病虫害→农事操作。适合种植户和生产管理。
            </p>

            <!-- 特性列表 -->
            <ul class="space-y-2.5 mb-8">
              <li class="flex items-center gap-2.5 text-sm text-midnight-200">
                <span class="w-1.5 h-1.5 rounded-full bg-strawberry-500 shrink-0" />
                基础信息
              </li>
              <li class="flex items-center gap-2.5 text-sm text-midnight-200">
                <span class="w-1.5 h-1.5 rounded-full bg-strawberry-500 shrink-0" />
                物候方案
              </li>
              <li class="flex items-center gap-2.5 text-sm text-midnight-200">
                <span class="w-1.5 h-1.5 rounded-full bg-strawberry-500 shrink-0" />
                植保IPM
              </li>
              <li class="flex items-center gap-2.5 text-sm text-midnight-200">
                <span class="w-1.5 h-1.5 rounded-full bg-strawberry-500 shrink-0" />
                农事操作
              </li>
              <li class="flex items-center gap-2.5 text-sm text-midnight-200">
                <span class="w-1.5 h-1.5 rounded-full bg-strawberry-500 shrink-0" />
                产量预测
              </li>
            </ul>

            <!-- 按钮 -->
            <button
              class="strawberry-btn w-full flex items-center justify-center gap-2"
              @click="selectVersion('v2')"
            >
              <span>进入版本二</span>
              <ArrowRight :size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- 底部说明 -->
      <p class="mt-12 text-xs text-midnight-500 text-center max-w-lg fade-in-up-delay-3">
        两个版本共享同一核心模拟引擎，算法和模型完全一致
      </p>
    </div>
  </div>
</template>

<style scoped>
.version-select-page {
  @apply min-h-screen bg-gradient-to-br from-midnight-900 via-midnight-800 to-midnight-900 relative;
}

/* 淡入上移动画 */
.fade-in-up {
  animation: fadeInUp 0.8s ease-out both;
}

.fade-in-up-delay {
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.fade-in-up-delay-2 {
  animation: fadeInUp 0.8s ease-out 0.4s both;
}

.fade-in-up-delay-3 {
  animation: fadeInUp 0.8s ease-out 0.6s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
