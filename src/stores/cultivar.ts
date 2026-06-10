import { defineStore } from 'pinia'
import { ref } from 'vue'

/* 品种参数接口 */
export interface Cultivar {
  id: string
  name: string
  ecotype: string       // 生态型
  origin: string        // 产地
  description: string
  params: {
    emergenceDays: number
    floweringDays: number
    maturityDays: number
    maxLai: number
    potentialFruitWeight: number
    sscTarget: number
    acidityTarget: number
    coldTolerance: number  // 耐寒性 1-10
    diseaseResistance: number // 抗病性 1-10
  }
}

/* 品种库存储 */
export const useCultivarStore = defineStore('cultivar', () => {
  const cultivars = ref<Cultivar[]>([
    {
      id: '1',
      name: '红颜',
      ecotype: '日系短日照',
      origin: '日本',
      description: '果实圆锥形，色泽鲜红，口感香甜，是目前国内主栽品种之一。',
      params: {
        emergenceDays: 10,
        floweringDays: 30,
        maturityDays: 60,
        maxLai: 4.5,
        potentialFruitWeight: 25,
        sscTarget: 10,
        acidityTarget: 0.8,
        coldTolerance: 7,
        diseaseResistance: 6,
      },
    },
    {
      id: '2',
      name: '章姬',
      ecotype: '日系短日照',
      origin: '日本',
      description: '果实长圆锥形，果面平整，香味浓郁，适合鲜食。',
      params: {
        emergenceDays: 12,
        floweringDays: 28,
        maturityDays: 55,
        maxLai: 4.0,
        potentialFruitWeight: 20,
        sscTarget: 11,
        acidityTarget: 0.7,
        coldTolerance: 6,
        diseaseResistance: 5,
      },
    },
    {
      id: '3',
      name: '甜查理',
      ecotype: '欧美系',
      origin: '美国',
      description: '果实大，硬度高，耐储运，适合商业化种植。',
      params: {
        emergenceDays: 8,
        floweringDays: 32,
        maturityDays: 65,
        maxLai: 5.0,
        potentialFruitWeight: 30,
        sscTarget: 8,
        acidityTarget: 0.9,
        coldTolerance: 8,
        diseaseResistance: 8,
      },
    },
    {
      id: '4',
      name: '妙香七号',
      ecotype: '国育品种',
      origin: '中国山东',
      description: '山东省农科院培育，果实香味浓郁，适合设施栽培。',
      params: {
        emergenceDays: 9,
        floweringDays: 29,
        maturityDays: 58,
        maxLai: 4.2,
        potentialFruitWeight: 22,
        sscTarget: 10.5,
        acidityTarget: 0.75,
        coldTolerance: 7,
        diseaseResistance: 7,
      },
    },
    {
      id: '5',
      name: '白雪公主',
      ecotype: '日系短日照',
      origin: '日本',
      description: '白色草莓品种，果肉纯白，口感细腻，糖度高。',
      params: {
        emergenceDays: 11,
        floweringDays: 31,
        maturityDays: 62,
        maxLai: 3.8,
        potentialFruitWeight: 18,
        sscTarget: 12,
        acidityTarget: 0.6,
        coldTolerance: 5,
        diseaseResistance: 4,
      },
    },
    {
      id: '6',
      name: '越心',
      ecotype: '国育品种',
      origin: '中国浙江',
      description: '浙江省农科院培育，早熟品种，适合南方种植。',
      params: {
        emergenceDays: 8,
        floweringDays: 25,
        maturityDays: 50,
        maxLai: 4.0,
        potentialFruitWeight: 20,
        sscTarget: 9.5,
        acidityTarget: 0.85,
        coldTolerance: 6,
        diseaseResistance: 7,
      },
    },
  ])

  const selectedId = ref<string | null>('1')
  const expandedId = ref<string | null>(null)

  /* 获取选中的品种 */
  const selectedCultivar = ref<Cultivar | null>(cultivars.value[0] || null)

  /* 选择品种 */
  function selectCultivar(id: string) {
    selectedId.value = id
    const found = cultivars.value.find(c => c.id === id)
    if (found) {
      selectedCultivar.value = found
    }
  }

  /* 展开/折叠品种详情 */
  function toggleExpand(id: string) {
    expandedId.value = expandedId.value === id ? null : id
  }

  /* 添加自定义品种 */
  function addCultivar(cultivar: Cultivar) {
    cultivars.value.push(cultivar)
  }

  return {
    cultivars, selectedId, expandedId, selectedCultivar,
    selectCultivar, toggleExpand, addCultivar,
  }
})
