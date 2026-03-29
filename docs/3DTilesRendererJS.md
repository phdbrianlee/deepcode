# 3DTilesRendererJS 项目分析文档

## 项目概述

**3DTilesRendererJS** 是 NASA AMMOS (Advanced Multi-Mission Operations System) 开发的 JavaScript 库，用于在 Web 浏览器中渲染 3D Tiles（一种用于流式传输大规模异构 3D 地理空间数据的开放规范）。

- **GitHub**: https://github.com/NASA-AMMOS/3DTilesRendererJS
- **版本**: 0.4.23
- **许可证**: Apache-2.0
- **核心依赖**: three.js, 可选 babylonjs / react-three-fiber

---

## 1. 架构设计

### 1.1 核心架构分层

```
┌─────────────────────────────────────────┐
│           Application Layer              │
│  (用户代码: 场景设置、相机控制、交互)      │
├─────────────────────────────────────────┤
│         TilesRenderer (Three.js)         │
│    (引擎特定实现: 场景管理、相机投影)       │
├─────────────────────────────────────────┤
│        TilesRendererBase (Core)          │
│  (引擎无关逻辑: 瓦片加载、遍历、缓存管理)    │
├─────────────────────────────────────────┤
│         Loaders (B3DM/PNTS/I3DM)         │
│       (3D Tiles 格式解析)                 │
├─────────────────────────────────────────┤
│         Plugin System (扩展)             │
│   (隐式平铺、褪色管理、认证等)             │
└─────────────────────────────────────────┘
```

### 1.2 多渲染器支持

项目导出多个入口点支持不同的渲染器：

| 入口 | 说明 |
|------|------|
| `3d-tiles-renderer` | 核心库（引擎无关） |
| `3d-tiles-renderer/three` | Three.js 渲染器 |
| `3d-tiles-renderer/babylonjs` | Babylon.js 渲染器 |
| `3d-tiles-renderer/r3f` | React Three Fiber 集成 |

### 1.3 核心类关系

```
TilesRendererBase (核心基类)
    │
    ├── 瓦片遍历管理 (Traversal)
    ├── 优先级队列 (PriorityQueue)
    ├── LRU 缓存 (LRUCache)
    ├── 插件系统 (Plugin System)
    │
    ▼
TilesRenderer (Three.js 实现)
    │
    ├── 相机管理 (Camera)
    ├── 视锥体裁剪 (Frustum Culling)
    ├── 屏幕空间误差计算 (SSE)
    ├── 瓦片解析 (B3DM/PNTS/I3DM/CMPT)
```

---

## 2. 代码结构分析

### 2.1 目录结构

```
src/
├── core/                    # 核心引擎无关代码
│   └── renderer/
│       ├── constants.js     # 状态常量定义
│       ├── loaders/         # 瓦片格式加载器基类
│       │   ├── LoaderBase.js
│       │   ├── B3DMLoaderBase.js
│       │   ├── PNTSLoaderBase.js
│       │   └── CMPTLoaderBase.js
│       ├── tiles/           # 核心瓦片管理
│       │   ├── TilesRendererBase.js   # 核心基类 (~1800 行)
│       │   ├── traverseFunctions.js   # 遍历算法
│       │   └── optimizedTraverseFunctions.js
│       ├── utilities/       # 工具类
│       │   ├── LRUCache.js       # LRU 缓存 (~480 行)
│       │   ├── PriorityQueue.js   # 优先级队列 (~300 行)
│       │   ├── BatchTable.js      # 批处理表
│       │   └── FeatureTable.js    # 特征表
│       └── plugins/         # 核心插件
│           └── ImplicitTilingPlugin.js
│
├── three/                   # Three.js 特定实现
│   └── renderer/
│       ├── tiles/
│       │   ├── TilesRenderer.js   # Three.js 渲染器 (~1088 行)
│       │   └── TilesGroup.js     # 瓦片容器组
│       ├── loaders/         # Three.js 专用加载器
│       │   ├── B3DMLoader.js
│       │   ├── PNTSLoader.js
│       │   └── I3DMLoader.js
│       ├── math/            # 几何数学
│       │   ├── Ellipsoid.js
│       │   ├── TileBoundingVolume.js
│       │   └── ExtendedFrustum.js
│       └── controls/        # 相机控制
│           └── GlobeControls.js
│
├── babylonjs/               # Babylon.js 实现
├── r3f/                     # React Three Fiber 集成
└── plugins.js               # 插件导出
```

### 2.2 核心文件职责

