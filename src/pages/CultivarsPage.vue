<script setup lang="ts">
import { ref } from 'vue'
import { useCultivarStore } from '@/stores/cultivar'
import type { Cultivar } from '@/stores/cultivar'
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Sprout,
  Thermometer,
  ShieldCheck,
  X,
} from 'lucide-vue-next'

const cultivarStore = useCultivarStore()

/* 是否显示添加品种表单 */
const showAddForm = ref(false)

/* 新品种表单 */
const newCultivar = ref<Cultivar>({
  id: '',
  name: '',
  ecotype: '',
  origin: '',
  description: '',
  params: {
    emergenceDays: 10,
    floweringDays: 30,
    maturityDays: 60,
    maxLai: 4.0,
    potentialFruitWeight: 22,
    sscTarget: 10,
    acidityTarget: 0.8,
    coldTolerance: 5,
    diseaseResistance: 5,
  },
})

/* 提交新品种 */
function addCultivar() {
  if (!newCultivar.value.name) return
  newCultivar.value.id = String(Date.now())
  cultivarStore.addCultivar({ ...newCultivar.value })
  showAddForm.value = false
  // 重置表单
  newCultivar.value = {
    id: '',
    name: '',
    ecotype: '',
    origin: '',
    description: '',
    params: {
      emergenceDays: 10,
      floweringDays: 30,
      maturityDays: 60,
      maxLai: 4.0,
      potentialFruitWeight: 22,
      sscTarget: 10,
      acidityTarget: 0.8,
      coldTolerance: 5,
      diseaseResistance: 5,
    },
  }
}

