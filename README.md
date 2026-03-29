# Workspace

## 项目概述

本工作空间包含以下内容：

## 目录说明

### docs/

项目分析文档目录，包含以下分析报告：

- **ieavisualizations.md** - IEA Visualizations 项目分析文档
  - 分析了基于 React + Mapbox + Deck.gl 的能源数据可视化项目
  - 涵盖 Weather Grid WebGL、Gas Trade Flow、COVID Impact 等多个可视化组件

- **3DTilesRendererJS.md** - 3DTilesRendererJS 架构分析文档
  - NASA AMMOS 开发的 3D Tiles 渲染库
  - 包含架构设计、代码结构、实现原理、插件系统等详细分析
  - 特别补充了 3D Tiles 1.1+ 特性的支持情况

- **Babylon.js.md** - Babylon.js 架构分析文档
  - Microsoft 主导的 WebGL 3D 渲染引擎
  - 包含核心引擎架构、渲染管线、地理空间支持（Geospatial Functions）
  - 详细的代码结构分析和使用示例

### mapboxgl_r3f_3dtiles/

基于 React + Mapbox GL + React Three Fiber + 3DTilesRendererJS 的示例应用。

**技术栈：**
- React 18 + Vite
- react-map-gl (Mapbox GL JS)
- @react-three/fiber + drei
- 3d-tiles-renderer

**功能特性：**
- 地图底图（Mapbox Dark 风格）
- 3D Tiles 数据加载（输入 URL + 加载按钮）
- 瓦片加载统计信息显示
- 跳转到数据所在区域

**运行方式：**
```bash
cd mapboxgl_r3f_3dtiles
npm install
cp .env.example .env  # 配置 Mapbox Token
npm run dev
```

**注意事项：**
- 需要有效的 Mapbox Access Token
- 示例数据源使用 Cesium 3D Tiles 标准数据集

---

## TODO

### mapboxgl-babylon

新建目录，在 mapboxgl 地图基础上，添加自定义的 Babylon.js 图层并叠加在底图上。

**目标：**
- 集成 Babylon.js 与 Mapbox GL
- 实现自定义 3D 图层叠加
- 支持地理空间坐标转换（WGS84 ECEF）
- 加载和渲染 3D 模型数据

**技术方案：**
- 使用 Mapbox GL JS 作为底图
- Babylon.js 作为 3D 渲染层
- 通过 Canvas 同步或 WebGL 上下文共享实现图层叠加