| 文件 | 职责 | 行数 |
|------|------|------|
| `TilesRendererBase.js` | 瓦片加载、缓存、遍历主循环 | ~1800 |
| `TilesRenderer.js` | Three.js 场景集成、视锥体计算 | ~1088 |
| `LRUCache.js` | 内存管理、瓦片生命周期控制 | ~480 |
| `PriorityQueue.js` | 并发下载/解析调度 | ~300 |
| `traverseFunctions.js` | 瓦片可见性判断遍历算法 | ~492 |

---

## 3. 实现原理

### 3.1 瓦片加载流程

```
TilesRenderer.update()
    │
    ├── 1. loadRootTileset()      # 加载根 tileset JSON
    │
    ├── 2. prepareForTraversal()  # 更新相机信息、视锥体
    │
    ├── 3. runTraversal()         # 执行四阶段遍历
    │       │
    │       ├── markUsedTiles()      # 标记可见瓦片
    │       ├── markUsedSetLeaves()  # 标记叶子瓦片
    │       ├── markVisibleTiles()    # 确定最终可见瓦片
    │       └── toggleTiles()         # 切换瓦片显示状态
    │
    ├── 4. removeUnusedPendingTiles()  # 移除未使用的待加载瓦片
    │
    ├── 5. requestTileContents()    # 请求瓦片内容下载
    │
    └── 6. lruCache.scheduleUnload() # 调度缓存清理
```

### 3.2 屏幕空间误差 (Screen-Space Error, SSE)

SSE 是决定是否需要加载更高级别细节的核心指标：

```javascript
// TilesRenderer.js calculateTileViewError
if (isOrthographic) {
    error = tile.geometricError / pixelSize;
} else {
    // 透视投影
    error = tile.geometricError / (distance * sseDenominator);
}
```

- `geometricError`: 瓦片的物理误差（米）
- `pixelSize`: 像素大小
- `distance`: 瓦片到相机距离

当 `error <= errorTarget (默认 16)` 时，停止细化。

### 3.3 LRU 缓存策略

```javascript
class LRUCache {
    maxSize = 8000;           // 最大瓦片数量
    maxBytesSize = 0.4GB;     // 最大内存 (40% 可用内存)
    minSize = 6000;           // 清理后保留最小数量
    minBytesSize = 0.3GB;     // 清理后保留最小内存
    unloadPercent = 0.05;      // 每次清理 5% 的瓦片
}
```

卸载优先级 (`lruPriorityCallback`):
1. 低优先级瓦片先卸载
2. 长时间未访问的瓦片优先卸载
3. 子瓦片比父瓦片先卸载
4. 已加载瓦片比正在下载的先卸载

### 3.4 优先级队列

两个主要队列管理并发：

```javascript
downloadQueue.maxJobs = 25;   // 并发下载数
parseQueue.maxJobs = 5;       // 并发解析数
```

优先级排序 (`defaultPriorityCallback`):
1. 用户指定优先级 (`tile.priority`)
2. 已被使用的瓦片优先
3. 误差大的瓦片优先
4. 距离近的瓦片优先
5. 深度更深的瓦片优先

---

## 4. 核心代码逻辑

### 4.1 瓦片遍历状态机

```javascript
// Tile 状态定义
const UNLOADED = 0;  // 未加载
const QUEUED = 1;    // 排队中
const LOADING = 2;   // 下载中
const PARSING = 3;   // 解析中
const LOADED = 4;    // 已加载
const FAILED = 5;    // 加载失败
```

### 4.2 遍历函数核心逻辑

```javascript
// traverseFunctions.js - 四阶段遍历

// 阶段1: 标记使用的瓦片
function markUsedTiles(tile, renderer) {
    resetFrameState(tile);
    
    if (!tile.traversal.inFrustum) return;
    if (!canTraverse(tile)) {
        markUsed(tile);
        return;
    }
    
    // 递归检查子瓦片
    for (child of tile.children) {
        markUsedTiles(child, renderer);
    }
}

// 阶段2: 标记叶子瓦片
function markUsedSetLeaves(tile, renderer) {
    if (!isUsedThisFrame(tile)) return;
    
    let anyChildrenUsed = false;
    for (child of tile.children) {
        markUsedSetLeaves(child, renderer);
        anyChildrenUsed ||= isUsedThisFrame(child);
    }
    
    if (!anyChildrenUsed) {
        tile.traversal.isLeaf = true;
    }
}

// 阶段3: 标记可见瓦片
function markVisibleTiles(tile, renderer) {
    if (tile.traversal.isLeaf) {
        if (tile.internal.loadingState === LOADED) {
            tile.traversal.visible = true;
        }
        return;
    }
    
    // 递归处理子瓦片
    for (child of tile.children) {
        markVisibleTiles(child, renderer);
    }
}

// 阶段4: 切换显示状态
function toggleTiles(tile, renderer) {
    if (tile.traversal.wasSetVisible !== setVisible) {
        renderer.setTileVisible(tile, setVisible);
    }
}
```

