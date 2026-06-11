import { ref, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, ScatterChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
} from 'echarts/components'

/* 注册 ECharts 组件 */
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  ScatterChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
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

  /* 病虫害风险指数图表 */
  function riskIndexOption(_pestRisks?: any[]) {
    return {
    ...chartTheme,
    grid: { left: 50, right: 20, top: 40, bottom: 40 },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(26, 27, 46, 0.9)',
      borderColor: 'rgba(45, 49, 66, 0.5)',
      textStyle: { color: '#F3F4F6' },
    },
    legend: {
      data: ['灰霉病', '蚜虫', '红蜘蛛', '白粉病'],
      textStyle: { color: '#9CA3AF' },
      top: 5,
    },
    xAxis: {
      type: 'category' as const,
      data: ['10月', '11月', '12月', '1月', '2月', '3月'],
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9CA3AF' },
    },
    yAxis: {
      type: 'value' as const,
      name: '风险指数',
      nameTextStyle: { color: '#9CA3AF' },
      max: 100,
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9CA3AF' },
      splitLine: { lineStyle: { color: 'rgba(55, 65, 81, 0.5)' } },
    },
    series: [
      {
        name: '灰霉病',
        type: 'bar',
        data: [30, 65, 85, 70, 40, 20],
        itemStyle: { color: '#8B5CF6', borderRadius: [3, 3, 0, 0] },
        barMaxWidth: 20,
      },
      {
        name: '蚜虫',
        type: 'bar',
        data: [20, 40, 30, 25, 55, 70],
        itemStyle: { color: '#F97316', borderRadius: [3, 3, 0, 0] },
        barMaxWidth: 20,
      },
      {
        name: '红蜘蛛',
        type: 'bar',
        data: [15, 25, 20, 15, 45, 60],
        itemStyle: { color: '#22C55E', borderRadius: [3, 3, 0, 0] },
        barMaxWidth: 20,
      },
      {
        name: '白粉病',
        type: 'bar',
        data: [10, 35, 50, 45, 60, 40],
        itemStyle: { color: '#EC4899', borderRadius: [3, 3, 0, 0] },
        barMaxWidth: 20,
      },
    ],
    }
  }

  /* 产量预测折线图 */
  function yieldCurveOption(_dailyOutputs?: any[], _harvests?: any[]) {
    return {
    ...chartTheme,
    grid: { left: 60, right: 30, top: 40, bottom: 50 },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(26, 27, 46, 0.9)',
      borderColor: 'rgba(45, 49, 66, 0.5)',
      textStyle: { color: '#F3F4F6' },
    },
    xAxis: {
      type: 'category' as const,
      data: Array.from({ length: 30 }, (_, i) => `第${i + 1}周`),
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9CA3AF', interval: 4 },
    },
    yAxis: {
      type: 'value' as const,
      name: '产量 (kg/ha)',
      nameTextStyle: { color: '#9CA3AF' },
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9CA3AF' },
      splitLine: { lineStyle: { color: 'rgba(55, 65, 81, 0.5)' } },
    },
    series: [
      {
        name: '预测产量',
        type: 'line',
        smooth: true,
        data: [
          0, 0, 0, 0, 0, 0, 0, 0, 50, 120,
          250, 400, 580, 750, 900, 1050, 1180, 1280, 1350, 1400,
          1420, 1380, 1300, 1200, 1080, 950, 800, 650, 500, 350,
        ],
        lineStyle: { width: 2, color: '#22C55E' },
        itemStyle: { color: '#22C55E' },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(34, 197, 94, 0.3)' },
              { offset: 1, color: 'rgba(34, 197, 94, 0.02)' },
            ],
          },
        },
      },
    ],
    }
  }

  /* 第一/二茬占比环形图 */
  function donutChartOption(data?: { name: string; value: number; color: string }[]) {
    return {
    ...chartTheme,
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: 'rgba(26, 27, 46, 0.9)',
      borderColor: 'rgba(45, 49, 66, 0.5)',
      textStyle: { color: '#F3F4F6' },
    },
    legend: {
      orient: 'horizontal' as const,
      bottom: 10,
      textStyle: { color: '#9CA3AF' },
    },
    series: [
      {
        name: '产量占比',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#242b3d',
          borderWidth: 2,
        },
        label: {
          show: true,
          color: '#e6edf3',
          formatter: '{b}\n{d}%',
        },
        data: data && data.length > 0
          ? data.map(d => ({ value: d.value, name: d.name, itemStyle: { color: d.color } }))
          : [
              { value: 62, name: '第一茬果', itemStyle: { color: '#22C55E' } },
              { value: 38, name: '第二茬果', itemStyle: { color: '#3B82F6' } },
            ],
      },
    ],
    }
  }

  /* 甘特图时间轴选项 */
  function ganttTimelineOption(_events?: any[]) {
    return {
    ...chartTheme,
    grid: { left: 100, right: 30, top: 20, bottom: 30 },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(26, 27, 46, 0.9)',
      borderColor: 'rgba(45, 49, 66, 0.5)',
      textStyle: { color: '#F3F4F6' },
    },
    xAxis: {
      type: 'category' as const,
      data: ['10月', '11月', '12月', '1月', '2月', '3月'],
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9CA3AF' },
    },
    yAxis: {
      type: 'category' as const,
      data: ['采收', '果实膨大', '开花', '营养生长', '定植'],
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9CA3AF' },
    },
    series: [
      {
        type: 'bar',
        stack: 'total',
        data: [
          { value: 3, itemStyle: { color: '#78716c' } },
          { value: 3, itemStyle: { color: '#ef4444' } },
          { value: 2, itemStyle: { color: '#f97316' } },
          { value: 2, itemStyle: { color: '#22c55e' } },
          { value: 1, itemStyle: { color: '#4ade80' } },
        ],
        barWidth: 20,
        itemStyle: { borderRadius: 4 },
      },
    ],
    }
  }

  return {
    baseOption,
    colors,
    chartTheme,
    createLineChartOption,
    createBarChartOption,
    createScatterChartOption,
    riskIndexOption,
    yieldCurveOption,
    donutChartOption,
    ganttTimelineOption,
  }
}
