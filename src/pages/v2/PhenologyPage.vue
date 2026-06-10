<script setup lang="ts">
import { Info } from 'lucide-vue-next'
</script>

<template>
  <div class="space-y-6">
    <h2 class="section-title">物候方案</h2>
    <div class="glass-card p-12 text-center">
      <Info :size="48" class="mx-auto mb-4 text-midnight-500" />
      <p class="text-midnight-300 mb-2">GDD物候时间轴</p>
      <p class="text-sm text-midnight-400">基于积温模型预测各生育阶段时间节点</p>
    </div>
  </div>
</template>
