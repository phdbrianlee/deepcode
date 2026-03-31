# Workspace

## 项目概述

本工作空间包含多个 3D 可视化和地理空间数据分析相关的项目。

## 目录说明

### docs/

项目分析文档目录，包含以下分析报告：

| 文档 | 项目 | 说明 |
|------|------|------|
| `canyon-3d-web-viewer.md` | canyon/3d-web-viewer | Three.js 点云可视化独立渲染分析 |
| `maplibre-gl-lidar.md` | opengeos/maplibre-gl-lidar | LiDAR 点云叠加 MapLibre GL 分析 |
| `ebeaufay-threedtiles.md` | ebeaufay/threedtiles | OGC 3D Tiles 渲染库分析 |
| `3DTilesRendererJS.md` | NASA AMMOS/3DTilesRendererJS | NASA 3D Tiles 渲染库分析 |
| `Babylon.js.md` | Microsoft/Babylon.js | WebGL 3D 渲染引擎分析 |

### mapboxgl-r3f-threedtiles/

基于 React + Mapbox GL + @jdultra/threedtiles 的 3D Tiles 可视化演示应用。

**技术栈：**
- React 18 + Vite
- react-map-gl v7 (Mapbox GL JS)
- @jdultra/threedtiles (OGC 3D Tiles 渲染)
- Three.js ^0.182.0
- Zustand (状态管理)
- TailwindCSS

**功能特性：**
- **3D Tiles 渲染**：支持 glTF、B3DM、SPZ (Gaussian Splats) 格式
- **地图叠加**：采用 Overlaid 方式在 Mapbox 地图上叠加 3D 内容
- **LOD 控制**：geometricErrorMultiplier、distanceBias、加载策略
- **颜色方案**：elevation / intensity / classification / RGB 着色
- **Gaussian Splats**：质量、曝光、饱和度、对比度控制
- **物理引擎**：Rapier3D 集成
- **实时控制面板**：折叠式 UI，动态调节参数

**预置数据源：**
- Ayutthaya 古遗址（泰国大城府）
- Christ Church（摄影测量模型）
- Drachenwald Castle（中世纪城堡）

**运行方式：**
```bash
cd mapboxgl-r3f-threedtiles
npm install
cp .env.example .env  # 配置 Mapbox Token
npm run dev
```

**键盘快捷键：**
- `H` - 显示/隐藏控制面板
- `I` - 显示/隐藏信息面板

### mapboxgl_r3f_3dtiles/

基于 React + Mapbox GL + React Three Fiber + 3DTilesRendererJS 的示例应用。

**运行方式：**
```bash
cd mapboxgl_r3f_3dtiles
npm install
cp .env.example .env  # 配置 Mapbox Token
npm run dev
```

---

## 技术对比

### 3D Tiles 渲染库对比

| 库 | 开发商 | 3D 引擎 | 地图叠加 | Gaussian Splats | 物理引擎 |
|-----|--------|----------|----------|-----------------|----------|
| @jdultra/threedtiles | Emeric Beaufays | Three.js | Overlaid | 完整支持 | Rapier3D |
| 3DTilesRendererJS | NASA AMMOS | Three.js/Babylon.js/R3F | 可选 | 不支持 | 不支持 |
| maplibre-gl-lidar | OpenGeoSpace | deck.gl | 叠加在 MapLibre | 不支持 | 不支持 |

### 渲染集成方式

| 方式 | 说明 | 库 |
|------|------|-----|
| **Overlaid** | 独立 Canvas 覆盖在地图上，相机同步 | threedtiles, maplibre-gl-lidar |
| **Interleaved** | 渲染到同一 WebGL context | deck.gl MapboxOverlay |

---

## 项目结构

```
/workspace/
├── docs/                          # 项目分析文档
│   ├── canyon-3d-web-viewer.md
│   ├── maplibre-gl-lidar.md
│   ├── ebeaufay-threedtiles.md
│   ├── 3DTilesRendererJS.md
│   └── Babylon.js.md
├── mapboxgl-r3f-threedtiles/     # threedtiles 示例应用
├── mapboxgl_r3f_3dtiles/          # 3DTilesRendererJS 示例应用
└── README.md
```

---

## 参考资料

- [OGC 3D Tiles 1.1 规范](https://docs.ogc.org/cs/22-025r4/22-025r4.html)
- [@jdultra/threedtiles](https://github.com/ebeaufay/threedtiles)
- [3DTilesRendererJS](https://github.com/NASA-AMMOS/3DTilesRendererJS)
- [maplibre-gl-lidar](https://github.com/opengeos/maplibre-gl-lidar)
- [deck.gl 地图集成](https://deck.gl/docs/get-started/using-with-map)
