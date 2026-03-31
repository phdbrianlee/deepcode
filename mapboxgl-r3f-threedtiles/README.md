# mapboxgl-r3f-threedtiles

基于 React + Mapbox GL + @jdultra/threedtiles 的 3D Tiles 可视化演示应用。

## 功能特性

本项目展示如何将 **OGC 3D Tiles** 数据叠加到 **Mapbox GL** 地图上，实现大规模 3D 地理空间数据的可视化。

### 核心功能

- **3D Tiles 渲染**：支持 glTF、B3DM、SPZ (Gaussian Splats) 格式
- **地图叠加**：采用 Overlaid 方式在 Mapbox 地图上叠加 3D 内容
- **LOD 控制**：可调节 geometricErrorMultiplier 和 distanceBias
- **颜色方案**：支持 elevation / intensity / classification / RGB 着色
- **Gaussian Splats**：支持 SPZ 格式的高斯泼溅渲染
- **物理引擎**：可选集成 Rapier3D 物理模拟
- **实时控制面板**：动态调节各种可视化参数

### 技术栈

| 技术 | 说明 |
|------|------|
| React 18 | UI 框架 |
| react-map-gl v7 | Mapbox GL JS React 封装 |
| mapbox-gl v3 | 地图渲染引擎 |
| @jdultra/threedtiles | OGC 3D Tiles 渲染器 |
| Three.js | WebGL 3D 渲染引擎 |
| @react-three/fiber | React Three.js 集成 |
| Zustand | 状态管理 |
| TailwindCSS | 样式框架 |

## 快速开始

### 前置要求

- Node.js 18+
- Mapbox Access Token

### 安装

```bash
# 克隆项目
git clone <repo-url>
cd mapboxgl-r3f-threedtiles

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
```

编辑 `.env` 文件，填入你的 Mapbox Access Token：

```
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

### 运行

```bash
npm run dev
```

访问 http://localhost:5173 查看应用。

## 使用指南

### 数据源选择

点击顶部导航栏的当前数据源名称，可以切换不同的 3D Tiles 数据源：

| 数据源 | 说明 |
|--------|------|
| Ayutthaya 古遗址 | 泰国大城府历史遗址 3D 重建 |
| Christ Church | 摄影测量法创建的教堂模型 |
| Drachenwald Castle | 中世纪城堡 3D 重建 |

### LOD 控制

在左侧控制面板中调节以下参数：

- **几何误差乘数**：控制 LOD 切换敏感度（值越小细节越丰富）
- **距离偏差**：控制近远细节加载策略
- **加载策略**：INCREMENTAL / IMMEDIATE / PERLEVEL

### 颜色方案

支持四种着色模式：

- **高程着色**：按 Z 轴高度映射颜色
- **强度着色**：按点云反射强度着色
- **分类着色**：按 ASPRS 分类标准着色
- **RGB 颜色**：使用原始 RGB 颜色

### Gaussian Splats

当数据源包含 Splats 时，可调节：

- **质量**：渲染质量（影响性能）
- **曝光补偿**：EV 值调整
- **饱和度**：颜色饱和度
- **对比度**：对比度调整

### 键盘快捷键

| 按键 | 功能 |
|------|------|
| `H` | 显示/隐藏控制面板 |
| `I` | 显示/隐藏信息面板 |

## 架构设计

### 渲染集成方式

本项目采用 **Overlaid** 方式实现 3D Tiles 与地图的叠加：

```
┌─────────────────────────────────┐
│      Mapbox GL Canvas           │  ← 地图底图
│  ┌─────────────────────────┐    │
│  │   Three.js Canvas      │    │  ← 3D Tiles 叠加层
│  │  (pointer-events:none)  │    │    通过 CSS 让鼠标事件穿透
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

- **Overlaid 方式**：Three.js Canvas 覆盖在地图 Canvas 上方，相机矩阵与地图同步
- **Interleaved 方式**：deck.gl 等库支持的另一种方式，渲染到同一 WebGL context

### 组件结构

```
App
├── MapContainer
│   ├── MapGL (react-map-gl)
│   └── TilesOverlay (Three.js + threedtiles)
│       ├── WebGLRenderer
│       ├── Scene
│       ├── PerspectiveCamera
│       └── OGC3DTile
├── Navbar
├── ControlPanel
│   ├── LODControls
│   ├── ColorSchemeSelector
│   └── SplatsControls
├── InfoPanel
└── LayerLegend
```

## 项目结构

```
mapboxgl-r3f-threedtiles/
├── src/
│   ├── components/          # React 组件
│   │   ├── MapContainer.tsx    # 地图容器
│   │   ├── TilesOverlay.tsx    # 3D Tiles 叠加层
│   │   ├── ControlPanel.tsx    # 控制面板
│   │   ├── InfoPanel.tsx       # 信息面板
│   │   ├── Navbar.tsx          # 导航栏
│   │   └── LayerLegend.tsx     # 图例
│   ├── store/
│   │   └── useStore.ts         # Zustand 状态管理
│   ├── constants/
│   │   └── tilesets.ts        # 预置数据源
│   └── types/
│       └── index.ts            # TypeScript 类型
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## 与竞品对比

| 库 | 开发商 | 特点 |
|-----|--------|------|
| @jdultra/threedtiles | Emeric Beaufays | 支持 Gaussian Splats、物理引擎、Three.js 原生 |
| 3DTilesRendererJS | NASA AMMOS | 多渲染器支持 (Three.js/Babylon.js/R3F)、丰富插件 |
| maplibre-gl-lidar | OpenGeoSpace | 专精 LiDAR 点云、deck.gl 叠加 |

## 参考资料

- [@jdultra/threedtiles](https://github.com/ebeaufay/threedtiles)
- [react-map-gl](https://visgl.github.io/react-map-gl/)
- [mapbox-gl-js](https://docs.mapbox.com/mapbox-gl-js/api/)
- [OGC 3D Tiles 1.1 规范](https://docs.ogc.org/cs/22-025r4/22-025r4.html)
- [deck.gl 地图集成](https://deck.gl/docs/get-started/using-with-map)

## 许可证

MIT
