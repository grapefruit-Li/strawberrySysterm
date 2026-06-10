# StrawSim 草莓作物模拟系统 - 本地运行指南

## 1. 系统简介

StrawSim 是一个基于 DSSAT CROPGRO-Strawberry 作物模型的纯前端草莓生长模拟与决策支持系统。所有计算逻辑在浏览器端运行，无需后端服务器。

核心技术栈：Vue 3 + TypeScript + Vite + Pinia + ECharts + Tailwind CSS

---

## 2. 环境要求

### 2.1 必需软件

| 软件 | 最低版本 | 推荐版本 | 说明 |
|------|----------|----------|------|
| Node.js | 18.0+ | 20.x LTS | JavaScript 运行时 |
| pnpm | 8.0+ | 9.x | 包管理器（推荐） |
| Git | 2.30+ | 最新 | 版本控制 |

> 也可使用 npm 或 yarn 替代 pnpm，但以下文档以 pnpm 为准。

### 2.2 操作系统支持

- Windows 10/11
- macOS 12+
- Linux（Ubuntu 20.04+、CentOS 8+ 等）

### 2.3 浏览器要求

- Chrome 90+（推荐）
- Firefox 90+
- Edge 90+
- Safari 15+

---

## 3. 环境安装

### 3.1 安装 Node.js

**方式一：官方安装包（推荐新手）**

从 Node.js 官网下载 LTS 版本：https://nodejs.org/

**方式二：使用 nvm（推荐开发者）**

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 重新加载终端
source ~/.bashrc

# 安装 Node.js 20 LTS
nvm install 20
nvm use 20

# 验证安装
node -v    # 应输出 v20.x.x
npm -v     # 应输出 10.x.x
```

### 3.2 安装 pnpm

```bash
# 使用 npm 全局安装
npm install -g pnpm

# 验证安装
pnpm -v    # 应输出 9.x.x
```

### 3.3 安装 Git

```bash
# Ubuntu/Debian
sudo apt install git

# macOS（已预装，或使用 Homebrew）
brew install git

# Windows：从 https://git-scm.com/ 下载安装包
```

---

## 4. 获取代码

### 4.1 克隆仓库

```bash
git clone <仓库地址> strawberrysim
cd strawberrysim
```

### 4.2 项目目录结构

```
strawberrysim/
├── index.html                  # 入口 HTML
├── package.json                # 项目依赖配置
├── vite.config.ts              # Vite 构建配置
├── tsconfig.json               # TypeScript 配置
├── tailwind.config.js          # Tailwind CSS 主题配置
├── postcss.config.js           # PostCSS 配置
├── .trae/documents/            # 产品文档（PRD、技术架构）
├── public/                     # 静态资源
└── src/                        # 源代码
    ├── main.ts                 # 应用入口
    ├── App.vue                 # 根组件
    ├── assets/                 # 样式和静态资源
    │   └── main.css            # 全局样式（Tailwind + 自定义组件类）
    ├── engine/                 # 核心模拟引擎
    │   ├── types.ts            # 类型定义（GrowthStage枚举、20+接口）
    │   ├── runner.ts           # 模拟运行器（日步长迭代主循环）
    │   ├── phenology.ts        # 物候发育模块（GDD计算、阶段转换）
    │   ├── photosynthesis.ts   # 光合生产模块（冠层光合、呼吸、分配）
    │   ├── soil-water.ts       # 土壤水分平衡（PET、蒸发、蒸腾、径流）
    │   ├── soil-nitrogen.ts    # 土壤氮素平衡（矿化、硝化、吸收）
    │   ├── strawberry.ts       # 草莓专用模块（连续开花、多次采收）
    │   ├── quality.ts          # 品质预测（SSC、酸度、硬度）
    │   ├── stress.ts           # 胁迫因子（水/氮/温度胁迫）
    │   └── index.ts            # 统一导出
    ├── parser/                 # DSSAT 文件解析器
    │   ├── types.ts            # 解析器类型定义
    │   ├── weather.ts          # .WTH 气象文件解析
    │   ├── soil.ts             # .SOL 土壤文件解析
    │   ├── cultivar.ts         # .CUL 品种文件解析
    │   ├── species.ts          # .SPE 物种文件解析
    │   ├── ecotype.ts          # .ECO 生态型文件解析
    │   └── index.ts            # 统一导出 + 文件类型检测
    ├── data/                   # 内置数据集
    │   ├── weather/            # 佛罗里达 Balm 气象数据
    │   ├── soil/               # 佛罗里达砂质土壤剖面
    │   ├── species/            # 草莓物种参数
    │   ├── cultivars/          # Florida Radiance/Brilliance 品种
    │   └── index.ts            # 统一导出 + defaultSimulationConfig()
    ├── stores/                 # Pinia 状态管理
    │   ├── simulation.ts       # 模拟状态（进度、结果、事件日志）
    │   ├── config.ts           # 配置管理（气象/土壤/品种/管理参数）
    │   └── cultivar.ts         # 品种库管理
    ├── composables/            # Vue 组合式函数
    │   ├── useSimulation.ts    # 模拟运行控制（完整/步进模式、导出）
    │   ├── useChart.ts         # ECharts 图表配置工厂
    │   └── useFileParser.ts    # 文件解析（拖放上传、格式检测）
    ├── components/layout/      # 布局组件
    │   ├── AppLayout.vue       # 主布局（侧边栏 + 头栏 + 内容区）
    │   ├── AppSidebar.vue      # 侧边栏导航
    │   └── AppHeader.vue       # 顶部头栏
    ├── pages/                  # 页面组件
    │   ├── ConfigPage.vue      # 模拟配置页（气象/土壤/品种/管理）
    │   ├── SimulationPage.vue  # 模拟运行页（仪表盘、进度、日志）
    │   ├── ResultsPage.vue     # 结果分析页（图表、品质、策略对比）
    │   ├── CultivarsPage.vue   # 品种参数库页
    │   └── DataPage.vue        # 数据管理页（导入/导出/历史）
    ├── router/                 # 路由配置
    │   └── index.ts            # 5 条路由，懒加载
    └── lib/                    # 工具函数
        └── utils.ts            # CSS 类名合并工具
