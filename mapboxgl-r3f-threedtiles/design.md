# mapboxgl-r3f-threedtiles 项目设计

## 1. 项目概述

### 1.1 目标

创建一个基于 **React + react-map-gl + @jdultra/threedtiles** 的 3D Tiles 可视化演示应用，展示如何在 Mapbox GL 地图上叠加 OGC 3D Tiles 数据。

### 1.2 核心功能

1. **3D Tiles 渲染**：加载并显示 glTF/B3DM 格式的 3D Tiles
2. **地图叠加**：采用 Overlaid 方式在 Mapbox 地图上叠加 3D 内容
3. **LOD 控制**：用户可调节 geometricErrorMultiplier 和 distanceBias
4. **颜色方案**：支持 elevation / intensity / classification / RGB 着色
5. **Gaussian Splats**：支持 SPZ 格式的 Gaussian Splats 可视化
6. **物理引擎**：集成 Rapier3D 物理模拟演示
7. **实时控制面板**：动态调节各种可视化参数

## 2. 技术架构

### 2.1 技术栈

```
React 18
├── react-map-gl v7 (Mapbox GL JS 封装)
├── mapbox-gl v3
├── @jdultra/threedtiles (3D Tiles 渲染)
├── three.js (WebGL 渲染)
├── @react-three/fiber (React Three.js 集成)
├── @react-three/drei (Three.js 工具)
├── lucide-react (图标)
└── tailwindcss (样式)
```

### 2.2 组件架构

```
App
├── MapContainer (地图容器)
│   ├── MapGL (react-map-gl 地图)
│   └── TilesOverlay (Three.js 渲染层)
│       ├── TilesRenderer (threedtiles)
│       └── CameraController
├── ControlPanel (控制面板)
│   ├── TilesetSelector (选择预置数据源)
│   ├── LODControls (LOD 参数)
│   ├── ColorSchemeSelector (颜色方案)
│   ├── SplatsControls (splats 设置)
│   └── PhysicsToggle (物理引擎开关)
├── InfoPanel (信息面板)
│   ├── LoadingProgress (加载进度)
│   ├── TileStats (瓦片统计)
│   └── CameraInfo (相机信息)
└── LayerLegend (图例)
```

### 2.3 渲染集成方式

采用 **Overlaid** 方式（非 Interleaved）：
- Three.js Canvas 覆盖在 Mapbox GL Canvas 上方
- 通过 CSS `pointer-events: none` 让鼠标事件穿透到地图
- 相机矩阵与 Mapbox 相机同步

## 3. UI/UX 设计

### 3.1 设计系统

根据 UI/UX Pro Max 指导，采用 **Data-Dense Dashboard** 风格：

**配色方案**：
| 用途 | 色值 |
|------|------|
| Primary | `#0F172A` (slate-900) |
| Secondary | `#1E293B` (slate-800) |
| Background | `#020617` (slate-950) |
| Text | `#F8FAFC` (slate-50) |
| Accent | `#22C55E` (green-500) |

**字体**：
- 主字体：Fira Sans (正文)
- 代码/数据：Fira Code

### 3.2 布局结构

```
┌─────────────────────────────────────────────────────────────┐
│  Navbar: Logo + 数据源选择 + 主题切换                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │              Mapbox GL Map + 3D Tiles               │    │
│  │                                                      │    │
│  │  ┌──────────────┐                                    │    │
│  │  │ Control Panel │ ← 浮动面板                        │    │
│  │  └──────────────┘                                    │    │
│  │                                      ┌───────────┐   │    │
│  │                                      │  Info    │   │    │
│  │                                      │  Panel   │   │    │
│  │                                      └───────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 组件设计

**ControlPanel**：
- 位置：左下角浮动
- 宽度：320px
- 背景：半透明玻璃效果 `bg-slate-900/80 backdrop-blur`
- 圆角：12px
- 分组：折叠式手风琴设计

**InfoPanel**：
- 位置：右下角
- 显示：加载进度、瓦片数量、LOD级别
- 实时更新

**LayerLegend**：
- 位置：左下角（控制面板下方）
- 显示：当前颜色方案的色阶

## 4. 功能模块

### 4.1 预置数据源

提供 3 个示例数据源：

| 名称 | URL | 类型 | 说明 |
|------|-----|------|------|
| Ayutthaya | `https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json` | glTF | 泰国古遗址 |
| Christ Church | `https://storage.googleapis.com/ogc-3d-tiles/christChurch2/tileset.json` | B3DM | 教堂模型 |
| Drachenwald | `https://storage.googleapis.com/ogc-3d-tiles/drachenwald/tileset.json` | glTF | 中世纪城堡 |

