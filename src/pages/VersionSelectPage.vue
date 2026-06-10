<script setup lang="ts">
import { useRouter } from 'vue-router'
import { FlaskConical, Brain } from 'lucide-vue-next'

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
      <div class="absolute top-1/4 -left-32 w-96 h-96 bg-strawberry-500/5 rounded-full blur-3xl" />
      <div class="absolute bottom-1/4 -right-32 w-96 h-96 bg-forest-500/5 rounded-full blur-3xl" />
    </div>

    <!-- 主内容 -->
    <div class="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <!-- 标题区域 -->
      <div class="text-center mb-16 fade-in-up">
        <h1 class="font-heading text-6xl md:text-7xl text-midnight-50 mb-4 tracking-tight">
          StrawSim
        </h1>
        <p class="text-lg md:text-xl text-midnight-300 font-body">
          草莓作物模拟决策系统
        </p>
      </div>

      <!-- 版本选择卡片 -->
      <div class="flex flex-col md:flex-row gap-8 w-full max-w-4xl fade-in-up-delay">
        <!-- V1 经典版 -->
        <button
          class="version-card group flex-1 text-left"
          @click="selectVersion('v1')"
        >
          <div class="glass-card p-8 h-full transition-all duration-300 hover:border-strawberry-500/40 hover:shadow-xl hover:shadow-strawberry-500/10 hover:-translate-y-1">
            <!-- 图标 -->
            <div class="w-14 h-14 rounded-2xl bg-strawberry-500/15 flex items-center justify-center mb-6 group-hover:bg-strawberry-500/25 transition-colors duration-300">
              <FlaskConical :size="28" class="text-strawberry-400" />
            </div>

            <!-- 标题 -->
            <h2 class="font-heading text-2xl text-midnight-50 mb-2">经典版</h2>
            <p class="text-sm text-midnight-300 mb-6">
              配置驱动的模拟器，适合研究人员和高级用户
            </p>

            <!-- 特性列表 -->
            <ul class="space-y-2.5">
              <li class="flex items-center gap-2.5 text-sm text-midnight-200">
                <span class="w-1.5 h-1.5 rounded-full bg-strawberry-500 shrink-0" />
                自由配置参数
              </li>
              <li class="flex items-center gap-2.5 text-sm text-midnight-200">
                <span class="w-1.5 h-1.5 rounded-full bg-strawberry-500 shrink-0" />
                实时模拟监控
              </li>
              <li class="flex items-center gap-2.5 text-sm text-midnight-200">
                <span class="w-1.5 h-1.5 rounded-full bg-strawberry-500 shrink-0" />
                结果分析图表
              </li>
              <li class="flex items-center gap-2.5 text-sm text-midnight-200">
                <span class="w-1.5 h-1.5 rounded-full bg-strawberry-500 shrink-0" />
                品种参数管理
              </li>
              <li class="flex items-center gap-2.5 text-sm text-midnight-200">
                <span class="w-1.5 h-1.5 rounded-full bg-strawberry-500 shrink-0" />
                数据导入导出
              </li>
            </ul>
          </div>
        </button>

        <!-- V2 决策版 -->
        <button
          class="version-card group flex-1 text-left relative"
          @click="selectVersion('v2')"
        >
          <!-- 推荐徽章 -->
          <div class="absolute -top-3 -right-3 z-10 px-3 py-1 rounded-full bg-strawberry-500 text-white text-xs font-semibold shadow-lg shadow-strawberry-500/30">
            推荐
          </div>

          <div class="glass-card p-8 h-full transition-all duration-300 hover:border-forest-500/40 hover:shadow-xl hover:shadow-forest-500/10 hover:-translate-y-1">
            <!-- 图标 -->
            <div class="w-14 h-14 rounded-2xl bg-forest-500/15 flex items-center justify-center mb-6 group-hover:bg-forest-500/25 transition-colors duration-300">
              <Brain :size="28" class="text-forest-400" />
            </div>

            <!-- 标题 -->
            <h2 class="font-heading text-2xl text-midnight-50 mb-2">决策版</h2>
            <p class="text-sm text-midnight-300 mb-6">
              链式决策引擎，从物候预测到农事操作闭环
            </p>

            <!-- 特性列表 -->
            <ul class="space-y-2.5">
              <li class="flex items-center gap-2.5 text-sm text-midnight-200">
                <span class="w-1.5 h-1.5 rounded-full bg-forest-500 shrink-0" />
                品种×区域智能匹配
              </li>
              <li class="flex items-center gap-2.5 text-sm text-midnight-200">
                <span class="w-1.5 h-1.5 rounded-full bg-forest-500 shrink-0" />
                GDD物候时间轴
              </li>
              <li class="flex items-center gap-2.5 text-sm text-midnight-200">
                <span class="w-1.5 h-1.5 rounded-full bg-forest-500 shrink-0" />
                植保IPM预警
              </li>
              <li class="flex items-center gap-2.5 text-sm text-midnight-200">
                <span class="w-1.5 h-1.5 rounded-full bg-forest-500 shrink-0" />
                农事操作推荐
              </li>
              <li class="flex items-center gap-2.5 text-sm text-midnight-200">
                <span class="w-1.5 h-1.5 rounded-full bg-forest-500 shrink-0" />
                产量驾驶舱
              </li>
            </ul>
          </div>
        </button>
      </div>

      <!-- 底部说明 -->
      <p class="mt-12 text-xs text-midnight-500 text-center max-w-lg fade-in-up-delay-2">
        两个版本共享同一套 CROPGRO-Strawberry 模拟引擎，核心算法完全一致
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