```

---

## 5. 安装依赖

```bash
cd strawberrysim

# 安装全部依赖
pnpm install
```

如果遇到 pnpm 构建脚本权限问题：

```bash
# 允许构建脚本执行
pnpm approve-builds
# 然后重新安装
pnpm install
```

### 依赖说明

**运行时依赖（dependencies）：**

| 包名 | 版本 | 用途 |
|------|------|------|
| vue | ^3.5 | 前端框架 |
| vue-router | ^4.6 | 路由管理 |
| pinia | ^2.3 | 状态管理 |
| echarts | ^5.6 | 数据可视化图表 |
| vue-echarts | ^7.0 | ECharts 的 Vue 3 封装 |
| lucide-vue-next | ^0.511 | 图标库 |
| dexie | ^4.4 | IndexedDB 封装（本地存储） |

**开发依赖（devDependencies）：**

| 包名 | 版本 | 用途 |
|------|------|------|
| vite | ^6.3 | 构建工具 + 开发服务器 |
| typescript | ~5.7 | TypeScript 编译器 |
| vue-tsc | ^2.2 | Vue 文件的类型检查 |
| @vitejs/plugin-vue | ^5.2 | Vite 的 Vue 插件 |
| tailwindcss | ^3.4 | 原子化 CSS 框架 |
| postcss | ^8.5 | CSS 处理工具 |
| autoprefixer | ^10.5 | CSS 自动添加浏览器前缀 |
| @types/node | ^22.0 | Node.js 类型定义 |

---

## 6. 运行项目

### 6.1 开发模式

```bash
pnpm dev
```

启动后终端会显示：

```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

在浏览器中打开 `http://localhost:5173/` 即可访问系统。

> 如果 5173 端口被占用，Vite 会自动切换到下一个可用端口（如 5174）。

### 6.2 生产构建

```bash
# 类型检查 + 构建
pnpm build
```

构建产物输出到 `dist/` 目录，可直接部署到任何静态文件服务器。

### 6.3 预览生产构建

```bash
pnpm preview
```

