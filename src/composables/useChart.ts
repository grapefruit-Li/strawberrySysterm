import { ref } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, ScatterChart, CustomChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkPointComponent,
} from 'echarts/components'

/* 注册 ECharts 组件 */
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  ScatterChart,
  CustomChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkPointComponent,
])

/* 图表主题配置 */
const chartTheme = {
  backgroundColor: 'transparent',
  textStyle: {
    color: '#9CA3AF',
    fontFamily: 'DM Sans, sans-serif',
  },
  title: {
    textStyle: {
      color: '#F3F4F6',
      fontFamily: 'DM Serif Display, serif',
    },
  },
}

/* 创建通用图表选项 */
export function useChart() {
  /* 基础暗色主题选项 */
  const baseOption = {
    ...chartTheme,
    grid: {
      left: 60,
      right: 30,
      top: 40,
      bottom: 50,
    },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(26, 27, 46, 0.9)',
      borderColor: 'rgba(45, 49, 66, 0.5)',
      textStyle: { color: '#F3F4F6' },
    },
    legend: {
      textStyle: { color: '#9CA3AF' },
      pageTextStyle: { color: '#9CA3AF' },
    },
    xAxis: {
      type: 'category' as const,
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9CA3AF' },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9CA3AF' },
      splitLine: { lineStyle: { color: 'rgba(55, 65, 81, 0.5)' } },
    },
    dataZoom: [
      {
        type: 'inside' as const,
        start: 0,
        end: 100,
      },
    ],
  }

  /* 颜色序列 */
  const colors = {
    strawberry: '#E63946',
    forest: '#2D6A4F',
    blue: '#3B82F6',
    amber: '#F59E0B',
    purple: '#8B5CF6',
    cyan: '#06B6D4',
    pink: '#EC4899',
  }

  /* 阶段颜色映射 */
  const stageColors: Record<string, string> = {
    '萌芽期': '#4ADE80',
    '出苗期': '#4ADE80',
    '营养生长期': '#2D6A4F',
    '花芽分化期': '#F59E0B',
    '开花期': '#EC4899',
    '结果期': '#E63946',
    '果实膨大期': '#E63946',
    '成熟期': '#8B5CF6',
    '采收期': '#E63946',
  }

  /* 风险等级颜色映射 */
  const riskColors: Record<string, string> = {
    low: '#4ADE80',
    medium: '#F59E0B',
    high: '#F97316',
    critical: '#E63946',
  }

  /* 创建折线图选项 */
  function createLineChartOption(
    title: string,
    xData: string[],
    series: { name: string; data: number[]; color?: string }[]
  ) {
    return {
      ...baseOption,
      title: { text: title, left: 'center' },
      xAxis: { ...baseOption.xAxis, data: xData },
      series: series.map((s, i) => ({
        name: s.name,
        type: 'line' as const,
        data: s.data,
        smooth: true,
        lineStyle: { width: 2 },
        itemStyle: { color: s.color || Object.values(colors)[i % 7] },
        areaStyle: i === 0 ? {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: (s.color || colors.strawberry) + '40' },
              { offset: 1, color: (s.color || colors.strawberry) + '05' },
            ],
          },
        } : undefined,
      })),
    }
  }

  /* 创建柱状图选项 */
  function createBarChartOption(
    title: string,
    xData: string[],
    series: { name: string; data: number[]; color?: string }[]
  ) {
    return {
      ...baseOption,
      title: { text: title, left: 'center' },
      xAxis: { ...baseOption.xAxis, data: xData },
      series: series.map((s, i) => ({
        name: s.name,
        type: 'bar' as const,
        data: s.data,
        itemStyle: {
          color: s.color || Object.values(colors)[i % 7],
          borderRadius: [4, 4, 0, 0],
        },
        barMaxWidth: 40,
      })),
    }
  }

  /* 创建散点图选项 */
  function createScatterChartOption(
    title: string,
    series: { name: string; data: [number, number][]; color?: string }[]
  ) {
    return {
      ...baseOption,
      title: { text: title, left: 'center' },
      xAxis: { ...baseOption.xAxis, type: 'value' as const },
      series: series.map((s, i) => ({
        name: s.name,
        type: 'scatter' as const,
        data: s.data,
        symbolSize: 8,
        itemStyle: { color: s.color || Object.values(colors)[i % 7] },
      })),
    }
  }

  /* 甘特图时间轴选项 - 物候阶段 */
  function ganttTimelineOption(events: import('@/engine/types').PhenologyEvent[]) {
    if (events.length === 0) {
      return { ...baseOption, title: { text: '物候甘特图', left: 'center' }, xAxis: { ...baseOption.xAxis, data: [] }, series: [] }
    }

    /* 将YYYYMMDD数字转为可读日期 */
    function formatDate(dateNum: number): string {
      const s = String(dateNum)
      return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
    }

    const categories = events.map(e => e.name)
    const startDates = events.map(e => formatDate(e.startDate))
    const endDates = events.map(e => {
      const startDate = new Date(
        Math.floor(e.startDate / 10000),
        Math.floor((e.startDate % 10000) / 100) - 1,
        e.startDate % 100
      )
      const endDate = new Date(startDate.getTime() + e.duration * 86400000)
      return `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
    })

    return {
      ...baseOption,
      title: { text: '物候甘特图', left: 'center' },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(26, 27, 46, 0.9)',
        borderColor: 'rgba(45, 49, 66, 0.5)',
        textStyle: { color: '#F3F4F6' },
        formatter: (params: any) => {
          const idx = params[0]?.dataIndex ?? 0
          const ev = events[idx]
          if (!ev) return ''
          return `<strong>${ev.name}</strong><br/>` +
            `预测日期: ${formatDate(ev.startDate)}<br/>` +
            `持续: ${ev.duration}天<br/>` +
            `累积GDD: ${ev.endGdd} °C·d<br/>` +
            `置信度: ${(0.85 * 100).toFixed(0)}%`
        },
      },
      grid: { left: 120, right: 30, top: 40, bottom: 50 },
      xAxis: {
        type: 'time' as const,
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { color: '#9CA3AF', formatter: '{MM}-{dd}' },
        splitLine: { lineStyle: { color: 'rgba(55, 65, 81, 0.3)' } },
      },
      yAxis: {
        type: 'category' as const,
        data: categories,
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { color: '#9CA3AF', fontSize: 12 },
      },
      series: events.map((ev, i) => ({
        name: ev.name,
        type: 'custom' as const,
        renderItem: (_params: any, api: any) => {
          const categoryIndex = api.value(0)
          const start = api.coord([api.value(1), categoryIndex])
          const end = api.coord([api.value(2), categoryIndex])
          const height = api.size([0, 1])[1] * 0.6
          const rectShape = {
            x: start[0],
            y: start[1] - height / 2,
            width: end[0] - start[0],
            height,
          }
          return {
            type: 'rect',
            transition: ['shape'],
            shape: rectShape,
            style: {
              fill: stageColors[ev.name] || Object.values(colors)[i % 7],
              opacity: 0.85,
            },
          }
        },
        encode: {
          x: [1, 2],
          y: 0,
        },
        data: [[i, startDates[i], endDates[i]]],
      })),
    }
  }

  /* 风险指数折线图选项 */
  function riskIndexOption(pestRisks: import('@/engine/types').PestRiskRecord[]) {
    if (pestRisks.length === 0) {
      return { ...baseOption, title: { text: '风险指数趋势', left: 'center' }, xAxis: { ...baseOption.xAxis, data: [] }, series: [] }
    }

    /* 按日期排序并去重 */
    const allDates = [...new Set(pestRisks.map(p => String(p.dailyRiskIndex[0].date)))].sort()

    /* 风险等级数值映射 */
    const riskLevelValue = (level: string) => {
      switch (level) {
        case 'critical': return 100
        case 'high': return 75
        case 'medium': return 50
        case 'low': return 25
        default: return 0
      }
    }

    return {
      ...baseOption,
      title: { text: '风险预警', left: 'center' },
      legend: {
        ...baseOption.legend,
        top: 30,
      },
      grid: { left: 60, right: 30, top: 60, bottom: 50 },
      xAxis: { ...baseOption.xAxis, data: allDates },
      yAxis: {
        ...baseOption.yAxis,
        name: '风险等级',
        max: 100,
      },
      series: pestRisks.map((p, i) => ({
        name: p.name,
        type: 'line' as const,
        data: allDates.map(date => date === String(p.dailyRiskIndex[0].date) ? riskLevelValue(p.riskLevel) : null),
        smooth: true,
        lineStyle: { width: 2 },
        itemStyle: { color: riskColors[p.riskLevel] || Object.values(colors)[i % 7] },
        connectNulls: true,
      })),
    }
  }

  /* 逐日产量曲线选项 */
  function yieldCurveOption(
    dailyOutputs: import('@/engine/types').DailyOutput[],
    harvests: import('@/engine/types').HarvestRecord[]
  ) {
    if (dailyOutputs.length === 0) {
      return { ...baseOption, title: { text: '产量曲线', left: 'center' }, xAxis: { ...baseOption.xAxis, data: [] }, series: [] }
    }

    /* 将YYYYMMDD数字转为可读日期 */
    function formatDate(dateNum: number): string {
      const s = String(dateNum)
      return `${s.slice(4, 6)}-${s.slice(6, 8)}`
    }

    const dates = dailyOutputs.map(d => formatDate(d.day))
    const dailyYield = dailyOutputs.map(d => d.fruitWt > 0 ? Math.round(d.fruitWt * 0.12 * 10) / 10 : 0)

    /* 累积产量 */
    let cumYield = 0
    const cumulativeYield = dailyYield.map(y => {
      cumYield += y
      return Math.round(cumYield * 10) / 10
    })

    return {
      ...baseOption,
      title: { text: '逐日产量曲线', left: 'center' },
      legend: { ...baseOption.legend, top: 30 },
      grid: { left: 60, right: 60, top: 60, bottom: 50 },
      xAxis: { ...baseOption.xAxis, data: dates },
      yAxis: [
        {
          type: 'value' as const,
          name: '日产量 (kg/ha)',
          axisLine: { lineStyle: { color: '#374151' } },
          axisLabel: { color: '#9CA3AF' },
          splitLine: { lineStyle: { color: 'rgba(55, 65, 81, 0.5)' } },
        },
        {
          type: 'value' as const,
          name: '累积产量 (kg/ha)',
          axisLine: { lineStyle: { color: '#374151' } },
          axisLabel: { color: '#9CA3AF' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '日产量',
          type: 'bar' as const,
          data: dailyYield,
          itemStyle: { color: colors.strawberry, borderRadius: [2, 2, 0, 0] },
          barMaxWidth: 8,
        },
        {
          name: '累积产量',
          type: 'line' as const,
          yAxisIndex: 1,
          data: cumulativeYield,
          smooth: true,
          lineStyle: { width: 2, color: colors.forest },
          itemStyle: { color: colors.forest },
          areaStyle: {
            color: {
              type: 'linear' as const,
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: colors.forest + '30' },
                { offset: 1, color: colors.forest + '05' },
              ],
            },
          },
        },
      ],
    }
  }

  /* 品质散点图选项 */
  function qualityScatterOption(harvests: import('@/engine/types').HarvestRecord[]) {
    if (harvests.length === 0) {
      return { ...baseOption, title: { text: '品质预测', left: 'center' }, xAxis: { ...baseOption.xAxis, data: [] }, series: [] }
    }

    function formatDate(dateNum: number): string {
      const s = String(dateNum)
      return `${s.slice(4, 6)}-${s.slice(6, 8)}`
    }

    return {
      ...baseOption,
      title: { text: '品质预测散点图', left: 'center' },
      legend: { ...baseOption.legend, top: 30 },
      grid: { left: 60, right: 30, top: 60, bottom: 50 },
      xAxis: {
        type: 'category' as const,
        data: harvests.map(h => formatDate(h.date)),
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { color: '#9CA3AF' },
        splitLine: { show: false },
      },
      yAxis: [
        {
          type: 'value' as const,
          name: 'SSC (%)',
          axisLine: { lineStyle: { color: '#374151' } },
          axisLabel: { color: '#9CA3AF' },
          splitLine: { lineStyle: { color: 'rgba(55, 65, 81, 0.5)' } },
        },
        {
          type: 'value' as const,
          name: '硬度 (N)',
          axisLine: { lineStyle: { color: '#374151' } },
          axisLabel: { color: '#9CA3AF' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'SSC',
          type: 'scatter' as const,
          data: harvests.map(h => h.ssc),
          symbolSize: 10,
          itemStyle: { color: colors.strawberry },
        },
        {
          name: '酸度',
          type: 'scatter' as const,
          data: harvests.map(h => h.acidity),
          symbolSize: 10,
          itemStyle: { color: colors.amber },
        },
        {
          name: '硬度',
          type: 'scatter' as const,
          yAxisIndex: 1,
          data: harvests.map(h => h.firmness),
          symbolSize: 10,
          itemStyle: { color: colors.forest },
        },
      ],
    }
  }

  /* 浅色主题配置 */
  const lightChartTheme = {
    backgroundColor: 'transparent',
    textStyle: {
      color: '#374151',
      fontFamily: 'DM Sans, sans-serif',
    },
    title: {
      textStyle: {
        color: '#1F2937',
        fontFamily: 'DM Serif Display, serif',
      },
    },
  }

  /* 创建浅色基础图表选项 */
  function createLightBaseOption() {
    return {
      ...lightChartTheme,
      grid: { left: 60, right: 30, top: 40, bottom: 50 },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E7EB',
        textStyle: { color: '#374151' },
      },
      legend: { textStyle: { color: '#374151' }, pageTextStyle: { color: '#374151' } },
      xAxis: {
        type: 'category' as const,
        axisLine: { lineStyle: { color: '#D1D5DB' } },
        axisLabel: { color: '#6B7280' },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        axisLine: { lineStyle: { color: '#D1D5DB' } },
        axisLabel: { color: '#6B7280' },
        splitLine: { lineStyle: { color: '#F3F4F6' } },
      },
      dataZoom: [{ type: 'inside' as const, start: 0, end: 100 }],
    }
  }

  /* 创建浅色折线图选项 */
  function createLightLineChartOption(
    title: string,
    xData: string[],
    series: { name: string; data: number[]; color?: string }[]
  ) {
    const lightBase = createLightBaseOption()
    return {
      ...lightBase,
      title: { text: title, left: 'center' },
      xAxis: { ...lightBase.xAxis, data: xData },
      series: series.map((s, i) => ({
        name: s.name,
        type: 'line' as const,
        data: s.data,
        smooth: true,
        lineStyle: { width: 2 },
        itemStyle: { color: s.color || Object.values(colors)[i % 7] },
        areaStyle: i === 0 ? {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: (s.color || colors.strawberry) + '40' },
              { offset: 1, color: (s.color || colors.strawberry) + '05' },
            ],
          },
        } : undefined,
      })),
    }
  }

  /* 创建浅色柱状图选项 */
  function createLightBarChartOption(
    title: string,
    xData: string[],
    series: { name: string; data: number[]; color?: string }[]
  ) {
    const lightBase = createLightBaseOption()
    return {
      ...lightBase,
      title: { text: title, left: 'center' },
      xAxis: { ...lightBase.xAxis, data: xData },
      series: series.map((s, i) => ({
        name: s.name,
        type: 'bar' as const,
        data: s.data,
        itemStyle: {
          color: s.color || Object.values(colors)[i % 7],
          borderRadius: [4, 4, 0, 0],
        },
        barMaxWidth: 40,
      })),
    }
  }

  /* 创建浅色散点图选项 */
  function createLightScatterChartOption(
    title: string,
    series: { name: string; data: [number, number][]; color?: string }[]
  ) {
    const lightBase = createLightBaseOption()
    return {
      ...lightBase,
      title: { text: title, left: 'center' },
      xAxis: { ...lightBase.xAxis, type: 'value' as const },
      series: series.map((s, i) => ({
        name: s.name,
        type: 'scatter' as const,
        data: s.data,
        symbolSize: 8,
        itemStyle: { color: s.color || Object.values(colors)[i % 7] },
      })),
    }
  }

  /* 甘特图时间轴选项 - 浅色主题 */
  function ganttTimelineLightOption(events: import('@/engine/types').PhenologyEvent[]) {
    if (events.length === 0) {
      const lightBase = createLightBaseOption()
      return { ...lightBase, title: { text: '物候甘特图', left: 'center' }, xAxis: { ...lightBase.xAxis, data: [] }, series: [] }
    }

    function formatDate(dateNum: number): string {
      const s = String(dateNum)
      return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
    }

    const categories = events.map(e => e.name)
    const startDates = events.map(e => formatDate(e.startDate))
    const endDates = events.map(e => {
      const startDate = new Date(
        Math.floor(e.startDate / 10000),
        Math.floor((e.startDate % 10000) / 100) - 1,
        e.startDate % 100
      )
      const endDate = new Date(startDate.getTime() + e.duration * 86400000)
      return `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
    })

    return {
      ...createLightBaseOption(),
      title: { text: '物候甘特图', left: 'center' },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E7EB',
        textStyle: { color: '#374151' },
        formatter: (params: any) => {
          const idx = params[0]?.dataIndex ?? 0
          const ev = events[idx]
          if (!ev) return ''
          return `<strong>${ev.name}</strong><br/>` +
            `预测日期: ${formatDate(ev.startDate)}<br/>` +
            `持续: ${ev.duration}天<br/>` +
            `累积GDD: ${ev.endGdd} °C·d<br/>` +
            `置信度: ${(0.85 * 100).toFixed(0)}%`
        },
      },
      grid: { left: 120, right: 30, top: 40, bottom: 50 },
      xAxis: {
        type: 'time' as const,
        axisLine: { lineStyle: { color: '#D1D5DB' } },
        axisLabel: { color: '#6B7280', formatter: '{MM}-{dd}' },
        splitLine: { lineStyle: { color: '#F3F4F6' } },
      },
      yAxis: {
        type: 'category' as const,
        data: categories,
        axisLine: { lineStyle: { color: '#D1D5DB' } },
        axisLabel: { color: '#6B7280', fontSize: 12 },
      },
      series: events.map((ev, i) => ({
        name: ev.name,
        type: 'custom' as const,
        renderItem: (_params: any, api: any) => {
          const categoryIndex = api.value(0)
          const start = api.coord([api.value(1), categoryIndex])
          const end = api.coord([api.value(2), categoryIndex])
          const height = api.size([0, 1])[1] * 0.6
          const rectShape = {
            x: start[0],
            y: start[1] - height / 2,
            width: end[0] - start[0],
            height,
          }
          return {
            type: 'rect',
            transition: ['shape'],
            shape: rectShape,
            style: {
              fill: stageColors[ev.name] || Object.values(colors)[i % 7],
              opacity: 0.85,
            },
          }
        },
        encode: {
          x: [1, 2],
          y: 0,
        },
        data: [[i, startDates[i], endDates[i]]],
      })),
    }
  }

  /* 风险指数折线图选项 - 浅色主题 */
  function riskIndexLightOption(pestRisks: import('@/engine/types').PestRiskRecord[]) {
    const lightBase = createLightBaseOption()
    if (pestRisks.length === 0) {
      return { ...lightBase, title: { text: '风险指数趋势', left: 'center' }, xAxis: { ...lightBase.xAxis, data: [] }, series: [] }
    }

    const allDates = [...new Set(pestRisks.map(p => String(p.dailyRiskIndex[0].date)))].sort()

    const riskLevelValue = (level: string) => {
      switch (level) {
        case 'critical': return 100
        case 'high': return 75
        case 'medium': return 50
        case 'low': return 25
        default: return 0
      }
    }

    return {
      ...lightBase,
      title: { text: '风险预警', left: 'center' },
      legend: {
        ...lightBase.legend,
        top: 30,
      },
      grid: { left: 60, right: 30, top: 60, bottom: 50 },
      xAxis: { ...lightBase.xAxis, data: allDates },
      yAxis: {
        ...lightBase.yAxis,
        name: '风险等级',
        max: 100,
      },
      series: pestRisks.map((p, i) => ({
        name: p.name,
        type: 'line' as const,
        data: allDates.map(date => date === String(p.dailyRiskIndex[0].date) ? riskLevelValue(p.riskLevel) : null),
        smooth: true,
        lineStyle: { width: 2 },
        itemStyle: { color: riskColors[p.riskLevel] || Object.values(colors)[i % 7] },
        connectNulls: true,
      })),
    }
  }

  /* 逐日产量曲线选项 - 浅色主题 (折线面积图) */
  function yieldCurveLightOption(
    dailyOutputs: import('@/engine/types').DailyOutput[],
    harvests: import('@/engine/types').HarvestRecord[]
  ) {
    const lightBase = createLightBaseOption()
    if (dailyOutputs.length === 0) {
      return { ...lightBase, title: { text: '产量曲线', left: 'center' }, xAxis: { ...lightBase.xAxis, data: [] }, series: [] }
    }

    function formatDate(dateNum: number): string {
      const s = String(dateNum)
      return `${s.slice(4, 6)}-${s.slice(6, 8)}`
    }

    const dates = dailyOutputs.map(d => formatDate(d.day))
    const dailyYield = dailyOutputs.map(d => d.fruitWt > 0 ? Math.round(d.fruitWt * 0.12 * 10) / 10 : 0)

    let cumYield = 0
    const cumulativeYield = dailyYield.map(y => {
      cumYield += y
      return Math.round(cumYield * 10) / 10
    })

    return {
      ...lightBase,
      title: { text: '逐日产量曲线', left: 'center' },
      legend: { ...lightBase.legend, top: 30 },
      grid: { left: 60, right: 60, top: 60, bottom: 50 },
      xAxis: { ...lightBase.xAxis, data: dates },
      yAxis: [
        {
          type: 'value' as const,
          name: '日产量 (kg/ha)',
          axisLine: { lineStyle: { color: '#D1D5DB' } },
          axisLabel: { color: '#6B7280' },
          splitLine: { lineStyle: { color: '#F3F4F6' } },
        },
        {
          type: 'value' as const,
          name: '累积产量 (kg/ha)',
          axisLine: { lineStyle: { color: '#D1D5DB' } },
          axisLabel: { color: '#6B7280' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '日产量',
          type: 'line' as const,
          data: dailyYield,
          smooth: true,
          lineStyle: { width: 2, color: '#EF4444' },
          itemStyle: { color: '#EF4444' },
          areaStyle: {
            color: {
              type: 'linear' as const,
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#EF444430' },
                { offset: 1, color: '#EF444405' },
              ],
            },
          },
        },
        {
          name: '累积产量',
          type: 'line' as const,
          yAxisIndex: 1,
          data: cumulativeYield,
          smooth: true,
          lineStyle: { width: 2, color: colors.forest },
          itemStyle: { color: colors.forest },
          areaStyle: {
            color: {
              type: 'linear' as const,
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: colors.forest + '30' },
                { offset: 1, color: colors.forest + '05' },
              ],
            },
          },
        },
      ],
    }
  }

  /* 环形图选项 - 头茬/二茬比例 */
  function donutChartOption(data: { name: string; value: number; color: string }[]) {
    return {
      ...lightChartTheme,
      tooltip: {
        trigger: 'item' as const,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E7EB',
        textStyle: { color: '#374151' },
      },
      legend: {
        top: '5%',
        left: 'center',
        textStyle: { color: '#374151' },
      },
      series: [
        {
          name: '产量比例',
          type: 'pie' as const,
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            position: 'outside' as const,
            formatter: '{b}\n{c} t/ha\n{d}%',
            color: '#374151',
          },
          labelLine: {
            show: true,
            lineStyle: { color: '#D1D5DB' },
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          data: data.map(d => ({
            name: d.name,
            value: d.value,
            itemStyle: { color: d.color },
          })),
        },
      ],
    }
  }

  return {
    baseOption,
    colors,
    stageColors,
    riskColors,
    chartTheme,
    lightChartTheme,
    createLightBaseOption,
    createLineChartOption,
    createBarChartOption,
    createScatterChartOption,
    createLightLineChartOption,
    createLightBarChartOption,
    createLightScatterChartOption,
    ganttTimelineOption,
    ganttTimelineLightOption,
    riskIndexOption,
    riskIndexLightOption,
    yieldCurveOption,
    yieldCurveLightOption,
    qualityScatterOption,
    donutChartOption,
  }
}
