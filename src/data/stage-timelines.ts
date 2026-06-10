/**
 * 农事阶段时间轴数据
 * 用于 V2 农事操作页面的横向阶段色条展示
 */
import type { StageTimeline } from '@/engine/types'

export const stageTimelines: StageTimeline[] = [
  {
    name: '定植前',
    startMonth: 8,
    endMonth: 9,
    color: '#6B7280',
    operations: ['整地起垄', '消毒', '施基肥'],
  },
  {
    name: '营养管理',
    startMonth: 9,
    endMonth: 10,
    color: '#22C55E',
    operations: ['缓苗', '营养生长', '促花'],
  },
  {
    name: '花芽分化',
    startMonth: 10,
    endMonth: 11,
    color: '#F59E0B',
    operations: ['控旺促花', '营养生长', '控氮增磷钾'],
  },
  {
    name: '开花坐果',
    startMonth: 11,
    endMonth: 12,
    color: '#EC4899',
    operations: ['疏花疏果', '保花保果', '蜜蜂授粉'],
  },
  {
    name: '第一茬果',
    startMonth: 12,
    endMonth: 1,
    color: '#F97316',
    operations: ['采收管理', '水肥调控', '品质管理'],
  },
  {
    name: '采收高峰',
    startMonth: 1,
    endMonth: 3,
    color: '#EF4444',
    operations: ['高产管理', '追肥', '病虫害防控'],
  },
  {
    name: '第二茬果',
    startMonth: 3,
    endMonth: 4,
    color: '#FCD34D',
    operations: ['拉秧', '清园', '下季准备'],
  },
]

/** 根据月份获取当前阶段 */
export function getStageByMonth(month: number): StageTimeline | undefined {
  return stageTimelines.find(s => month >= s.startMonth && month < s.endMonth)
}

/** 获取阶段色条配置（用于时间轴色条） */
export function getStageBarConfig() {
  return stageTimelines.map(s => ({
    name: s.name,
    startMonth: s.startMonth,
    endMonth: s.endMonth,
    color: s.color,
    widthPercent: ((s.endMonth - s.startMonth) / 8) * 100, // 基于9月-4月的8个月周期
  }))
}
