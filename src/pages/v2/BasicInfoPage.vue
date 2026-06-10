<script setup lang="ts">
import { Info } from 'lucide-vue-next'
</script>

<template>
  <div class="space-y-6">
    <h2 class="section-title">基础信息</h2>
    <div class="glass-card p-12 text-center">
      <Info :size="48" class="mx-auto mb-4 text-midnight-500" />
      <p class="text-midnight-300 mb-2">品种×区域智能匹配</p>
      <p class="text-sm text-midnight-400">选择品种和种植区域，系统将智能推荐最佳种植方案</p>
    </div>
  </div>
</template>
