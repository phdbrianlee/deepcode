# ebeaufay/threedtiles 项目分析文档

## 1. 项目概述

**threedtiles** (也称为 @jdultra/threedtiles) 是一个用于 Three.js 的 OGC 3D Tiles 1.1 规范实现，支持 Gaussian Splats。

- **GitHub**: https://github.com/ebeaufay/threedtiles
- **npm**: @jdultra/threedtiles
- **当前版本**: 14.0.26
- **许可证**: MIT
- **技术栈**: Three.js ^0.182.0 + OGC 3DTiles 1.1

### 核心特性

- **OGC 3DTiles 1.1 支持**：完整的 tileset.json 解析和 LOD 支持
- **多种数据格式**：B3DM、glTF/GLB、Gaussian Splats (SPZ)
- **LOD 策略**：支持 INCREMENTAL、IMMEDIATE、PERLEVEL 三种加载策略
- **遮挡剔除**：基于 CPU 的遮挡剔除服务
- **物理模拟**：集成 Rapier3D 物理引擎
- **高斯 splatting**：通过 KHR_gaussian_splatting_compression_spz 扩展支持
- **坐标转换**：支持 WGS84 (region) 和笛卡尔坐标系统

### 渲染架构

**threedtiles 本身是一个基于 Three.js 的 3D Tiles 渲染器**，可作为独立引擎使用，也可与地图库集成：

```
┌─────────────────────────────────────────────────────────────┐
│                   独立使用                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Three.js Scene + OrbitControls                     │   │
│  │  ├── OGC3DTile (Tileset 根节点)                     │   │
│  │  │   ├── B3DM/glTF/GLB Tiles                        │   │
│  │  │   └── Gaussian Splats (SPZ)                       │   │
│  │  └── 物理引擎 (Rapier3D)                            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   地图集成模式                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  MapLibre GL / Cesium JS (地图底图)                 │   │
│  │  └── 叠加 OGC3DTiles (Three.js 渲染层)             │   │
│  │       └── 坐标同步到地图坐标系统                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 技术架构

### 2.1 技术栈与第三方依赖

```
┌─────────────────────────────────────────────────────────────┐
│                 Three.js ^0.182.0                          │
│                  (3D 渲染引擎)                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐ │
│  │         OGC3DTile (核心类)                           │ │
│  │  ├── TileLoader (瓦片加载管理)                        │ │
│  │  ├── B3DMDecoder / GLTFTileDecoder                  │ │
│  │  ├── SplatsMesh (高斯 splat 渲染)                    │ │
│  │  └── OcclusionCullingService                         │ │
│  └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    核心依赖库                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ Rapier3D     │  │ meshoptimizer │  │ KTX2Loader    │   │
│  │ (物理引擎)   │  │ (网格优化)    │  │ (纹理压缩)    │   │
│  └──────────────┘  └──────────────┘  └────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    数据格式支持                               │
│         B3DM, glTF/GLB, SPZ (Gaussian Splats)             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 第三方依赖库详解

threedtiles 的 `package.json` 中定义的完整依赖列表：

#### 生产依赖 (dependencies)

| 库 | 版本 | 说明 |
|---|------|------|
| `@dimforge/rapier3d-compat` | ^0.19.3 | **Rapier3D 物理引擎** - WASM 版本的 Rapier 物理引擎，支持刚体动力学、碰撞检测 |
| `@haragei/dag` | ^1.1.0 | DAG（有向无环图）数据结构，用于 tileset 层级的解析 |
| `@spz-loader/core` | ^0.3.0 | SPZ (Gaussian Splats) 格式的加载器核心 |
| `data-structure-typed` | ^2.0.4 | 数据结构库（提供优先队列等） |
| `mathjs` | ^14.7.0 | 数学库，用于坐标变换计算 |
| `meshoptimizer` | ^0.25.0 | 网格优化库，压缩和优化 glTF 模型 |
| `path-browserify` | ^1.0.1 | 浏览器端 path 处理兼容库 |
| `spz-js` | ^1.2.5 | **SPZ 格式支持** - Gaussian Splats 的 JavaScript 实现 |
| `uuid` | ^13.0.0 | UUID 生成工具 |

#### 关键库详解

##### Rapier3D 物理引擎

**@dimforge/rapier3d-compat** 是 Rapier 物理引擎的 WebAssembly 版本，threedtiles 使用它实现：

