# opengeos/maplibre-gl-lidar 项目分析文档

## 1. 项目概述

**maplibre-gl-lidar** 是一个 MapLibre GL JS 插件，用于使用 deck.gl 可视化 LiDAR 点云数据。

- **GitHub**: https://github.com/opengeos/maplibre-gl-lidar
- **当前版本**: 0.11.1
- **许可证**: MIT
- **技术栈**: MapLibre GL + deck.gl + copc.js + proj4

### 核心特性

- 加载可视化 LAS/LAZ/COPC 点云文件 (LAS 1.0 - 1.4)
- **动态 COPC 流式加载** - 基于视口的加载方式处理大型云优化点云
- **EPT (Entwine Point Tile) 支持** - 从 EPT 服务器流式加载大型点云数据集
- 多种配色方案：elevation、intensity、classification、RGB
- **分类图例切换** - 交互式图例显示/隐藏各分类类型
- **基于百分位的着色** - 使用 2-98% 百分位范围获得更好的颜色分布
- 交互式 GUI 控制面板
- **点拾取** - 悬停查看所有可用属性
- **Z 偏移调整** - 垂直偏移点云以对齐
- **高程过滤** - 按高程范围过滤点
- 自动坐标转换（投影 CRS 到 WGS84）
- React 和 Vue 集成

### 渲染架构

**点云叠加在地图底图上**，通过 deck.gl 的 MapboxOverlay 实现与 MapLibre GL 的集成：

| 组件 | 职责 |
|------|------|
| MapLibre GL | 地图底图渲染 (WebGL Canvas) |
| DeckOverlay | deck.gl 与 MapLibre GL 桥接 |
| PointCloudLayer | deck.gl 点云渲染层 |

```
┌─────────────────────────────────────────────────────────────┐
│                    MapLibre GL Map                         │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              HTML Container                            │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │  MapLibre GL Canvas (地图底图)                   │  │ │
│  │  │                                                 │  │ │
│  │  │   ┌─────────────────────────────────────────┐   │  │ │
│  │  │   │  deck.gl PointCloudLayer (点云叠加)      │   │  │ │
│  │  │   │  - 使用 LNGLAT_OFFSETS 坐标系统           │   │  │ │
│  │  │   │  - 与地图视口同步                         │   │  │ │
│  │  │   └─────────────────────────────────────────┘   │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 技术架构

### 2.1 技术栈

```
┌─────────────────────────────────────────────────────────────┐
│                 maplibre-gl ^5.14.0                        │
│                   (地图底图渲染)                              │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐ │
│  │         @deck.gl/mapbox ^9.0.0 (桥接层)               │ │
│  │         MapboxOverlay (Interleaved Mode)              │ │
│  └───────────────────────┬───────────────────────────────┘ │
│                          │                                 │
│  ┌───────────────────────▼───────────────────────────────┐ │
│  │         @deck.gl/layers ^9.0.0                       │ │
│  │         PointCloudLayer (点云渲染)                    │ │
│  └───────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ copc.js      │  │ laz-perf     │  │ proj4          │ │
│  │ ^0.0.8       │  │ (WASM)       │  │ ^2.20.2        │ │
│  │ (COPC 解析)  │  │ (LAZ 解压)   │  │ (坐标转换)      │ │
│  └──────────────┘  └──────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 项目目录结构

```
maplibre-gl-lidar/
├── src/
│   ├── lib/
│   │   ├── core/
│   │   │   ├── LidarControl.ts      # MapLibre IControl 实现
│   │   │   ├── DeckOverlay.ts       # deck.gl 与 MapLibre 桥接
│   │   │   ├── ViewportManager.ts   # 视口管理
│   │   │   └── types.ts            # 类型定义
│   │   ├── layers/
│   │   │   ├── PointCloudManager.ts # deck.gl 图层管理
│   │   │   └── types.ts
│   │   ├── loaders/
│   │   │   ├── PointCloudLoader.ts # LAS/LAZ/COPC 加载器
│   │   │   ├── CopcStreamingLoader.ts
│   │   │   ├── EptStreamingLoader.ts
│   │   │   └── types.ts
│   │   ├── colorizers/
│   │   │   ├── ColorScheme.ts       # 颜色处理
│   │   │   ├── Colormaps.ts        # 色阶
│   │   │   └── types.ts
│   │   ├── gui/
│   │   │   ├── PanelBuilder.ts
│   │   │   ├── MetadataPanel.ts
│   │   │   └── ...
│   │   ├── adapters/
│   │   │   └── LidarLayerAdapter.ts # 与 maplibre-gl-layer-control 集成
│   │   └── tools/
│   │       └── CrossSectionTool.ts
│   ├── react.ts                    # React 入口
│   └── index.ts                   # 主入口
├── examples/                       # 示例
└── package.json
```