### 4.3 瓦片解析流程

```javascript
// TilesRenderer.js parseTile
async parseTile(buffer, tile, extension, uri, abortSignal) {
    const fileType = readMagicBytes(buffer) || extension;
    
    switch (fileType) {
        case 'b3dm':  // Batched 3D Model
            const loader = new B3DMLoader(manager);
            return loader.parse(buffer);
            
        case 'pnts':  // Points
            const loader = new PNTSLoader(manager);
            return loader.parse(buffer);
            
        case 'i3dm':  // Instanced 3D Model
            const loader = new I3DMLoader(manager);
            return loader.parse(buffer);
            
        case 'cmpt':  // Composite
            const loader = new CMPTLoader(manager);
            return loader.parse(buffer);
            
        case 'gltf':
        case 'glb':
            const loader = new GLTFLoader(manager);
            return loader.parseAsync(buffer);
    }
}
```

---

## 5. 插件系统

### 5.1 插件接口

```javascript
class Plugin {
    priority = 0;  // 注册优先级，数值越高越早执行
    
    // 生命周期方法
    init(renderer) {}                              // 初始化
    loadRootTileset() {}                           // 加载根 tileset
    preprocessURL(url, tile) {}                    // URL 预处理
    preprocessNode(tile, dir, parent) {}          // 瓦片节点预处理
    preprocessTileset(json, url, parent) {}        // tileset 预处理
    parseTile(buffer, tile, ext, uri, signal) {}   // 瓦片内容解析
    processTileModel(scene, tile) {}               // 模型后处理
    calculateTileViewError(tile, target) {}       // 计算视口误差
    setTileVisible(tile, visible) {}              // 设置瓦片可见性
    setTileActive(tile, active) {}                // 设置瓦片激活状态
    disposeTile(tile) {}                          // 释放瓦片资源
    getAttributions(target) {}                     // 获取版权信息
    doTilesNeedUpdate() {}                         // 检查是否需要更新
}
```

### 5.2 内置插件

| 插件 | 功能 |
|------|------|
| `CesiumIonAuthPlugin` | Cesium Ion 云服务认证 |
| `GoogleCloudAuthPlugin` | Google Cloud 认证 |
| `ImplicitTilingPlugin` | 隐式瓦片细化支持 |
| `DebugTilesPlugin` | 调试可视化 |
| `FadeManager` | 瓦片淡入淡出效果 |
| `ImageOverlayPlugin` | 图像叠加支持 |

---

## 6. 数据格式支持

### 6.1 支持的 3D Tiles 格式

| 格式 | 说明 | 文件扩展 |
|------|------|----------|
| **B3DM** | 批量 3D 模型（带批次表） | `.b3dm` |
| **PNTS** | 点云数据 | `.pnts` |
| **I3DM** | 实例化 3D 模型 | `.i3dm` |
| **CMPT** | 复合瓦片（组合多种格式） | `.cmpt` |
| **GLTF/GLB** | 直接 GLTF 格式 | `.gltf`, `.glb` |

### 6.2 批处理表和特征表

```javascript
// 访问批处理表数据
const batchTable = object.batchTable;
const batchData = batchTable.getDataFromId(batchId);

// 访问特征表数据
const featureTable = object.featureTable;
const featureData = featureTable.getDataFromId(featureId);
```

---

## 7. 使用示例

### 7.1 基础 Three.js 集成

```javascript
import { TilesRenderer } from '3d-tiles-renderer';

const tilesRenderer = new TilesRenderer('./path/to/tileset.json');
tilesRenderer.setCamera(camera);
tilesRenderer.setResolutionFromRenderer(camera, renderer);
tilesRenderer.addEventListener('load-root-tileset', () => {
    const sphere = new Sphere();
    tilesRenderer.getBoundingSphere(sphere);
    tilesRenderer.group.position.copy(sphere.center).multiplyScalar(-1);
});

scene.add(tilesRenderer.group);

function renderLoop() {
    requestAnimationFrame(renderLoop);
    camera.updateMatrixWorld();
    tilesRenderer.update();
    renderer.render(scene, camera);
}
```

### 7.2 多渲染器共享缓存