```javascript
// physics.js
import { Physics } from '@dimforge/rapier3d-compat';

// 创建物理世界
const sim = new Physics({
    gravity: [0, -9.81, 0]
});

// 添加静态刚体（地面）
sim.addObject({
    type: 'fixed',
    position: [0, 0, 0],
    shape: { type: 'trimesh', ... }
});

// 添加动态刚体
const bodyId = sim.addObject({
    type: 'dynamic',
    mass: 1,
    position: [10, 100, 0],
    velocity: [0, 0, 0]
});
```

**threedtiles 中的物理配置**：
```javascript
const tileset = new OGC3DTile({
    physics: {
        sim: physicsInstance,
        type: 'fixed',  // 'dynamic' | 'kinematic' | 'fixed'
        mass: 1,
        velocity: [0, 0, 0],
        colliders: {
            maxLOD: 4,
            priority: ['mesh', 'hull', 'bounds'],
            byLevel: [
                { shape: 'mesh', min: 4, max: 4 },
                { shape: 'hull', min: 3, max: 3 },
                { shape: 'bounds', min: 0, max: 2 }
            ]
        }
    }
});
```

**支持的功能**：
- 刚体动力学（动态/静态/运动学）
- 碰撞形状：Mesh、Hull、Bounds
- 基于 LOD 级别的碰撞器切换
- 射线检测

##### Gaussian Splats 支持

**SPZ (Gaussian Splatting)** 通过以下库组合支持：

| 库 | 作用 |
|---|------|
| `@spz-loader/core` | SPZ 格式解析和加载 |
| `spz-js` | JavaScript 端的 GS 实现 |
| `SplatsMesh.js` | Three.js 原生渲染 |

**SplatsMesh 渲染原理**：

```javascript
// src/splats/SplatsMesh.js
class SplatsMesh extends Mesh {
    constructor(renderer) {
        // 使用 WebGL 3D Render Target 存储 GS 数据
        this.positionColorRenderTarget = new WebGL3DRenderTarget(
            textureSize, textureSize, numTextures, {
                type: FloatType,
                format: RGBAFormat,
                internalFormat: 'RGBA32F'
            }
        );
        
        // 协方差矩阵（控制 splat 形状）
        this.covarianceRenderTarget = new WebGL3DRenderTarget(...);
        
        // 自定义着色器
        const material = new ShaderMaterial({
            glslVersion: GLSL3,
            uniforms: {
                covarianceTexture: { value: covarianceRenderTarget.texture },
                positionColorTexture: { value: positionColorRenderTarget.texture },
            },
            vertexShader: splatsVertexShader(),
            fragmentShader: splatsFragmentShader(),
        });
    }
}
```

**关键特性**：
- 使用 GLSL3 着色器
- Float32 纹理存储高斯参数
- 协方差矩阵控制 splat 形状和方向
- 支持可视质量调节（splatsQuality）
- CPU 遮挡剔除（splatsCPUCulling）
- 深度偏置调整避免渲染穿插
┌─────────────────────────────────────────────────────────────┐
│                 Three.js ^0.182.0                          │
│                  (3D 渲染引擎)                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │         OGC3DTile (核心类)                           │   │
│  │  ├── TileLoader (瓦片加载管理)                        │   │
│  │  ├── B3DMDecoder / GLTFTileDecoder                  │   │
│  │  ├── SplatsMesh (高斯 splat 渲染)                    │   │
│  │  └── OcclusionCullingService                         │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ Rapier3D     │  │ meshoptimizer │  │ KTX2Loader    │   │
│  │ (物理引擎)   │  │ (网格优化)    │  │ (纹理压缩)    │   │
│  └──────────────┘  └──────────────┘  └────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  数据格式: B3DM, glTF/GLB, SPZ (Gaussian Splats)        │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 项目目录结构