---

## 3. 核心架构：点云叠加原理

### 3.1 DeckOverlay - 桥接 deck.gl 与 MapLibre GL

**核心文件**: `src/lib/core/DeckOverlay.ts`

```typescript
// DeckOverlay.ts:14-23
export class DeckOverlay {
  private _map: MapLibreMap;
  private _overlay: MapboxOverlay;

  constructor(map: MapLibreMap) {
    this._map = map;
    this._layers = new Map();
    this._overlay = new MapboxOverlay({
      interleaved: false, // 使用非交错模式
      layers: [],
    });
    // 作为 MapLibre Control 添加
    this._map.addControl(this._overlay as unknown as maplibregl.IControl);
  }
}
```

**关键点**:
- 使用 `@deck.gl/mapbox` 的 `MapboxOverlay`
- `interleaved: false` 表示非交错模式，deck.gl 层独立渲染
- 作为 MapLibre 的 IControl 添加到地图

### 3.2 PointCloudManager - 管理 deck.gl 图层

**核心文件**: `src/lib/layers/PointCloudManager.ts`

```typescript
// PointCloudManager.ts:616-642
const layer = new PointCloudLayer({
  id: `pointcloud-${id}-chunk${chunk}`,
  // 使用 LNGLAT_OFFSETS 坐标系统实现与地图叠加
  coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS,
  coordinateOrigin: coordinateOrigin, // [lng, lat, 0] 中心点
  data: {
    length: chunkSize,
    attributes: {
      getPosition: { value: chunkPositions, size: 3 },
      getColor: { value: chunkColors, size: 4 },
    },
  },
  pointSize: this._options.pointSize,
  sizeUnits: 'pixels',
  opacity: layerOpacity,
  getNormal: [0, 0, 1],
  pickable: this._options.pickable,
});
```

### 3.3 坐标系统详解

**核心文件**: `src/lib/loaders/types.ts`

```typescript
// types.ts:17-28
export interface PointCloudData {
  /**
   * Float32Array of XYZ positions as offsets from coordinateOrigin (length = pointCount * 3)
   * Format: [deltaLng, deltaLat, elevation] for each point
   */
  positions: Float32Array;

  /**
   * Coordinate origin [lng, lat, 0] - positions are offsets from this point
   * This allows Float32Array to maintain precision for geographic coordinates
   */
  coordinateOrigin: [number, number, number];
}
```

**坐标转换原理**:

```
原始坐标 (如 UTM)
    │
    │ proj4 转换
    ▼
WGS84 经纬度 (EPSG:4326)
    │
    │ 计算中心点
    ▼
coordinateOrigin = [(minX + maxX) / 2, (minY + maxY) / 2, 0]
    │
    │ 计算偏移
    ▼
positions[i] = coordinate[i] - coordinateOrigin[i]
```

**示例**:
```typescript
// PointCloudLoader.ts:848-866
coordinateOrigin = [
  (bounds.minX + bounds.maxX) / 2,  // 经度中心
  (bounds.minY + bounds.maxY) / 2,  // 纬度中心
  0,
];

// 存储为偏移量
positions[i * 3] = lng - coordinateOrigin[0];     // 小数值
positions[i * 3 + 1] = lat - coordinateOrigin[1]; // 小数值
positions[i * 3 + 2] = elevation;                // 高程（米）
```

### 3.4 大点云分块处理

```typescript
// PointCloudManager.ts:535-562
const CHUNK_SIZE = 1000000; // 每块 100 万点

for (let chunk = 0; chunk < numChunks; chunk++) {
  const chunkStart = chunk * CHUNK_SIZE;
  const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, filteredIndices.length);

  // 提取当前块的数据
  const chunkPositions = new Float32Array(chunkSize * 3);
  const chunkColors = new Uint8Array(chunkSize * 4);

  // 创建独立的 PointCloudLayer
  const layer = new PointCloudLayer({
    id: `pointcloud-${id}-chunk${chunk}`,
    coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS,
    coordinateOrigin: coordinateOrigin,
    // ...
  });

  this._deckOverlay.addLayer(`pointcloud-${id}-chunk${chunk}`, layer);
}
```

---

## 4. LidarControl - MapLibre IControl 实现

### 4.1 核心类

**核心文件**: `src/lib/core/LidarControl.ts`