### 4.2 控制参数

| 参数 | 范围 | 默认值 | 说明 |
|------|------|--------|------|
| `geometricErrorMultiplier` | 0.01 - 10 | 1.0 | LOD 敏感度 |
| `distanceBias` | 0.1 - 3.0 | 1.0 | 距离偏差 |
| `loadingStrategy` | INCREMENTAL / IMMEDIATE / PERLEVEL | INCREMENTAL | 加载策略 |
| `colorScheme` | elevation / intensity / classification / rgb | elevation | 颜色方案 |
| `pointSize` | 1 - 10 | 2 | 点大小 |
| `opacity` | 0 - 1 | 1 | 透明度 |

### 4.3 Splats 控制

| 参数 | 说明 |
|------|------|
| `splatsQuality` | 质量 (0-1) |
| `splatsExposureEV` | 曝光补偿 (-6 到 +6) |
| `splatsSaturation` | 饱和度 (0-2) |
| `splatsContrast` | 对比度 (0-2) |

### 4.4 物理引擎

- 开关控制
- 可选择刚体类型 (fixed/dynamic)
- 可视化碰撞边界（可选）

## 5. 交互设计

### 5.1 地图交互

- 地图：缩放、旋转、倾斜（Mapbox 原生）
- 3D Tiles：跟随地图相机同步变换
- 点击：选中瓦片显示信息

### 5.2 控制面板交互

- 滑块：实时预览参数变化
- 下拉选择：切换数据源、颜色方案
- 折叠/展开：节省屏幕空间
- Hover：显示参数说明 tooltip

### 5.3 键盘快捷键

| 按键 | 功能 |
|------|------|
| `R` | 重置相机 |
| `F` | 切换全屏 |
| `H` | 隐藏/显示控制面板 |
| `I` | 切换信息面板 |

## 6. 性能考虑

### 6.1 加载策略

- 初始只加载低分辨率瓦片
- 渐进式加载高分辨率
- LRU 缓存控制内存使用

### 6.2 渲染优化

- 视锥体裁剪
- 屏幕空间误差 (SSE) 驱动 LOD
- 异步瓦片解析

### 6.3 React 优化

- 状态提升避免不必要重渲染
- useMemo 缓存计算结果
- 虚拟化长列表（如有）

## 7. 项目结构

```
mapboxgl-r3f-threedtiles/
├── public/
│   └── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── App.css
│   ├── components/
│   │   ├── MapContainer.tsx
│   │   ├── TilesOverlay.tsx
│   │   ├── ControlPanel.tsx
│   │   ├── InfoPanel.tsx
│   │   ├── LayerLegend.tsx
│   │   └── Navbar.tsx
│   ├── hooks/
│   │   ├── useTileset.ts
│   │   └── useMapSync.ts
│   ├── store/
│   │   └── useStore.ts
│   ├── constants/
│   │   └── tilesets.ts
│   └── types/
│       └── index.ts
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── tsconfig.json
```

## 8. 验收标准

### 8.1 功能验收

- [ ] 成功加载至少一个预置 3D Tiles 数据源
- [ ] 地图与 3D Tiles 叠加显示正常
- [ ] 控制面板参数调节实时生效
- [ ] 颜色方案切换正常
- [ ] 加载进度显示正确

### 8.2 性能验收

- [ ] 初始加载时间 < 5 秒
- [ ] 相机移动时帧率保持流畅
- [ ] 无明显卡顿或闪烁

### 8.3 UI 验收

- [ ] 暗色主题视觉效果良好
- [ ] 控制面板可折叠展开
- [ ] 响应式布局适配不同屏幕
- [ ] 无 emoji 图标，使用 SVG
