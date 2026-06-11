<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  visible: boolean
  version: string
}>()

const emit = defineEmits<{
  close: []
}>()

const activeSection = ref('overview')

/* 版本切换时重置到概述 */
watch(() => props.version, () => {
  activeSection.value = 'overview'
})

/* V1 导航分区 */
const v1Sections = [
  { id: 'overview', label: '概述', icon: '📖' },
  { id: 'config', label: '模拟配置', icon: '⚙️' },
  { id: 'simulation', label: '模拟运行', icon: '▶️' },
  { id: 'results', label: '结果分析', icon: '📊' },
  { id: 'cultivars', label: '品种库', icon: '🌱' },
  { id: 'data', label: '数据管理', icon: '📁' },
]

/* V2 导航分区 */
const v2Sections = [
  { id: 'overview', label: '概述', icon: '📖' },
  { id: 'basic-info', label: '基础信息', icon: '📋' },
  { id: 'phenology', label: '物候方案', icon: '🌱' },
  { id: 'pest', label: '植保IPM', icon: '🛡️' },
  { id: 'operations', label: '农事操作', icon: '🚜' },
  { id: 'yield', label: '产量预测', icon: '📊' },
]

const sections = computed(() => {
  return props.version === 'v1' ? v1Sections : v2Sections
})

/* V1 使用手册内容 */
const v1Manual: Record<string, { title: string; items: string[] }> = {
  overview: {
    title: 'V1 模拟器模式 - 系统概述',
    items: [
      'V1为专业模拟器模式，面向农学研究人员和DSSAT模型用户',
      '基于DSSAT CROPGRO-Strawberry模型，提供逐日生长模拟',
      '支持自定义气象、土壤、品种和管理参数',
      '核心流程：配置参数 → 运行模拟 → 分析结果',
      '模拟引擎使用品种的DSSAT遗传系数（p1v/p1r/p3/p4）驱动物候发育',
      '支持13个内置品种，涵盖短日型和日中性两大类',
    ],
  },
  config: {
    title: '模拟配置',
    items: [
      '【气象配置】选择区域后自动生成180天气象数据，也可上传气象文件',
      '【区域选择】内置6个典型产区：Florida Balm(亚热带)、California Salinas(地中海)、上海(亚热带季风)、昆明(高原)、北京(暖温带季风)、南京(亚热带季风)',
      '【气象数据】包含太阳辐射、最高/最低温、降水量等逐日数据',
      '【气象文件上传】支持 .WTH（DSSAT格式）和 .xlsx/.xls（Excel格式）文件，点击上传区域或拖放文件即可',
      '【Excel模板】点击"下载模板"获取标准Excel气象数据模板，按模板格式填写后上传即可参与模拟计算',
      '【Excel列名】支持中文列名（日期/太阳辐射(MJ/m²)/最高温(℃)/最低温(℃)/降水量(mm)）或英文列名（date/srad/tmax/tmin/rain）',
      '【土壤配置】可添加/删除土层，编辑每层的容重、砂粒、粘粒、有机质、pH、有效含水量',
      '【品种选择】从13个内置品种中选择，选中后自动加载DSSAT CROPGRO参数',
      '【品种参数】展示选中品种的遗传系数，支持编辑模式微调参数（点击"编辑参数"），可"恢复默认"',
      '【管理配置】设置定植日期、种植密度（株/m²）',
      '【灌溉事件】添加/删除灌溉事件，设置日期、灌水量(mm)和灌溉方式',
      '【施肥事件】添加/删除施肥事件，设置日期、施肥量(kg/ha)和肥料类型',
      '配置完成后点击"开始模拟"进入模拟运行页面',
    ],
  },
  simulation: {
    title: '模拟运行',
    items: [
      '点击"开始"按钮运行完整模拟，系统将逐日计算生长状态',
      '模拟进度条显示当前完成百分比',
      '速度滑块控制模拟运行速度（1x-10x）',
      '实时显示7项关键指标：当前天数、生育阶段、LAI、总生物量、果实重、水分胁迫、氮素胁迫',
      'LAI趋势图实时更新，展示叶面积指数随时间的变化',
      '事件日志记录模拟过程中的关键事件',
      '支持暂停和重置操作',
    ],
  },
  results: {
    title: '结果分析',
    items: [
      '【生长曲线】展示LAI、总生物量、果实重量的逐日变化趋势',
      '【产量统计】总产量(kg/ha)、果实数量、平均果重(g)、采收日期',
      '【品质分析】可溶性固形物(SSC)、酸度、硬度等品质指标',
      '【对比分析】不同品种或管理方案的模拟结果对比',
      '模拟结果可导出为JSON或CSV格式',
      '所有图表支持交互操作：缩放、拖拽、数据点查看',
    ],
  },
  cultivars: {
    title: '品种库',
    items: [
      '展示系统内置的13个草莓品种的完整DSSAT参数',
      '品种分类：短日型（Radiance/Brilliance/Camarosa/红颜/丰香/章姬/妙香七号等）和日中性（Albion/Seascape/Monterey/San Andreas等）',
      '每个品种展示：品种代码、生态型、果实描述、品质参数（单果重/糖度/硬度/收获指数）',
      '展开可查看DSSAT CROPGRO品种参数：p1v(营养生长积温)、p1r(生殖生长积温)、p3(开花积温)、p4(结果积温)',
      '展开可查看生态型参数：基温、最适温、光周期临界值、分配系数等',
      '显示品种可靠性评级和需冷量信息',
      '点击品种卡片可选中该品种用于模拟',
    ],
  },
  data: {
    title: '数据管理',
    items: [
      '【气象数据】查看和编辑当前气象配置，支持上传 .WTH 和 .xlsx/.xls 格式气象文件',
      '【Excel上传】上传Excel气象数据文件，系统自动解析并替换当前气象数据参与模拟计算',
      '【模板下载】点击"下载气象数据模板"获取标准Excel模板，含示例数据和填写说明',
      '【土壤数据】查看和编辑土壤剖面参数',
      '【品种数据】查看品种参数详情',
      '【导出配置】将当前配置导出为JSON文件，方便保存和分享',
      '【导入配置】从JSON文件导入配置，快速恢复之前的模拟设置',
      '支持拖放上传文件',
    ],
  },
}