```javascript
const tilesA = new TilesRenderer('./tilesetA.json');
const tilesB = new TilesRenderer('./tilesetB.json');

// 共享缓存和队列
tilesB.lruCache = tilesA.lruCache;
tilesB.downloadQueue = tilesA.downloadQueue;
tilesB.parseQueue = tilesA.parseQueue;
tilesB.processNodeQueue = tilesA.processNodeQueue;

scene.add(tilesA.group);
scene.add(tilesB.group);
```

### 7.3 自定义材质

```javascript
tilesRenderer.addEventListener('load-model', ({ scene }) => {
    scene.traverse(c => {
        if (c.material) {
            c.material = new MeshBasicMaterial({ color: 0xff0000 });
        }
    });
});
```

### 7.4 拾取批处理 ID

```javascript
const intersects = raycaster.intersectObject(scene, true);
if (intersects.length) {
    const batchidAttr = object.geometry.getAttribute('_batchid');
    if (batchidAttr) {
        const batchId = batchidAttr.getX(face.a);
        const batchTable = object.batchTable;
        const batchData = batchTable.getDataFromId(batchId);
        console.log(batchData);
    }
}
```

---

## 8. 性能优化配置

### 8.1 可配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `errorTarget` | 16 | 目标屏幕空间误差（像素） |
| `maxTilesProcessed` | 250 | 每帧最大处理瓦片数 |
| `displayActiveTiles` | false | 是否显示激活瓦片 |
| `maxDepth` | Infinity | 最大遍历深度 |
| `optimizedLoadStrategy` | false | 优化加载策略（实验性） |

### 8.2 内存管理

```javascript
tilesRenderer.lruCache.maxSize = 10000;
tilesRenderer.lruCache.maxBytesSize = 500 * 1024 * 1024; // 500MB
tilesRenderer.lruCache.minBytesSize = 400 * 1024 * 1024; // 400MB
```

---

## 9. 事件系统

| 事件 | 触发时机 |
|------|----------|
| `load-root-tileset` | 根 tileset 加载完成 |
| `load-tileset` | 任意 tileset JSON 加载完成 |
| `load-content` | 瓦片内容加载完成 |
| `load-model` | 模型解析完成 |
| `dispose-model` | 模型被释放 |
| `tile-visibility-change` | 瓦片可见性变化 |
| `tiles-load-start` | 开始加载 |
| `tiles-load-end` | 加载完成 |
| `tile-download-start` | 下载开始 |
| `load-error` | 加载失败 |
| `needs-update` | 需要重新渲染 |

---

## 10. 技术特点总结

### 优势
1. **引擎无关设计**: 核心逻辑与渲染器解耦
2. **插件化架构**: 通过插件扩展功能
3. **智能缓存**: LRU + 优先级队列实现高效内存管理
4. **异步并行**: 下载与解析分离，支持并发处理
5. **屏幕空间误差优化**: 基于视觉质量的自适应细化

### 局限性
1. 实验性功能（如 `optimizedLoadStrategy`）可能存在兼容性问题
2. 第三方认证插件依赖外部服务
3. 部分 3D Tiles 1.1+ 特性支持有限（详见下节）

---

## 11. 3D Tiles 1.1+ 特性支持详情

### 11.1 版本兼容性声明

```javascript
// TilesRendererBase.js preprocessTileset()
const version = json.asset.version;
const [ major, minor ] = version.split('.').map(v => parseInt(v));

if (major === 1 && minor > 0) {
    console.warn('TilesRenderer: tiles versions at 1.1 or higher have limited support. Some new extensions and features may not be supported.');
}
```

库对 3D Tiles 1.1+ 采用**渐进式支持策略**，核心瓦片遍历逻辑仅支持 1.x 版本，超出 1.x 版本会输出警告。

### 11.2 已支持的 3D Tiles 1.1+ 特性

#### 隐式瓦片细化 (Implicit Tiling)

| 特性 | 支持状态 | 实现位置 |
|------|----------|----------|
| `implicitTiling` 字段解析 | ✅ 完全支持 | `ImplicitTilingPlugin.js` |
| 四叉树细分 (QUADTREE) | ✅ 完全支持 | `SUBTREELoader.js` |
| 八叉树细分 (OCTREE) | ✅ 完全支持 | `SUBTREELoader.js` |
| 子树可用性位流 (Availability Bitstream) | ✅ 完全支持 | `SUBTREELoader.js` |
| 外部缓冲区引用 | ✅ 完全支持 | `SUBTREELoader.js` |
| 子树元数据 (Subtree Metadata) | ⚠️ 部分支持 | 代码中已预留接口但未实现 |

**隐式瓦片 URI 模板替换**:
```javascript
// ImplicitTilingPlugin.js preprocessURL()
const implicitUri = tile.implicitTiling.subtrees.uri
    .replace('{level}', tile.implicitTilingData.level)
    .replace('{x}', tile.implicitTilingData.x)
    .replace('{y}', tile.implicitTilingData.y)
    .replace('{z}', tile.implicitTilingData.z);
```