/* 品种参数标签 */
const paramLabels: Record<string, string> = {
  emergenceDays: '出苗天数',
  floweringDays: '开花天数',
  maturityDays: '成熟天数',
  maxLai: '最大LAI',
  potentialFruitWeight: '潜在果重(g)',
  sscTarget: '目标固形物(%)',
  acidityTarget: '目标酸度(%)',
  coldTolerance: '耐寒性',
  diseaseResistance: '抗病性',
}
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <h2 class="section-title mb-0">品种参数库</h2>
      <button class="strawberry-btn flex items-center gap-2" @click="showAddForm = true">
        <Plus :size="16" />
        添加品种
      </button>
    </div>

    <!-- 品种卡片网格 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="cultivar in cultivarStore.cultivars"
        :key="cultivar.id"
        class="glass-card p-5 cursor-pointer transition-all duration-200 hover:border-strawberry-500/30"
        :class="cultivarStore.selectedId === cultivar.id ? 'border-strawberry-500/50 ring-1 ring-strawberry-500/20' : ''"
        @click="cultivarStore.selectCultivar(cultivar.id)"
      >
        <!-- 卡片头部 -->
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="font-heading text-lg text-midnight-50">{{ cultivar.name }}</h3>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs px-2 py-0.5 rounded-full bg-forest-500/20 text-forest-300">
                {{ cultivar.ecotype }}
              </span>
              <span class="text-xs text-midnight-400">{{ cultivar.origin }}</span>
            </div>
          </div>
          <button
            class="text-midnight-400 hover:text-midnight-200 transition-colors"
            @click.stop="cultivarStore.toggleExpand(cultivar.id)"
          >
            <component :is="cultivarStore.expandedId === cultivar.id ? ChevronUp : ChevronDown" :size="16" />
          </button>
        </div>

        <!-- 描述 -->
        <p class="text-sm text-midnight-300 mb-3">{{ cultivar.description }}</p>

        <!-- 关键参数摘要 -->
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="p-2 rounded-lg bg-midnight-700/30">
            <div class="text-xs text-midnight-400">最大LAI</div>
            <div class="text-sm font-semibold text-midnight-100">{{ cultivar.params.maxLai }}</div>
          </div>
          <div class="p-2 rounded-lg bg-midnight-700/30">
            <div class="text-xs text-midnight-400">果重</div>
            <div class="text-sm font-semibold text-midnight-100">{{ cultivar.params.potentialFruitWeight }}g</div>
          </div>
          <div class="p-2 rounded-lg bg-midnight-700/30">
            <div class="text-xs text-midnight-400">固形物</div>
            <div class="text-sm font-semibold text-midnight-100">{{ cultivar.params.sscTarget }}%</div>
          </div>
        </div>

        <!-- 展开详情 -->
        <transition name="expand">
          <div v-if="cultivarStore.expandedId === cultivar.id" class="mt-4 pt-4 border-t border-midnight-600/30">
            <h4 class="text-xs font-semibold text-midnight-300 mb-3">完整参数</h4>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="(value, key) in cultivar.params"
                :key="key"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-midnight-400">{{ paramLabels[key] || key }}</span>
                <span class="text-midnight-200 font-medium">{{ value }}</span>
              </div>
            </div>
            <!-- 耐寒性和抗病性可视化 -->
            <div class="mt-3 space-y-2">
              <div class="flex items-center gap-2">
                <Thermometer :size="12" class="text-blue-400" />
                <span class="text-xs text-midnight-400 w-12">耐寒性</span>
                <div class="flex-1 h-2 bg-midnight-700 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-blue-500 rounded-full"
                    :style="{ width: (cultivar.params.coldTolerance / 10 * 100) + '%' }"
                  />
                </div>
              </div>
              <div class="flex items-center gap-2">
                <ShieldCheck :size="12" class="text-forest-400" />
                <span class="text-xs text-midnight-400 w-12">抗病性</span>
                <div class="flex-1 h-2 bg-midnight-700 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-forest-500 rounded-full"
                    :style="{ width: (cultivar.params.diseaseResistance / 10 * 100) + '%' }"
                  />
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- 添加品种弹窗 -->
    <teleport to="body">
      <div
        v-if="showAddForm"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        @click.self="showAddForm = false"
      >
        <div class="glass-card p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-heading text-lg text-midnight-50">添加自定义品种</h3>
            <button class="text-midnight-400 hover:text-midnight-200" @click="showAddForm = false">
              <X :size="18" />
            </button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="text-xs text-midnight-400 mb-1 block">品种名称 *</label>
              <input v-model="newCultivar.name" class="input-field" placeholder="输入品种名称" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-midnight-400 mb-1 block">生态型</label>
                <input v-model="newCultivar.ecotype" class="input-field" placeholder="如：日系短日照" />
              </div>
              <div>
                <label class="text-xs text-midnight-400 mb-1 block">产地</label>
                <input v-model="newCultivar.origin" class="input-field" placeholder="如：日本" />
              </div>
            </div>
            <div>
              <label class="text-xs text-midnight-400 mb-1 block">描述</label>
              <textarea v-model="newCultivar.description" class="input-field" rows="2" placeholder="品种描述" />
            </div>

            <h4 class="text-xs font-semibold text-midnight-300 pt-2">品种参数</h4>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-midnight-400 mb-1 block">出苗天数</label>
                <input v-model.number="newCultivar.params.emergenceDays" type="number" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-midnight-400 mb-1 block">开花天数</label>
                <input v-model.number="newCultivar.params.floweringDays" type="number" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-midnight-400 mb-1 block">成熟天数</label>
                <input v-model.number="newCultivar.params.maturityDays" type="number" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-midnight-400 mb-1 block">最大LAI</label>
                <input v-model.number="newCultivar.params.maxLai" type="number" step="0.1" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-midnight-400 mb-1 block">潜在果重 (g)</label>
                <input v-model.number="newCultivar.params.potentialFruitWeight" type="number" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-midnight-400 mb-1 block">目标固形物 (%)</label>
                <input v-model.number="newCultivar.params.sscTarget" type="number" step="0.1" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-midnight-400 mb-1 block">耐寒性 (1-10)</label>
                <input v-model.number="newCultivar.params.coldTolerance" type="number" min="1" max="10" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-midnight-400 mb-1 block">抗病性 (1-10)</label>
                <input v-model.number="newCultivar.params.diseaseResistance" type="number" min="1" max="10" class="input-field" />
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <button class="ghost-btn" @click="showAddForm = false">取消</button>
            <button class="strawberry-btn" @click="addCultivar">确认添加</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
