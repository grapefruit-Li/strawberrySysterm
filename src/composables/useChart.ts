import { ref } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, ScatterChart } from 'echarts/charts'
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

  return {
    baseOption,
    colors,
    chartTheme,
    createLineChartOption,
    createBarChartOption,
    createScatterChartOption,
  }
}