在本地启动一个静态服务器预览生产构建结果。

---

## 7. 系统功能与使用

### 7.1 页面导航

系统包含 5 个主要页面，通过左侧导航栏切换：

| 路由 | 页面 | 功能 |
|------|------|------|
| `/` | 模拟配置 | 配置气象、土壤、品种、管理参数 |
| `/simulation` | 模拟运行 | 运行模拟、查看实时仪表盘 |
| `/results` | 结果分析 | 查看生长曲线、产量、品质图表 |
| `/cultivars` | 品种参数库 | 浏览和编辑品种参数 |
| `/data` | 数据管理 | 导入/导出文件、管理模拟历史 |

### 7.2 模拟运行流程

1. **配置参数**：在「模拟配置」页面设置气象、土壤、品种和管理参数，或点击「加载预设数据」使用内置的佛罗里达草莓种植数据
2. **运行模拟**：点击「开始模拟」按钮，系统将基于 CROPGRO-Strawberry 模型进行日步长迭代计算
3. **查看结果**：模拟完成后在「结果分析」页面查看生长曲线、产量分布和品质预测
4. **导出数据**：支持将模拟结果导出为 JSON 或 CSV 格式

### 7.3 内置数据集

系统内置了以下数据，可直接使用：

- **气象数据**：佛罗里达 Balm 站点（2020年10月 - 2021年3月，约180天）
- **土壤数据**：佛罗里达 Myakka 细砂土（5层剖面）
- **品种数据**：Florida Radiance 和 Florida Brilliance 两个品种
- **物种参数**：CROPGRO-Strawberry 完整物种参数

### 7.4 DSSAT 文件导入

支持导入标准 DSSAT 格式文件：

| 文件类型 | 扩展名 | 内容 |
|----------|--------|------|
| 气象文件 | `.WTH` | 逐日气象数据（辐射、温度、降雨等） |
| 土壤文件 | `.SOL` | 土壤剖面参数（层级、质地、水分特征） |
| 品种文件 | `.CUL` | 品种遗传参数 |
| 物种文件 | `.SPE` | 物种级参数 |
| 生态型文件 | `.ECO` | 生态型参数 |

---

## 8. 核心模块说明

### 8.1 模拟引擎（src/engine/）

模拟引擎是系统的核心，将 DSSAT CROPGRO-Strawberry 的 Fortran 模型移植为 TypeScript。主要模块：

| 模块 | 文件 | 功能 |
|------|------|------|
| 类型定义 | `types.ts` | GrowthStage 枚举、20+ 接口定义 |
| 运行器 | `runner.ts` | SimulationRunner 类，日步长迭代主循环 |
| 物候发育 | `phenology.ts` | 积温（GDD）计算、生育阶段转换、光周期效应 |
| 光合生产 | `photosynthesis.ts` | 冠层光合、维持呼吸、生长呼吸、干物质分配 |
| 土壤水分 | `soil-water.ts` | Priestley-Taylor PET、蒸发、蒸腾、SCS径流、排水 |
| 土壤氮素 | `soil-nitrogen.ts` | 矿化、硝化、反硝化、植物氮吸收 |
| 草莓专用 | `strawberry.ts` | 连续开花结果、同化物分配、多次采收 |
| 品质预测 | `quality.ts` | SSC、酸度、硬度预测（基于 Hopf et al. 2022） |
| 胁迫因子 | `stress.ts` | 水分/氮素/温度胁迫计算 |

### 8.2 日步长迭代流程

```
每日循环:
  1. 读取当日气象数据 (srad, tmax, tmin, rain)
  2. 计算土壤水分平衡 (蒸发、蒸腾、径流、渗漏)
  3. 计算土壤氮素平衡 (矿化、硝化、吸收)
  4. 计算物候发育速率 (积温、生育期推进)
  5. 计算冠层光合与呼吸
  6. 计算干物质分配 (叶/茎/根/果实)
  7. 草莓专用: 连续开花结果、多次采收
  8. 计算水分/氮素胁迫因子
  9. 更新植物和土壤状态
  10. 检查采收事件，记录产量和品质
  11. 输出当日结果
```

---

## 9. 常见问题