```
threedtiles/
├── src/
│   ├── tileset/
│   │   ├── OGC3DTile.js          # 核心 tileset 类
│   │   ├── TileLoader.js          # 瓦片加载器
│   │   ├── OcclusionCullingService.js
│   │   ├── implicit/
│   │   │   └── ImplicitTileResolver.js
│   │   └── instanced/
│   │       ├── InstancedOGC3DTile.js
│   │       └── InstancedTileLoader.js
│   ├── splats/
│   │   ├── SplatsMesh.js          # Gaussian Splats 渲染
│   │   ├── SplatsColider.js
│   │   └── radix/                  # WASM 排序器
│   ├── decoder/
│   │   ├── B3DMDecoder.js         # B3DM 格式解码
│   │   └── GLTFTileDecoder.js     # glTF 解码
│   ├── geometry/
│   │   └── obb.js                 # 有向包围盒
│   └── simulation/
│       └── physics.js             # Rapier3D 物理集成
└── package.json
```

---

## 3. 核心组件

### 3.1 OGC3DTile - 核心 tileset 类

**核心文件**: `src/tileset/OGC3DTile.js`

```javascript
// OGC3DTile.js:51-134
class OGC3DTile extends THREE.Object3D {
    constructor(properties) {
        super();
        // 核心配置
        this.url = properties.url;           // tileset.json URL
        this.renderer = properties.renderer; // Three.js 渲染器
        this.geometricErrorMultiplier = properties.geometricErrorMultiplier || 1.0;
        this.loadingStrategy = properties.loadingStrategy || "INCREMENTAL";
        
        // 初始化 TileLoader
        this.tileLoader = new TileLoader(tileLoaderOptions);
    }
}
```

**关键配置选项**:

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `url` | string | - | tileset.json URL |
| `renderer` | THREE.Renderer | - | WebGL 渲染器 |
| `geometricErrorMultiplier` | number | 1.0 | 几何误差乘数 |
| `loadingStrategy` | string | "INCREMENTAL" | 加载策略 |
| `loadOutsideView` | boolean | false | 视锥外加载 |
| `centerModel` | boolean | false | 居中并旋转 |
| `occlusionCullingService` | object | - | 遮挡剔除服务 |
| `physics` | object | - | 物理配置 |

### 3.2 TileLoader - 瓦片加载管理

**核心文件**: `src/tileset/TileLoader.js`

```javascript
// TileLoader.js:22-100
class TileLoader {
    constructor(options) {
        this.maxCachedItems = options.maxCachedItems || 100;
        this.downloadParallelism = options.downloadParallelism || 8;
        
        // 初始化解码器
        this.b3dmDecoder = new B3DMDecoder(this.gltfLoader);
        this.GLTFTileDecoder = new GLTFTileDecoder(this.gltfLoader, this.renderer);
        
        // LRU 缓存
        this.cache = new LinkedHashMap();
    }
    
    // 调度瓦片下载
    get(abortController, tileIdentifier, path, callback, ...) {
        // 检查缓存
        const cachedObject = this.cache.get(key);
        if (cachedObject) {
            // 直接使用缓存
        } else {
            // 下载并解码
        }
    }
}
```

### 3.3 坐标系统与地理定位

```javascript
// OGC3DTile.js:535-553
// 支持三种包围盒类型
if (self.json.boundingVolume.box) {
    self.boundingVolume = new OBB(self.json.boundingVolume.box);
} else if (self.json.boundingVolume.region) {
    // WGS84 经纬度 → 地心坐标转换
    self._transformWGS84ToCartesian(region[0], region[1], region[4], tempVec1);
    self.boundingVolume = new THREE.Sphere(center, radius);
} else if (self.json.boundingVolume.sphere) {
    self.boundingVolume = new THREE.Sphere(center, radius);
}
```

**WGS84 到笛卡尔转换**:

```javascript
// src/index.js:546-557
function llhToCartesianFast(longitude, latitude, height) {
    const lon = longitude * 0.017453292519;
    const lat = latitude * 0.017453292519;
    const N = 6378137.0 / Math.sqrt(1.0 - 0.006694379990141316 * Math.pow(Math.sin(lat), 2));
    return new THREE.Vector3(
        (N + height) * Math.cos(lat) * Math.cos(lon),
        (N + height) * Math.cos(lat) * Math.sin(lon),
        (0.993305620009858684 * N + height) * Math.sin(lat)
    );
}
```

---

## 4. Gaussian Splats 支持

### 4.1 SplatsMesh

**核心文件**: `src/splats/SplatsMesh.js`