#### 包围盒扩展

| 扩展名 | 支持状态 | 说明 |
|--------|----------|------|
| `3DTILES_ellipsoid` | ✅ 完全支持 | 支持自定义椭球体定义 |

```javascript
// TilesRenderer.js loadRootTileset()
if ('3DTILES_ellipsoid' in extensions) {
    const ext = extensions['3DTILES_ellipsoid'];
    ellipsoid.radius.set(...ext.radii);
}
```

### 11.3 GLTF 扩展支持 (3D Tiles 1.1+ 相关)

| 扩展名 | 支持状态 | 实现位置 |
|--------|----------|----------|
| `EXT_mesh_features` | ✅ 完全支持 | `GLTFMeshFeaturesExtension.js` |
| `EXT_structural_metadata` | ✅ 完全支持 | `GLTFStructuralMetadataExtension.js` |

```javascript
// 访问 MeshFeatures
const meshFeatures = mesh.userData.meshFeatures;
if (meshFeatures) {
    const featureCount = meshFeatures.featureCount;
    const property = meshFeatures.getProperty(i, 'propertyName');
}

// 访问 StructuralMetadata
const structuralMetadata = scene.userData.structuralMetadata;
if (structuralMetadata) {
    const value = structuralMetadata.getPropertyByPropertyId(propertyId, index);
}
```

### 11.4 传统批处理表扩展

| 扩展名 | 支持状态 | 实现位置 |
|--------|----------|----------|
| `3DTILES_batch_table_hierarchy` | ✅ 完全支持 | `BatchTableHierarchyExtension.js` |

```javascript
// 访问批次表层级数据
const hierarchyData = batchData['3DTILES_batch_table_hierarchy'];
```

### 11.5 PNTS 点云扩展

| 扩展名 | 支持状态 | 说明 |
|--------|----------|------|
| `3DTILES_draco_point_compression` | ✅ 完全支持 | DRACO 压缩点云 |

### 11.6 未支持或有限的特性

| 特性/扩展 | 支持状态 | 说明 |
|-----------|----------|------|
| `subtreeMetadata` | ❌ 未实现 | 子树元数据扩展，预留接口但未激活 |
| `3DTILES_multiple_contents` | ❌ 未实现 | 多内容瓦片（单个瓦片多个 GLTF） |
| `3DTILES_content_gltf` (1.1+) | ⚠️ 部分支持 | GLTF 直接作为内容类型已支持 |
| tilesetMetadata | ⚠️ 部分支持 | 仅解析，访问接口有限 |
| 纹理压缩 (KTX2/DDS) | ⚠️ 需手动配置 | 需通过 GLTFLoader 添加处理器 |

### 11.7 版本兼容性注意事项

1. **版本断言**: 代码断言 `asset.version` 必须 ≤ 1.x
   ```javascript
   console.assert(major <= 1, 'TilesRenderer: asset.version is expected to be a 1.x or a compatible version.');
   ```

2. **实验性警告**: 使用 1.1+ 版本时控制台会输出警告
   ```javascript
   console.warn('TilesRenderer: tiles versions at 1.1 or higher have limited support. Some new extensions and features may not be supported.');
   ```

3. **优化加载策略兼容性**: `optimizedLoadStrategy` 与以下插件不兼容：
   - `ImageOverlayPlugin` (启用 `enableTileSplitting` 时)
   - `QuantizedMeshPlugin`
   - `ImageFormatPlugin` 子类 (XYZ, TMS 等)

### 11.8 未来可能支持的特性

根据代码分析，以下特性可能在未来版本中得到支持：

1. **子树元数据** (`subtreeMetadata`) - 接口已预留
2. **多内容瓦片** (`3DTILES_multiple_contents`) - 需要扩展解析逻辑
3. **纹理压缩** - 需要更好的内置支持
4. **3D Tiles 2.0** - 尚未规划

### 11.9 检测 tileset 版本的方法

```javascript
tilesRenderer.addEventListener('load-root-tileset', ({ tileset }) => {
    const version = tileset.asset.version;
    console.log(`Tileset version: ${version}`);
    
    if (version !== '1.0' && version !== '1.1') {
        console.warn('Unsupported tileset version');
    }
});
```

---

## 参考资料

- [3D Tiles 规范](https://github.com/CesiumGS/3d-tiles/tree/master/specification)
- [NASA AMMOS 项目](https://github.com/NASA-AMMOS)
- [官方文档](./USAGE.md)