/* V2 使用手册内容 */
const v2Manual: Record<string, { title: string; items: string[] }> = {
  overview: {
    title: 'V2 决策支持模式 - 系统概述',
    items: [
      'V2为决策支持模式，面向草莓种植者和农技人员',
      '基于DSSAT CROPGRO-Strawberry模型，提供全年种植方案',
      '一站式流程：基础信息 → 物候方案 → 植保IPM → 农事操作 → 产量预测',
      '填写基础信息后一键生成完整年度种植方案',
      '所有预测基于品种遗传系数和区域气候特征计算',
      '支持13个内置品种（短日型/日中性）和6个典型产区',
    ],
  },
  'basic-info': {
    title: '基础信息',
    items: [
      '【品种选择】从13个内置品种中选择，显示品种类型标签（短日型/日中性）、产地和特性描述',
      '短日型品种：需短日照触发花芽分化，适合秋冬定植、冬春采收（如Radiance、红颜）',
      '日中性品种：对日照长度不敏感，可连续开花结果（如Albion、Seascape）',
      '【定植日期】选择实际定植日期，系统据此计算全年物候时间轴',
      '【秧苗状态】健壮苗(4-5片展开叶)/中等苗(3-4片)/弱苗(2-3片)，影响前期生长速率',
      '【种植区域】选择产区后自动加载气候数据，显示温度和降雨特征',
      '【定植密度】推荐4.0-5.0株/m²，行距30cm株距12cm',
      '【栽培模式】露地/温室/高隧道/立体栽培，影响温度和湿度管理策略',
      '【灌溉条件】膜下滴灌(推荐)/喷灌/漫灌/雨养',
      '【土壤肥力】低/中/高肥力，影响施肥方案推荐量',
      '【气象文件】可选上传气象文件替代默认气象数据，支持 .WTH（DSSAT格式）和 .xlsx/.xls（Excel格式）',
      '【Excel模板】点击"下载模板"获取标准Excel气象数据模板，按模板格式填写后上传即可参与模拟计算',
      '【Excel列名】支持中文列名（日期/太阳辐射(MJ/m²)/最高温(℃)/最低温(℃)/降水量(mm)）或英文列名（date/srad/tmax/tmin/rain）',
      '填写完成后点击"生成年度种植方案"，系统将运行模拟并生成全部5个模块的方案',
    ],
  },
  phenology: {
    title: '物候方案',
    items: [
      '基于品种积温参数(p1v/p1r/p3/p4)和区域气候数据预测全年物候时间轴',
      '展示4个关键阶段：营养生长期、花芽分化-开花、第一茬果、采收结束',
      '每个阶段显示持续天数和日期范围',
      '全生育期时间轴以色段形式直观展示各阶段占比',
      '关键节点流程：定植→花芽分化→始花→坐果→第一茬采收→高峰→拉秧',
      '各物候阶段参数表格：起止日期、天数、日均温、日长',
      '底部提示品种的光周期特性和花芽分化触发条件',
      '物候数据由模拟引擎根据实际气象条件动态计算',
    ],
  },
  pest: {
    title: '植保IPM（综合病虫害管理）',
    items: [
      '基于物候期和气象条件的病虫害风险预测',
      '4类主要风险：灰霉病(高湿+适温)、蚜虫(定植初期)、红蜘蛛(高温干燥)、白粉病(大温差)',
      '风险等级：低/中/高/极高，由实际气象数据驱动计算',
      '月度风险指数图表展示各病虫害风险随时间的变化趋势',
      '防治方案表格：病虫害名称、高发期、防治阈值、推荐药剂',
      'IPM核心原则：①监测(黄板蓝板)→②生防(捕食螨)→③化防(避花期)→④栽培(控湿)',
      '风险指数基于温度、湿度、降水量等实际气象条件计算，非随机生成',
    ],
  },
  operations: {
    title: '农事操作',
    items: [
      '全生育期农事操作日历，按生长阶段组织',
      '关键管理参数：灌溉方式、施N量、覆膜、密度',
      '9个关键操作阶段：整地起垄→定植→营养生长期→花芽分化期→开花坐果期→第一茬果管理→采收管理→采收高峰→拉秧',
      '每个阶段包含：时间范围、阶段标签、详细操作内容',
      '操作内容由模拟引擎根据品种类型（短日型/日中性）和物候进度动态生成',
      '灌溉施肥方案：分阶段推荐施肥量和灌溉频率',
      '短日型品种额外提示短日处理操作',
      '日中性品种提示连续采收期的营养补充',
    ],
  },
  yield: {
    title: '产量预测',
    items: [
      '基于品种潜力和环境条件的产量预估',
      '4项关键指标：鲜果总产(t/ha)、单果重(g)、第一茬占比(%)、采收天数',
      '产量曲线图展示逐日产量变化趋势',
      '茬次占比环形图：第一茬和第二茬的产量比例',
      '品种的第一茬/第二茬占比由品种参数(firstFlushRatio/secondFlushRatio)决定',
      '详细预测表格：鲜果总产、单株产量、单果重、果数/株、收获指数、平均SSC等',
      '产量数据由模拟引擎逐日计算累积，基于品种收获指数和果实干物质含量',
      '所有数值可导出用于进一步分析',
    ],
  },
}