```typescript
// LidarControl.ts:88-127
export class LidarControl implements IControl {
  private _map?: MapLibreMap;
  private _deckOverlay?: DeckOverlay;
  private _pointCloudManager?: PointCloudManager;
  private _loader: PointCloudLoader;

  onAdd(map: MapLibreMap): HTMLElement {
    this._map = map;

    // 1. 初始化 deck.gl overlay
    this._deckOverlay = new DeckOverlay(map);

    // 2. 初始化点云管理器
    this._pointCloudManager = new PointCloudManager(this._deckOverlay, {
      pointSize: this._state.pointSize,
      opacity: this._state.opacity,
      colorScheme: this._state.colorScheme,
      // ...
    });

    // 3. 创建 UI 面板
    this._container = this._createContainer();
    this._panel = this._createPanel();
    this._mapContainer.appendChild(this._panel);

    return this._container;
  }
}
```

### 4.2 加载点云流程

```typescript
// LidarControl.ts:394-571
async loadPointCloud(source: string | File | ArrayBuffer): Promise<PointCloudInfo> {
  // 1. 检测文件类型
  const isCopc = source 是 COPC 文件;

  // 2. 加载点云数据
  const data = await this._loader.load(source, onProgress);

  // 3. 添加到管理器（创建 deck.gl 图层）
  this._pointCloudManager?.addPointCloud(id, data);

  // 4. 自动 Z 偏移
  if (this._options.autoZOffset) {
    const zOffset = -data.bounds.minZ; // 使用 2% 百分位
    this._pointCloudManager?.setZOffset(zOffset);
  }

  // 5. 飞往点云位置
  if (this._options.autoZoom) {
    this.flyToPointCloud(id);
  }

  return info;
}
```

---

## 5. 坐标转换与投影

### 5.1 proj4 坐标转换

```typescript
// PointCloudLoader.ts:802-817
if (copc.wkt) {
  // 从 WKT 创建 proj4 转换器
  const wktToUse = extractProjcsFromWkt(copc.wkt);
  const projConverter = proj4(wktToUse, 'EPSG:4326');

  transformer = (coord: [number, number]) => {
    return projConverter.forward(coord) as [number, number];
  };
  needsTransform = true;

  // 检测垂直单位（英尺转米）
  verticalUnitFactor = getVerticalUnitConversionFactor(copc.wkt);
}
```

### 5.2 垂直单位处理

```typescript
// PointCloudLoader.ts:131-162
function getVerticalUnitConversionFactor(wkt: string): number {
  const FEET_TO_METERS = 0.3048;
  const US_SURVEY_FEET_TO_METERS = 0.3048006096012192;

  // 检测英尺单位
  if (wktLower.includes('us survey foot') ||
      wktLower.includes('foot') ||
      wkt.toLowerCase().includes('"ft"')) {
    return FEET_TO_METERS;
  }
  return 1.0; // 默认米
}
```

---

## 6. 流式加载

### 6.1 COPC 流式加载

```typescript
// CopcStreamingLoader.ts
export class CopcStreamingLoader {
  // 1. 初始化 - 读取头部和根层级
  await streamingLoader.initialize();

  // 2. 设置视口变化回调
  streamingLoader.setOnPointsLoaded((data) => {
    // 增量更新点云图层
    this._pointCloudManager?.updatePointCloud(id, data);
  });

  // 3. 创建视口管理器
  const viewportManager = new ViewportManager(
    this._map,
    (viewport) => this._handleViewportChange(viewport, id)
  );

  // 4. 启动视口监听
  viewportManager.start();
}
```

### 6.2 EPT 流式加载

Entwine Point Tile 格式，支持更大规模数据的流式加载：

```typescript
// EptStreamingLoader.ts
export class EptStreamingLoader {
  // 从 ept.json 读取元数据
  const { bounds, totalPoints, spacing } = await eptLoader.initialize();

  // 视口变化时选择节点
  const nodesToLoad = await eptLoader.selectNodesForViewport(viewport);

  // 加载排队的节点
  await eptLoader.loadQueuedNodes();
}
```

---

## 7. 颜色方案

### 7.1 支持的颜色方案

```typescript
// ColorScheme.ts
export type ColorScheme =
  | 'elevation'   // 按高程着色
  | 'intensity'   // 按强度着色
  | 'classification' // 按分类着色
  | 'rgb';        // 使用原始 RGB
```

### 7.2 色阶

```typescript
// Colormaps.ts
export const COLORMAPS: Record<ColormapName, ColorRamp> = {
  viridis: [[68, 1, 84], ...],
  plasma: [[13, 8, 135], ...],
  inferno: [[0, 0,4], ...],
  // ...
};
```

### 7.3 高程着色实现