```javascript
// SplatsMesh.js:34-145
class SplatsMesh extends Mesh {
    constructor(renderer, isStatic, fragShader, scaleMultiplier) {
        // WebGL 3D Render Targets for GS
        this.positionColorRenderTarget = new WebGL3DRenderTarget(textureSize, textureSize, ...);
        this.covarianceRenderTarget = new WebGL3DRenderTarget(textureSize, textureSize, ...);
        
        // Shader Material with custom GLSL
        const material = new ShaderMaterial({
            glslVersion: GLSL3,
            uniforms: {
                covarianceTexture: { value: covarianceRenderTarget.texture },
                positionColorTexture: { value: positionColorRenderTarget.texture },
            },
            vertexShader: splatsVertexShader(),
            fragmentShader: splatsFragmentShader(),
        });
    }
}
```

### 4.2 加载 Gaussian Splats

```javascript
// TileLoader.js:353-417
if (path.includes(".glb") || path.includes(".gltf")) {
    downloadFunction = () => {
        return this.GLTFTileDecoder.parseSplats(
            resultArrayBuffer, 
            sceneZupToYup, 
            meshZupToYup, 
            splatsMesh
        );
    }
}
```

---

## 5. 加载策略

### 5.1 三种加载策略

```javascript
// OGC3DTile.js:842-871
switch (this.loadingStrategy) {
    case "IMMEDIATE":
        return self._calculateDistanceToCamera(self.cameraOnLoad);
    case "INCREMENTAL":
        // 父节点距离 / 层级
        if (self.parentTile) {
            return self.parentTile._calculateDistanceToCamera() / Math.max(1, self.parentTile.level);
        }
    case "PERLEVEL":
        // 层级 + 距离
        if (self.parentTile) {
            return self.level + self.parentTile._calculateDistanceToCamera();
        }
}
```

### 5.2 LOD 控制参数

```javascript
// geometricErrorMultiplier: 1.0 → maxScreenSpaceError = 16
// geometricErrorMultiplier: 0.5 → maxScreenSpaceError = 32

// distanceBias: 控制近远细节加载
// distanceBias > 1: 近处更多细节
// distanceBias < 1: 远处更多细节
```

---

## 6. 遮挡剔除

```javascript
// OcclusionCullingService.js
class OcclusionCullingService {
    update(scene, renderer, camera) {
        // 颜色 ID 渲染 → CPU 回读 → 判断遮挡
    }
}

// 使用示例
const occlusionCullingService = new OcclusionCullingService();
const ogc3DTile = new OGC3DTile({
    url: "...",
    occlusionCullingService: occlusionCullingService
});
```

---

## 7. 与地图库集成

### 7.1 渲染集成方式：Overlaid vs Interleaved

