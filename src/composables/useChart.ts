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
import type { DailyResult } from '@/stores/simulation'
import type { PhenologyEvent, PestRiskRecord, HarvestRecord } from '@/engine/types'

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
  function riskIndexOption(_pestRisks?: PestRiskRecord[]) {
    /* 病虫害颜色映射 */
    const pestColorMap: Record<string, string> = {
      '灰霉病': '#8B5CF6',
      '蚜虫': '#F97316',
      '红蜘蛛': '#22C55E',
      '白粉病': '#EC4899',
      '炭疽病': '#EF4444',
    }

    if (_pestRisks && _pestRisks.length > 0) {
      /* 从真实数据构建图表 - 按月聚合每日风险指数 */
      const monthLabels = ['10月', '11月', '12月', '1月', '2月', '3月', '4月', '5月']

      const series = _pestRisks.map(risk => {
        /* 按月聚合风险指数 */
        const monthlyData: Record<string, number[]> = {}
        for (const ml of monthLabels) monthlyData[ml] = []

        for (const dr of risk.dailyRiskIndex) {
          const dateStr = dr.date
          const month = parseInt(dateStr.length === 8 ? dateStr.slice(4, 6) : dateStr.slice(5, 7))
          const monthIdx = month >= 10 ? month - 10 : month + 3
          if (monthIdx >= 0 && monthIdx < monthLabels.length) {
            monthlyData[monthLabels[monthIdx]].push(dr.index)
          }
        }

        const avgByMonth = monthLabels.map(ml => {
          const vals = monthlyData[ml]
          return vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0
        })

        return {
          name: risk.name,
          type: 'bar' as const,
          data: avgByMonth,
          itemStyle: { color: pestColorMap[risk.name] ?? '#6b7280', borderRadius: [3, 3, 0, 0] },
          barMaxWidth: 20,
        }
      })

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
          data: _pestRisks.map(r => r.name),
          textStyle: { color: '#9CA3AF' },
          top: 5,
        },
        xAxis: {
          type: 'category' as const,
          data: monthLabels,
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
        series,
      }
    }

    /* 无数据时显示空图表 */
    return {
      ...chartTheme,
      grid: { left: 50, right: 20, top: 40, bottom: 40 },
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
        textStyle: { color: '#6b7280', fontSize: 14, fontWeight: 'normal' },
      },
      xAxis: {
        type: 'category' as const,
        data: [],
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { color: '#9CA3AF' },
      },
      yAxis: {
        type: 'value' as const,
        max: 100,
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { color: '#9CA3AF' },
        splitLine: { lineStyle: { color: 'rgba(55, 65, 81, 0.5)' } },
      },
      series: [],
    }
  }

  /* 产量预测折线图 */
  function yieldCurveOption(_dailyOutputs?: DailyResult[], _harvests?: HarvestRecord[]) {
    if (_dailyOutputs && _dailyOutputs.length > 0) {
      /* 从真实模拟数据构建产量曲线 */
      const xData = _dailyOutputs.map(r => {
        const parts = r.date.split('-')
        return `${parseInt(parts[1])}/${parseInt(parts[2])}`
      })
      const fruitData = _dailyOutputs.map(r => Math.round(r.fruitWeight * 10) / 10)

      return {
        ...chartTheme,
        grid: { left: 60, right: 30, top: 40, bottom: 50 },
        tooltip: {
          trigger: 'axis' as const,
          backgroundColor: 'rgba(26, 27, 46, 0.9)',
          borderColor: 'rgba(45, 49, 66, 0.5)',
          textStyle: { color: '#F3F4F6' },
        },
        dataZoom: [
          {
            type: 'inside' as const,
            start: 0,
            end: 100,
          },
        ],
        xAxis: {
          type: 'category' as const,
          data: xData,
          axisLine: { lineStyle: { color: '#374151' } },
          axisLabel: { color: '#9CA3AF', interval: Math.floor(xData.length / 8) },
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
            data: fruitData,
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

    /* 无数据时显示空图表 */
    return {
      ...chartTheme,
      grid: { left: 60, right: 30, top: 40, bottom: 50 },
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
        textStyle: { color: '#6b7280', fontSize: 14, fontWeight: 'normal' },
      },
      xAxis: {
        type: 'category' as const,
        data: [],
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { color: '#9CA3AF' },
      },
      yAxis: {
        type: 'value' as const,
        name: '产量 (kg/ha)',
        nameTextStyle: { color: '#9CA3AF' },
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { color: '#9CA3AF' },
        splitLine: { lineStyle: { color: 'rgba(55, 65, 81, 0.5)' } },
      },
      series: [],
    }
  }

  /* 第一/二茬占比环形图 */
  function donutChartOption(data?: { name: string; value: number; color: string }[]) {
    const hasValidData = data && data.length > 0 && data.some(d => d.value > 0)

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
        data: hasValidData
          ? data!.map(d => ({ value: d.value, name: d.name, itemStyle: { color: d.color } }))
          : [
              { value: 0, name: '暂无数据', itemStyle: { color: '#374151' } },
            ],
      },
    ],
    }
  }

  /* 甘特图时间轴选项 */
  function ganttTimelineOption(_events?: PhenologyEvent[]) {
    /* 阶段颜色映射 */
    const stageColorMap: Record<string, string> = {
      '萌芽期': '#4ade80',
      '营养生长期': '#22c55e',
      '花芽分化期': '#f97316',
      '开花期': '#f97316',
      '结果期': '#ef4444',
      '果实膨大期': '#ef4444',
      '采收期': '#78716c',
    }

    if (_events && _events.length > 0) {
      /* 从真实物候事件构建甘特图 */
      const yLabels = _events.map(e => e.name).reverse()
      const monthLabels = ['9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月', '5月']

      /* 计算每个阶段跨越的月份数 */
      const barData = _events.map(e => {
        const startMonth = Math.floor((e.startDate % 10000) / 100)
        const endMonth = Math.floor((e.endDate % 10000) / 100)
        /* 将月份映射到月标签索引: 9月=0, 10月=1, ..., 4月=7, 5月=8 */
        const startIdx = startMonth >= 9 ? startMonth - 9 : startMonth + 3
        const endIdx = endMonth >= 9 ? endMonth - 9 : endMonth + 3
        const duration = Math.max(1, endIdx - startIdx + 1)
        return {
          value: duration,
          itemStyle: { color: stageColorMap[e.name] ?? '#6b7280' },
        }
      }).reverse()

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
          data: monthLabels,
          axisLine: { lineStyle: { color: '#374151' } },
          axisLabel: { color: '#9CA3AF' },
        },
        yAxis: {
          type: 'category' as const,
          data: yLabels,
          axisLine: { lineStyle: { color: '#374151' } },
          axisLabel: { color: '#9CA3AF' },
        },
        series: [
          {
            type: 'bar',
            stack: 'total',
            data: barData,
            barWidth: 20,
            itemStyle: { borderRadius: 4 },
          },
        ],
      }
    }

    /* 无数据时显示空图表 */
    return {
      ...chartTheme,
      grid: { left: 100, right: 30, top: 20, bottom: 30 },
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
        textStyle: { color: '#6b7280', fontSize: 14, fontWeight: 'normal' },
      },
      xAxis: {
        type: 'category' as const,
        data: [],
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { color: '#9CA3AF' },
      },
      yAxis: {
        type: 'category' as const,
        data: [],
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { color: '#9CA3AF' },
      },
      series: [],
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
