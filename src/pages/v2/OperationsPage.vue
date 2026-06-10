<script setup lang="ts">
import { Info } from 'lucide-vue-next'
</script>

<template>
  <div class="space-y-6">
    <h2 class="section-title">农事操作</h2>
    <div class="glass-card p-12 text-center">
      <Info :size="48" class="mx-auto mb-4 text-midnight-500" />
      <p class="text-midnight-300 mb-2">农事操作推荐</p>
      <p class="text-sm text-midnight-400">基于模拟结果的灌溉、施肥、修剪等农事操作推荐</p>
    </div>
  </div>
</template>