const manualContent = computed(() => {
  return props.version === 'v1' ? v1Manual : v2Manual
})
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="visible" class="drawer-overlay" @click.self="emit('close')">
        <div class="drawer-panel">
          <div class="drawer-header">
            <h2 style="font-size: 18px; font-weight: 600; color: var(--text-primary)">
              📖 使用手册
            </h2>
            <span class="card-badge" style="margin-left: 8px">{{ version === 'v1' ? 'V1 模拟器模式' : 'V2 决策支持' }}</span>
            <button class="drawer-close" @click="emit('close')">✕</button>
          </div>

          <div class="drawer-body">
            <div class="drawer-nav">
              <button
                v-for="section in sections"
                :key="section.id"
                :class="['drawer-nav-item', { active: activeSection === section.id }]"
                @click="activeSection = section.id"
              >
                <span>{{ section.icon }}</span>
                <span>{{ section.label }}</span>
              </button>
            </div>

            <div class="drawer-content">
              <h3 style="font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 16px">
                {{ manualContent[activeSection]?.title }}
              </h3>
              <ul style="list-style: none; padding: 0; margin: 0">
                <li
                  v-for="(item, idx) in manualContent[activeSection]?.items"
                  :key="idx"
                  style="padding: 10px 0; border-bottom: 1px solid var(--border-color); color: var(--text-secondary); font-size: 14px; line-height: 1.6"
                >
                  {{ item }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.drawer-panel {
  width: 520px;
  height: 100%;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
}

.drawer-header {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.drawer-close {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.drawer-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.drawer-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.drawer-nav {
  width: 180px;
  padding: 16px 12px;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.drawer-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.drawer-nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.drawer-nav-item.active {
  background: var(--highlight-bg);
  color: var(--accent-blue);
}

.drawer-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(100%);
}
</style>
