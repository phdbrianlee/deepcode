# MapboxGL + React Three Fiber + 3DTilesRenderer

本项目演示如何将 [3DTilesRendererJS](https://github.com/NASA-AMMOS/3DTilesRendererJS) 与 [React](https://reactjs.org/)、[mapbox-gl-js](https://docs.mapbox.com/mapbox-gl-js/) 和 [React Three Fiber](https://github.com/pmndrs/react-three-fiber) 集成。

## 功能特性

- 基于 React 的用户界面
- Mapbox GL JS 用于 2D 地图底图
- React Three Fiber 用于 3D 渲染
- 3DTilesRendererJS 用于加载和渲染 3D Tiles
- 实时显示瓦片加载统计信息

## 前置要求

- Node.js 18+
- Mapbox Access Token（请访问 https://account.mapbox.com/ 获取）

## 安装配置

1. 安装依赖：

```bash
npm install
```

2. 配置 Mapbox Token：

在项目根目录创建 `.env` 文件：

```bash
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

或从示例文件复制：

```bash
cp .env.example .env
```

3. 启动开发服务器：

```bash
npm run dev
```

4. 在浏览器中打开终端显示的 URL。

## 使用说明

演示程序加载 Cesium 3D Tiles 示例数据集（费城建筑物）。功能包括：

- 鼠标拖拽导航地图
- 滚轮缩放
- 右键拖拽倾斜和旋转视图
- 左上角面板显示实时瓦片加载统计信息

## 项目结构

```
mapboxgl_r3f_3dtiles/
├── src/
│   ├── components/
│   │   ├── TilesRenderer.jsx    # 3D Tiles 渲染组件
│   │   └── InfoPanel.jsx        # 统计信息显示面板
│   ├── App.jsx                   # 主应用组件
│   ├── App.css                  # 应用样式
│   └── main.jsx                 # 入口文件
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 核心实现细节

### TilesRenderer 组件

`TilesRenderer` 组件封装了 3DTilesRendererJS 库中的 `ThreeTilesRenderer`，并与 React Three Fiber 的渲染循环集成：

```jsx
useFrame(() => {
  camera.updateMatrixWorld();
  tilesRenderer.update();
});
```

### 层级集成

地图和 3D 画布采用分层结构：
1. 底层：Mapbox GL 地图（z-index: 1）
2. 顶层：React Three Fiber 画布（z-index: 2）

这种设计允许 3D 瓦片覆盖在 2D 地图之上，同时保持地图交互性。

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |

## 依赖说明

- **react**: ^18.3.1
- **react-dom**: ^18.3.1
- **@react-three/fiber**: ^8.17.9
- **@react-three/drei**: ^10.0.0
- **three**: ^0.170.0
- **3d-tiles-renderer**: ^0.4.23
- **mapbox-gl**: ^3.8.0
- **react-map-gl**: ^7.1.7

## 许可证

MIT