根据 [deck.gl 文档](https://deck.gl/docs/get-started/using-with-map)，3D 渲染层与地图的集成有两种方式：

| 方式 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| **Overlaid** | Deck canvas 渲染在地图上方作为独立 DOM 元素，相机同步 | 更健壮，两库独立管理渲染，互不干扰 | 无法与地图3D特征产生遮挡 |
| **Interleaved** | Deck 渲染到地图的 WebGL2 context 中 | 可与地图标签/3D特征产生真实遮挡 | 需要地图库暴露 WebGL2 API，可能有兼容性限制 |

**threedtiles 与地图的集成采用 Overlaid 方式**：
- Three.js 渲染器创建独立的 Canvas（或共享地图 Canvas）
- 相机矩阵与地图同步
- 两个渲染层独立绘制，通过 CSS z-index 控制层级

### 7.2 与 MapLibre GL JS 集成

**MapLibre GL JS** 是 Mapbox GL JS 的开源分支（Apache 2.0 许可），两者 API 高度兼容。

```javascript
import maplibregl from 'maplibre-gl';
import { OGC3DTile } from '@jdultra/threedtiles';
import * as THREE from 'three';

// 1. 创建 MapLibre GL 地图
const map = new maplibregl.Map({
    container: 'map',
    style: 'https://demotiles.maplibre.org/style.json',
    center: [-122.4, 37.8],
    zoom: 12,
    pitch: 60
});

// 2. 等待地图加载完成
map.on('load', () => {
    // 3. 创建 Three.js 渲染器（覆盖在地图上）
    const renderer = new THREE.WebGLRenderer({ 
        canvas: map.getCanvas(),  // 可选：共享地图 Canvas
        alpha: true,
        antialias: true
    });
    renderer.autoClear = false;
    
    // 4. 创建 Three.js 相机并同步
    const camera = new THREE.PerspectiveCamera();
    
    // 5. 创建 3DTiles
    const tileset = new OGC3DTile({
        url: "https://storage.googleapis.com/ogc-3d-tiles/.../tileset.json",
        renderer: renderer,
        centerModel: false,
        geometricErrorMultiplier: 1.0
    });
    
    scene.add(tileset);
    
    // 6. 渲染循环
    function animate() {
        requestAnimationFrame(animate);
        
        // 同步 MapLibre 相机到 Three.js
        const mapCamera = map.getCamera();
        camera.matrixWorldInverse.copy(mapCamera.matrixWorldInverse);
        camera.projectionMatrix.copy(mapCamera.projectionMatrix);
        
        tileset.update(camera);
        tileset.tileLoader.update();
        
        renderer.render(scene, camera);
    }
    animate();
});
```

### 7.3 与 Mapbox GL JS 集成

**Mapbox GL JS** 与 MapLibre GL JS API 几乎相同：

```javascript
import mapboxgl from 'mapbox-gl';
import { OGC3DTile } from '@jdultra/threedtiles';
import * as THREE from 'three';

// 设置 Mapbox Access Token
mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-122.4, 37.8],
    zoom: 12,
    pitch: 60
});

// 后续步骤与 MapLibre GL 相同...
```

### 7.4 与 Cesium JS 集成

**Cesium JS** 是完整的地理空间平台，原生支持 OGC 3D Tiles。threedtiles 可作为补充，在 Cesium 场景上叠加额外的 Three.js 渲染内容。

**注意**：Cesium 本身已有 `Cesium3DTileset` 实现，threedtiles 与 Cesium 的集成本质上与 Overlaid 方式相同（独立 Canvas + 相机同步）。

```javascript
import * as Cesium from 'cesium';
import { OGC3DTile } from '@jdultra/threedtiles';
import * as THREE from 'three';

// 1. 创建 Cesium Viewer
const viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: Cesium.createWorldTerrain(),
    shouldAnimate: true
});

// 2. 创建独立 Three.js Canvas
const threeCanvas = document.createElement('canvas');
threeCanvas.style.position = 'absolute';
threeCanvas.style.top = '0';
threeCanvas.style.left = '0';
threeCanvas.style.pointerEvents = 'none';
viewer.container.appendChild(threeCanvas);

const renderer = new THREE.WebGLRenderer({ 
    canvas: threeCanvas,
    alpha: true 
});
renderer.autoClear = false;

// 3. 创建 threedtiles
const tileset = new OGC3DTile({
    url: 'https://storage.googleapis.com/ogc-3d-tiles/.../tileset.json',
    renderer: renderer,
    centerModel: true
});

// 4. 相机同步
const threeCamera = new THREE.PerspectiveCamera();
const cesiumCamera = viewer.camera;

function animate() {
    requestAnimationFrame(animate);
    
    threeCamera.matrixWorldInverse.copy(cesiumCamera.viewMatrix);
    threeCamera.projectionMatrix.copy(cesiumCamera.frustum.projectionMatrix);
    
    tileset.update(threeCamera);
    tileset.tileLoader.update();
    
    renderer.render(scene, threeCamera);
}
animate();
```

### 7.5 地理坐标对齐

对于使用 `region` 边界体的 3DTiles，需要进行坐标转换：

```javascript
// WGS84 经纬度 → 地心坐标 (ECEF)
function llhToCartesian(longitude, latitude, height) {
    const a = 6378137.0;                    // 长半轴
    const e2 = 0.00669437999014;           // 第一偏心率的平方
    
    const lon = longitude * Math.PI / 180;
    const lat = latitude * Math.PI / 180;
    const N = a / Math.sqrt(1 - e2 * Math.sin(lat) * Math.sin(lat));
    
    return new THREE.Vector3(
        (N + height) * Math.cos(lat) * Math.cos(lon),
        (N + height) * Math.cos(lat) * Math.sin(lon),
        (N * (1 - e2) + height) * Math.sin(lat)
    );
}

// 定位 tileset 到指定经纬度
const center = llhToCartesian(longitude, latitude, height);
tileset.position.copy(center);
```

### 7.6 Cesium3DTileset vs threedtiles 对比

| 维度 | Cesium3DTileset | threedtiles |
|------|----------------|--------------|
| **渲染引擎** | Cesium 私有渲染器 | Three.js |
| **地图集成** | 原生集成 | Overlaid 方式叠加 |
| **3D Tiles 版本** | 0.0/1.0 | **1.1** |
| **Gaussian Splats** | 实验性支持 | **完整支持** |
| **自定义着色器** | 有限 (CustomShader) | **完整 Three.js 着色器** |
| **物理引擎** | 无 | **Rapier3D** |
| **遮挡剔除** | 基于屏幕空间误差 | **CPU 遮挡剔除** |
| **使用场景** | 地理可视化平台 | 需要 Three.js 集成的应用 |

---

## 8. 使用示例

### 8.1 基本用法

```javascript
import * as THREE from 'three';
import { OGC3DTile, TileLoader } from '@jdultra/threedtiles';

// 创建场景
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 创建相机
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000000);
camera.position.set(0, 100, 0);

// 加载 3D Tiles
const tileset = new OGC3DTile({
    url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
    renderer: renderer,
    geometricErrorMultiplier: 1.0,
    loadingStrategy: "INCREMENTAL"
});

scene.add(tileset);

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    tileset.update(camera);
    tileset.tileLoader.update();
    renderer.render(scene, camera);
}
```

### 8.2 共享 TileLoader

```javascript
const tileLoader = new TileLoader({
    renderer: renderer,
    maxCachedItems: 100,
    meshCallback: (mesh, geometricError) => {
        mesh.material.side = THREE.DoubleSide;
    }
});

const tileset1 = new OGC3DTile({
    url: "...",
    tileLoader: tileLoader
});

const tileset2 = new OGC3DTile({
    url: "...",
    tileLoader: tileLoader
});
```

---

## 9. 与 3DTilesRendererJS 对比

**3DTilesRendererJS** 是 NASA AMMOS 开发的 OGC 3D Tiles 渲染库，与 threedtiles 都是 Three.js 生态下的 3D Tiles 实现。

| 维度 | 3DTilesRendererJS | ebeaufay/threedtiles |
|------|-------------------|---------------------|
| **开发者** | NASA AMMOS | Emeric Beaufays |
| **许可证** | Apache-2.0 | MIT |
| **核心架构** | 引擎无关 + 多渲染器插件 | Three.js 原生集成 |
| **多渲染器支持** | Three.js / Babylon.js / R3F | Three.js only |
| **3D Tiles 版本** | 1.0/1.1 (1.1+ 有警告) | **1.1 完整支持** |
| **隐式瓦片** | ✅ 插件支持 | ✅ 内置支持 |
| **Gaussian Splats** | ❌ | ✅ SPZ 格式 |
| **物理引擎** | ❌ | ✅ Rapier3D |
| **遮挡剔除** | 无 | ✅ CPU 遮挡剔除 |
| **点云格式** | PNTS, B3DM | B3DM, glTF/GLB |
| **插件系统** | ✅ 丰富插件 | ❌ |
| **Cesium Ion 认证** | ✅ | ❌ |
| **Google 认证** | ✅ | ❌ |
| **内存管理** | LRU + 优先级队列 | LinkedHashMap |

### 9.1 架构差异

**3DTilesRendererJS** 采用模块化架构：
```
TilesRendererBase (核心)
    ├── TilesRenderer (Three.js)
    ├── TilesRenderer (Babylon.js)
    └── TilesRenderer (R3F)
```

**threedtiles** 直接继承 THREE.Object3D，作为场景节点直接使用。

### 9.2 功能特性对比

| 特性 | 3DTilesRendererJS | threedtiles |
|------|-------------------|-------------|
| tileset.json 嵌套加载 | ✅ | ✅ |
| B3DM 格式 | ✅ | ✅ |
| PNTS 点云 | ✅ | ❌ (通过 glTF) |
| I3DM 实例化 | ✅ | ❌ |
| CMPT 复合瓦片 | ✅ | ❌ |
| glTF/GLB 直接加载 | ✅ | ✅ |
| SPZ (Gaussian Splats) | ❌ | ✅ |
| 视锥体裁剪 | ✅ | ✅ |
| 屏幕空间误差 | ✅ | ✅ |
| LRU 缓存 | ✅ | ✅ |
| 遮挡剔除 | ❌ | ✅ |
| 物理模拟 | ❌ | ✅ |
| 坐标变换 (Z-up→Y-up) | ✅ | ✅ |

### 9.3 适用场景

| 场景 | 推荐库 |
|------|--------|
| Babylon.js 环境 | 3DTilesRendererJS |
| React Three Fiber 环境 | 3DTilesRendererJS |
| 需要 Cesium Ion 集成 | 3DTilesRendererJS |
| 需要 Gaussian Splats | threedtiles |
| 需要物理引擎 | threedtiles |
| 需要遮挡剔除 | threedtiles |
| NASA/政府项目 | 3DTilesRendererJS |
| 简单 Three.js 集成 | threedtiles |

---

## 10. 与 canyon/3d-web-viewer 和 maplibre-gl-lidar 对比

| 维度 | canyon/3d-web-viewer | maplibre-gl-lidar | ebeaufay/threedtiles |
|------|----------------------|-------------------|---------------------|
| **核心功能** | 点云可视化 | LiDAR 点云叠加地图 | OGC 3DTiles 渲染 |
| **3D 引擎** | Three.js (独立) | deck.gl → MapLibre | Three.js (原生) |
| **地图集成** | 无 | 叠加在 MapLibre 上 | **Overlaid 叠加** |
| **数据格式** | PCD, XYZ, PLY | LAS, LAZ, COPC, EPT | B3DM, glTF/GLB, SPZ |
| **LOD 支持** | 无 | 无 | **完整 LOD** |
| **坐标系** | 笛卡尔 | 经纬度偏移 | 地理/笛卡尔 |
| **高斯 Splats** | 无 | 无 | **支持** |
| **物理引擎** | 无 | 无 | **Rapier3D** |

### 10.1 核心差异

1. **threedtiles**：完整的 OGC 3DTiles 1.1 实现，支持 LOD、多种格式、Gaussian Splats、物理引擎
2. **maplibre-gl-lidar**：专精于 LiDAR 点云的地图叠加（Overlaid 方式）
3. **3d-web-viewer**：轻量级点云可视化工具
4. **3DTilesRendererJS**：NASA 开发的模块化 3D Tiles 库，支持多渲染器

---

## 11. 关键技术点

### 11.1 B3DM 解码

```javascript
// B3DMDecoder.js
async parseB3DM(arrayBuffer, callback, sceneZUpToYUp, meshZUpToYUp) {
    // 1. 解析 B3DM 头部 (28 bytes)
    // 2. 提取 FeatureTable JSON
    // 3. 提取 BatchTable JSON
    // 4. 解码 glTF 二进制数据
    // 5. 应用坐标变换 (Z-up → Y-up)
}
```

### 11.2 遮挡剔除

```javascript
// OcclusionCullingService.js
update(scene, renderer, camera) {
    // 1. 渲染颜色 ID 到 RenderTarget
    // 2. CPU 回读像素数据
    // 3. 检测被遮挡的 Tile
    // 4. 跳过被遮挡 Tile 的加载
}
```

### 11.3 Z-up 到 Y-up 变换

```javascript
// TileLoader.js:46-50
this.zUpToYUpMatrix = new THREE.Matrix4();
this.zUpToYUpMatrix.set(
    1,  0,  0,  0,
    0,  0, -1,  0,
    0,  1,  0,  0,
    0,  0,  0,  1
);
```

---

## 12. 参考资料

- [threedtiles GitHub](https://github.com/ebeaufay/threedtiles)
- [OGC 3D Tiles 1.1 规范](https://docs.ogc.org/cs/22-025r4/22-025r4.html)
- [Three.js](https://threejs.org/)
- [Rapier3D 物理引擎](https://dimforge.github.io/rapier/)
- [Gaussian Splatting 论文](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/)
- [SPZ 格式扩展 (glTF)](https://github.com/CesiumGS/glTF/tree/draft-splat-spz/extensions/2.0/Khronos/KHR_gaussian_splatting%20)
- [Cesium3DTileset 文档](https://cesium.com/learn/cesiumjs/ref-doc/Cesium3DTileset.html)
- [deck.gl 地图集成指南](https://deck.gl/docs/get-started/using-with-map)
- [B3DM 格式规范](https://github.com/CesiumGS/3d-tiles/tree/main/specification/TileFormats/BatchTable3DModel)
- [MapLibre GL JS](https://maplibre.org/)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/)