```typescript
// ColorScheme.ts:163-206
private _colorByElevation(data, colors, colormap): ColorResult {
  // 提取 Z 值
  const zValues = new Float32Array(data.pointCount);
  for (let i = 0; i < data.pointCount; i++) {
    zValues[i] = data.positions[i * 3 + 2];
  }

  // 计算百分位边界 (2-98%)
  const bounds = computePercentileBounds(zValues, 2, 98);

  // 映射到色阶
  const ramp = COLORMAPS[colormap];
  for (let i = 0; i < data.pointCount; i++) {
    const t = (zValues[i] - bounds.min) / (bounds.max - bounds.min);
    const color = this._interpolateRamp(ramp, t);
    colors[i * 4] = color[0];
    // ...
  }
}
```

---

## 8. 使用示例

### 8.1 基本用法

```typescript
import maplibregl from "maplibre-gl";
import { LidarControl } from "maplibre-gl-lidar";

const map = new maplibregl.Map({
  container: "map",
  style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  center: [-122.4, 37.8],
  zoom: 12,
  pitch: 60,
});

map.on("load", () => {
  const lidarControl = new LidarControl({
    title: "LiDAR Viewer",
    collapsed: true,
    pointSize: 2,
    colorScheme: "elevation",
    pickable: true,
  });

  map.addControl(lidarControl, "top-right");

  lidarControl.loadPointCloud(
    "https://s3.amazonaws.com/hobu-lidar/autzen-classified.copc.laz"
  );
});
```

### 8.2 React 用法

```tsx
import { LidarControlReact, useLidarState } from "maplibre-gl-lidar/react";

function App() {
  const { state, setColorScheme } = useLidarState();

  return (
    <LidarControlReact
      map={map}
      title="LiDAR Viewer"
      pointSize={state.pointSize}
      colorScheme={state.colorScheme}
      defaultUrl="https://example.com/pointcloud.copc.laz"
    />
  );
}
```

---

## 9. 与 canyon/3d-web-viewer 对比

| 维度 | canyon/3d-web-viewer | opengeos/maplibre-gl-lidar |
|------|---------------------|---------------------------|
| **点云与地图关系** | 独立渲染，不叠加 | 叠加在地图上 |
| **地图引擎** | 无 | MapLibre GL |
| **3D 渲染引擎** | Three.js 独立使用 | deck.gl (via MapboxOverlay) |
| **坐标系统** | 笛卡尔坐标 | LNGLAT_OFFSETS (经纬度偏移) |
| **数据格式** | PCD, XYZ, PLY, TXT | LAS, LAZ, COPC, EPT |
| **坐标转换** | 无 | proj4 (投影 → WGS84) |
| **流式加载** | 不支持 | COPC + EPT 流式 |
| **点云分块** | 无 | 100 万点/块 |

### 核心差异

1. **maplibre-gl-lidar**:
   - 点云**叠加在地图上**，使用 deck.gl 的 `COORDINATE_SYSTEM.LNGLAT_OFFSETS`
   - 坐标存储为相对偏移量 (小数值)
   - 支持流式加载大型数据

2. **3d-web-viewer**:
   - 点云**单独渲染**，不依赖地图
   - 使用笛卡尔坐标
   - 适合小型点云文件

---

## 10. 关键技术点总结

### 10.1 点云叠加地图的核心

```typescript
// 1. 使用 MapboxOverlay 桥接
const overlay = new MapboxOverlay({
  layers: [],
});
map.addControl(overlay as IControl);

// 2. 使用 LNGLAT_OFFSETS 坐标系统
new PointCloudLayer({
  coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS,
  coordinateOrigin: [centerLng, centerLat, 0],
  // positions 存储为小偏移量
});

// 3. deck.gl 自动处理与地图的同步
// 相机移动时，deck.gl 层自动重投影
```

### 10.2 Float32 精度保持

```typescript
// 原始坐标可能很大（如 UTM 的 500000+）
// 存储为相对于中心的偏移量，保持 Float32 精度

coordinateOrigin = [(minX + maxX) / 2, (minY + maxY) / 2, 0];
positions[i] = originalCoord[i] - coordinateOrigin[i]; // 小数值
```

### 10.3 图层排序

```typescript
// DeckOverlay.ts:111-127
private _updateOverlay(): void {
  const sortedLayers = Array.from(this._layers.entries()).sort(([idA], [idB]) => {
    const isOverlayA = idA.includes('cross-section');
    if (isOverlayA && !isOverlayB) return 1; // 剖面层置顶
    return 0;
  }).map(([, layer]) => layer);

  this._overlay.setProps({ layers: sortedLayers });
}
```

---

## 参考资料

- [maplibre-gl-lidar GitHub](https://github.com/opengeos/maplibre-gl-lidar)
- [deck.gl MapboxOverlay](https://deck.gl/docs/api-reference/mapbox/overview)
- [COPC 规范](https://copc.io/)
- [Entwine Point Tile](https://entwine.io/)
- [proj4](https://proj.org/)