### 9.1 `pnpm install` 报错

**问题**：依赖安装失败或构建脚本被阻止

```bash
# 解决方案：允许构建脚本
pnpm approve-builds
pnpm install
```

### 9.2 开发服务器启动后崩溃（ENOSPC 错误）

**问题**：`Error: ENOSPC: System limit for number of file watchers reached`

**原因**：Linux 系统的文件监视器数量限制

**解决方案**：

```bash
# 临时增加限制
sudo sysctl fs.inotify.max_user_watches=524288

# 永久生效
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

项目已在 `vite.config.ts` 中配置了忽略 `node_modules` 和 `.pnpm-store` 的文件监视，可减少此问题发生。

### 9.3 端口被占用

**问题**：5173 端口已被其他程序使用

**解决方案**：Vite 会自动尝试下一个端口（5174、5175...），也可手动指定：

```bash
# 方式一：命令行指定端口
pnpm dev -- --port 3000

# 方式二：修改 vite.config.ts 中的 server.port
```

### 9.4 TypeScript 类型检查报错

```bash
# 运行类型检查
pnpm run build

# 如果只是开发调试，可直接使用 pnpm dev（不做类型检查）
```

### 9.5 图表不显示

确保浏览器窗口宽度足够（最小 1024px），ECharts 图表需要容器有明确的宽高。如果图表区域为空，尝试调整浏览器窗口大小。

---

## 10. 开发指南

### 10.1 添加新的作物模型

1. 在 `src/engine/` 下创建新模块文件（如 `wheat.ts`）
2. 在 `src/engine/types.ts` 中添加对应的类型定义
3. 在 `src/data/` 下添加内置数据集
4. 在 `src/engine/runner.ts` 中集成新模块

### 10.2 添加新的页面

1. 在 `src/pages/` 下创建新的 `.vue` 文件
2. 在 `src/router/index.ts` 中添加路由
3. 在 `src/components/layout/AppSidebar.vue` 中添加导航项

### 10.3 修改主题样式

- 颜色主题：修改 `tailwind.config.js` 中的 `colors` 配置
- 全局组件样式：修改 `src/assets/main.css` 中的 `@layer components`
- 字体：修改 `tailwind.config.js` 中的 `fontFamily` 和 `index.html` 中的 Google Fonts 链接

### 10.4 代码规范

- Vue 组件使用 `<script setup lang="ts">` 语法
- 组件文件使用 PascalCase 命名（如 `ConfigPage.vue`）
- 组合式函数以 `use` 前缀命名（如 `useSimulation.ts`）
- 代码注释使用中文
- 路径别名：`@/` 映射到 `src/`

---

## 11. 部署

### 11.1 构建生产版本

```bash
pnpm build
```

产物在 `dist/` 目录，为纯静态文件（HTML + JS + CSS），无需 Node.js 运行时。

### 11.2 部署到 GitHub Pages

```bash
# 安装 gh-pages 工具
npm install -g gh-pages

# 构建
pnpm build

# 部署
gh-pages -d dist
```

### 11.3 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. Framework Preset 选择 `Vue.js`
4. Build Command: `pnpm build`
5. Output Directory: `dist`

### 11.4 部署到 Nginx

```bash
# 构建
pnpm build

# 将 dist/ 目录复制到 Nginx 的静态文件目录
cp -r dist/* /usr/share/nginx/html/

# Nginx 配置（需要处理 SPA 路由）
# 在 nginx.conf 中添加：
# location / {
#     try_files $uri $uri/ /index.html;
# }
```

---

## 12. 参考资源

- [DSSAT 官网](https://dssat.net/)
- [DSSAT GitHub 仓库](https://github.com/DSSAT/dssat-csm-os)
- [CROPGRO-Strawberry 模型论文](https://doi.org/10.1016/j.scienta.2021.110538) (Hopf et al., 2022)
- [jDSSAT - JavaScript DSSAT 集成模块](https://www.npmjs.com/package/jdssat)
- [Vue 3 文档](https://cn.vuejs.org/)
- [Vite 文档](https://cn.vitejs.dev/)
- [ECharts 文档](https://echarts.apache.org/zh/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
