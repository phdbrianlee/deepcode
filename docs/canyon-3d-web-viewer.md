# canyon/3d-web-viewer 项目分析文档

## 1. 项目概述

**3d-web-viewer** 是一个轻量级的前端 Web 应用，用于可视化 3D 点云数据和 GeoJSON 地理空间数据。

- **GitHub**: https://github.com/canyon/3d-web-viewer
- **当前版本**: 0.0.0
- **许可证**: MIT (推测)
- **技术栈**: React + TailwindCSS + Three.js + mapbox-gl

### 核心特性

- 拖拽上传文件
- 实时日志显示
- 交互式 3D 查看器（旋转、缩放）
- 支持多种点云格式：PCD、XYZ、TXT、PLY
- GeoJSON 地理数据可视化
- 可定制 GUI 控制面板

### 渲染架构

**点云可视化与地图可视化采用完全独立的渲染层**，两者不叠加：

| 可视化类型 | 渲染引擎 | 容器 | 坐标系统 |
|-----------|---------|------|---------|
| 点云 (PCD/XYZ/PLY/TXT) | Three.js WebGLRenderer | 独立 Canvas | 笛卡尔坐标 |
| GeoJSON 地理数据 | mapbox-gl | react-map-gl Map 组件 | 经纬度/墨卡托投影 |

- **点云 (LoadPointCloud)**：独立的 Three.js 场景、相机、渲染器，不依赖地图
- **GeoJSON (LoadGeoJSON)**：基于 react-map-gl 的 mapbox-gl 地图，GeoJSON 数据叠加在地图底图上

通过 `FileVisualizer` 组件根据文件类型选择其一进行展示，两者互不干扰。

---

## 2. 技术架构

### 2.1 技术栈

```
┌─────────────────────────────────────────────────────────┐
│                     React 18.3.1                        │
│                   (UI 框架 + 状态管理)                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐          ┌─────────────────────┐ │
│  │   Three.js      │          │    mapbox-gl        │ │
│  │   ^0.172.0      │          │    ^3.9.4           │ │
│  │  (3D 点云渲染)   │          │  (地图 + GeoJSON)    │ │
│  └────────┬────────┘          └──────────┬──────────┘ │
│           │                                │             │
│  ┌────────▼────────┐              ┌───────▼─────────┐ │
│  │ react-three/fiber│              │   react-map-gl  │ │
│  │  ^8.17.14       │              │   ^7.1.9         │ │
│  └─────────────────┘              └──────────────────┘ │
├─────────────────────────────────────────────────────────┤
│              Vite 6.0.5 (构建工具)                       │
│              TailwindCSS 3.4.17 (样式)                  │
└─────────────────────────────────────────────────────────┘
```

### 2.2 项目目录结构

```
3d-web-viewer/
├── src/
│   ├── app/
│   │   └── dashboard/
│   │       ├── page.tsx       # 主页面
│   │       ├── IndexPage.tsx   # 索引页
│   │       └── next-blocks.tsx # 组件块
│   ├── components/
│   │   ├── FileVisualizer.tsx  # 文件可视化器入口
│   │   ├── LoadPointCloud.tsx  # Three.js 点云加载
│   │   ├── LoadGeoJSON.tsx     # mapbox-gl GeoJSON 加载
│   │   ├── GeoLayerStyle.tsx   # 图层样式配置
│   │   └── ui/                 # shadcn/ui 组件库
│   ├── hooks/
│   │   ├── use-toast.ts        # Toast 通知
│   │   └── use-mobile.tsx      # 移动端检测
│   ├── lib/
│   │   └── utils.ts            # 工具函数
│   ├── types/
│   │   └── index.ts            # TypeScript 类型定义
│   ├── App.tsx
│   └── main.tsx
├── sample_data/                 # 示例数据
│   ├── dragon.pcd
│   ├── dragon.xyz
│   ├── bunny.txt
│   ├── dragon.ply
│   └── example.json
└── package.json
```

---

## 3. Three.js ^0.172.0 集成原理

### 3.1 核心组件架构

Three.js 在本项目中用于渲染点云数据，核心组件为 `LoadPointCloud.tsx`：

```
LoadPointCloud 组件
    │
    ├── threeContainerRef (HTMLDivElement) - WebGL 容器
    │
    ├── sceneRef (THREE.Scene) - 场景图
    │       ├── AmbientLight
    │       ├── DirectionalLight
    │       └── Points (点云网格)
    │
    ├── cameraRef (THREE.PerspectiveCamera) - 透视相机
    │
    ├── rendererRef (THREE.WebGLRenderer) - WebGL 渲染器
    │
    ├── controlsRef (OrbitControls) - 轨道控制器
    │
    └── loaders (PCDLoader, XYZLoader, PLYLoader)
```

### 3.2 初始化流程

```typescript
// LoadPointCloud.tsx:78-112
const initThreeJS = () => {
    if (!threeContainerRef.current) return;

    // 1. 创建透视相机
    cameraRef.current = new THREE.PerspectiveCamera(
        30,              // FOV
        width / height,  // aspect
        0.0001,          // near
        1000             // far
    );
    cameraRef.current.position.z = 5;

    // 2. 创建 WebGL 渲染器
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.setSize(width, height);
    threeContainerRef.current.appendChild(rendererRef.current.domElement);

    // 3. 添加光照
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.current.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    sceneRef.current.add(directionalLight);

    // 4. 创建轨道控制器
    controlsRef.current = new OrbitControls(
        cameraRef.current,
        rendererRef.current.domElement
    );
    controlsRef.current.screenSpacePanning = true;
    controlsRef.current.addEventListener("change", animate);
};
```

### 3.3 点云加载器

项目使用 three/examples/jsm 提供的加载器：

```typescript
// LoadPointCloud.tsx:7-9
import { PCDLoader } from "three/examples/jsm/loaders/PCDLoader";
import { XYZLoader } from "three/examples/jsm/loaders/XYZLoader";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
```

| 格式 | 加载器 | 处理方式 |
|------|--------|----------|
| PCD | PCDLoader | 直接加载为 THREE.Points |
| XYZ | XYZLoader | 加载后创建 Points + PointsMaterial |
| PLY | PLYLoader | 加载后 computeVertexNormals 再创建 Points |
| TXT | PCDLoader | 兼容 TXT 和 PCD 格式 |

### 3.4 点云处理流程

```typescript
// LoadPointCloud.tsx:197-289
const processPoints = (points: THREE.Points, arrayBufferByteLength: number) => {
    // 1. 移除旧点云
    if (pointCloudRef.current) {
        sceneRef.current.remove(pointCloudRef.current);
    }

    // 2. 提取有效位置数据
    const allPositions = pointCloudRef.current.geometry.attributes.position.array as Float32Array;
    const positions = allPositions.filter((v) => !isNaN(v));

    // 3. 重新设置位置属性
    pointCloudRef.current.geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(positions), 3)
    );

    // 4. 计算包围盒并调整相机
    const boundingBox = new THREE.Box3();
    const center = new THREE.Vector3();
    boundingBox.setFromBufferAttribute(new THREE.BufferAttribute(positions, 3));
    boundingBox.getCenter(center);
    
    // 相机对准点云中心
    cameraRef.current.position.set(center.x, center.y, center.z + maxDim * 2);
    cameraRef.current.lookAt(center);
    controlsRef.current.target.copy(center);

    // 5. 基于高度的颜色映射
    const colors = new Float32Array(positions.length);
    for (let i = 0; i < positions.length; i += 3) {
        const z = positions[i + 2];
        const normalizedZ = rangeZ === 0 ? 0 : (z - minZ) / (maxZ - minZ);
        const color = getColorFromHeight(normalizedZ);
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
    }
    pointCloudRef.current.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // 6. 添加到场景并渲染
    sceneRef.current.add(pointCloudRef.current);
    animate();
};
```

### 3.5 基于高度的颜色映射

```typescript
// LoadPointCloud.tsx:148-152
const getColorFromHeight = (normalizedZ: number): THREE.Color => {
    const color = new THREE.Color();
    // HSL: 0.6 (红色) -> 0 (青色) 映射高度
    color.setHSL((1.0 - normalizedZ) * 0.6, 1.0, 0.5);
    return color;
};
```

### 3.6 GUI 控制面板

使用 lil-gui 创建实时调节面板：

```typescript
// LoadPointCloud.tsx:154-195
const createGUI = () => {
    pcdGUI.current = new GUI();
    
    // 点大小控制
    pointFolder.add(settings, "size", POINT_SIZE_MIN, POINT_SIZE_MAX)
        .name("Size")
        .onChange((value) => {
            (pointCloudRef.current.material as THREE.PointsMaterial).size = value;
            animate();
        });
    
    // 颜色控制
    pointFolder.addColor(materialParams, "color")
        .name("Color")
        .onChange((value) => {
            (pointCloudRef.current.material as THREE.PointsMaterial).color.setHex(
                parseInt(value.replace("#", "0x"))
            );
            animate();
        });
};
```

### 3.7 渲染循环

```typescript
// LoadPointCloud.tsx:131-146
const animate = () => {
    if (!rendererRef.current || !cameraRef.current || !threeContainerRef.current) return;

    // 更新相机宽高比
    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    
    // 重新设置渲染器尺寸
    rendererRef.current.setSize(width, height);
    
    // 执行渲染
    rendererRef.current.render(sceneRef.current, cameraRef.current);
};
```

---

## 4. mapbox-gl ^3.9.4 集成原理

### 4.1 核心组件架构

mapbox-gl 通过 react-map-gl ^7.1.9 封装，在 `LoadGeoJSON.tsx` 中使用：

```
LoadGeoJSON 组件
    │
    └── Map (react-map-gl)
            │
            ├── mapboxAccessToken (环境变量配置)
            │
            ├── viewState (经纬度、缩放、俯仰、方位)
            │       ├── longitude
            │       ├── latitude
            │       ├── zoom
            │       ├── pitch
            │       └── bearing
            │
            ├── Source (GeoJSON 数据源)
            │       │
            │       └── Layer (渲染图层)
            │               ├── Point → CircleLayer
            │               ├── Polygon → FillLayer
            │               └── LineString → LineLayer
            │
            ├── Marker (点标记)
            │
            ├── Popup (信息弹窗)
            │
            └── Controls (导航、全屏、比例尺、定位)
```

### 4.2 初始化与 GeoJSON 加载

```typescript
// LoadGeoJSON.tsx:52-62
const [viewState, setViewState] = useState({
    longitude: -100,
    latitude: 40,
    zoom: 3.5,
    pitch: 0,
    bearing: 0,
});

// LoadGeoJSON.tsx:68-116
const loadGeoJSON = async () => {
    try {
        // 1. 读取文件内容
        const text = await file.file.text();
        const data = JSON.parse(text);
        setGeoJSONData(data);

        // 2. 计算数据边界并自动定位
        if (data.features && data.features.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            
            data.features.forEach((feature: any) => {
                if (feature.geometry.type === "Point") {
                    bounds.extend(feature.geometry.coordinates);
                } else if (feature.geometry.type === "Polygon") {
                    feature.geometry.coordinates[0].forEach((coord: [number, number]) => {
                        bounds.extend(coord);
                    });
                } else if (feature.geometry.type === "LineString") {
                    feature.geometry.coordinates.forEach((coord: [number, number]) => {
                        bounds.extend(coord);
                    });
                }
            });

            // 3. 设置视图为中心点
            if (!bounds.isEmpty()) {
                const { lng: longitude, lat: latitude } = bounds.getCenter();
                setViewState((prev) => ({
                    ...prev,
                    longitude,
                    latitude,
                    zoom: 8,
                }));
            }
        }
    } catch (error) {
        // 错误处理
    }
};
```

### 4.3 Map 组件配置

```typescript
// LoadGeoJSON.tsx:118-125
<Map
    {...viewState}
    onMove={(evt) => setViewState(evt.viewState)}
    style={{ width: "100%", height: "100%" }}
    mapStyle="mapbox://styles/mapbox/streets-v12"
    mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
>
```

### 4.4 GeoJSON 数据渲染

```typescript
// LoadGeoJSON.tsx:130-154
<Source id="geojson-source" type="geojson" data={geoJSONData}>
    {geoJSONData?.features.map((feature, index) => {
        if (feature.geometry.type === "Point") {
            // 点要素 → Marker
            return (
                <Marker
                    key={`marker-${index}`}
                    anchor="bottom"
                    longitude={feature.geometry.coordinates[0]}
                    latitude={feature.geometry.coordinates[1]}
                    onClick={(e) => {
                        e.originalEvent.stopPropagation();
                        setSelectedFeature(feature);
                    }}
                />
            );
        } else {
            // 其他要素 → Layer
            return (
                <Layer
                    key={`layer-${index}`}
                    {...getLayerStyle(feature.geometry.type)}
                />
            );
        }
    })}
</Source>
```

### 4.5 图层样式配置

```typescript
// GeoLayerStyle.tsx:3-44
export const getLayerStyle = (geometryType: string): LayerProps => {
    switch (geometryType) {
        case "Point":
            return {
                id: "point-layer",
                type: "circle",
                paint: {
                    "circle-radius": 6,
                    "circle-color": "#007cbf",
                    "circle-stroke-width": 1,
                    "circle-stroke-color": "#fff",
                },
            };
        case "Polygon":
            return {
                id: "polygon-layer",
                type: "fill",
                paint: {
                    "fill-color": "#007cbf",
                    "fill-opacity": 0.4,
                    "fill-outline-color": "#fff",
                },
            };
        case "LineString":
            return {
                id: "line-layer",
                type: "line",
                paint: {
                    "line-color": "#007cbf",
                    "line-width": 2,
                },
            };
    }
};
```

### 4.6 信息弹窗

```typescript
// LoadGeoJSON.tsx:155-180
{selectedFeature && (
    <Popup
        anchor="top"
        longitude={Number(selectedFeature.geometry.coordinates[0])}
        latitude={Number(selectedFeature.geometry.coordinates[1])}
        onClose={() => setSelectedFeature(null)}
    >
        <div>
            <h3>Feature Info</h3>
            <p>Coordinates: [{selectedFeature.geometry.coordinates.join(", ")}]</p>
            {selectedFeature.properties && (
                <p>
                    {Object.entries(selectedFeature.properties).map(([key, value]) => (
                        <span key={key}>{key}: {String(value)} <br /></span>
                    ))}
                </p>
            )}
        </div>
    </Popup>
)}
```

---

## 5. 文件类型路由

```typescript
// FileVisualizer.tsx:6-17
const FileVisualizer = ({ file, onLog }: FileVisualizerProps) => {
    switch (file.type) {
        case FileType.POINT_CLOUD:
            return <LoadPointCloud file={file} onLog={onLog} />;
        case FileType.GIS:
            return <LoadGeoJSON file={file} onLog={onLog} />;
        default:
            return <ReadmeCard />;
    }
};
```

### 5.1 文件类型枚举

```typescript
// types/index.ts:17-21
export enum FileType {
    POINT_CLOUD = "point-cloud",  // PCD, XYZ, TXT, PLY
    GIS = "gis",                  // GeoJSON
    UNKNOWN = "unknown",
}
```

---

## 6. 类型定义

```typescript
// types/index.ts
export interface UploadedFile {
    id: string;
    file: File;
    type: FileType;
    meta: FileMeta;
    layers: any[];
    file_bytes: number;
}

export interface GeoFeature {
    type: string;
    geometry: {
        type: string;
        coordinates: Array<number>;
    };
    properties: Record<string, any>;
}

export interface GeoJSONData {
    type: string;
    features: Array<GeoFeature>;
}

export enum PCDFormat {
    TXT = "txt",
    PCD = "pcd",
    XYZ = "xyz",
    PLY = "ply",
}
```

---

## 7. Three.js 与 mapbox-gl 对比

| 维度 | Three.js | mapbox-gl |
|------|----------|-----------|
| **用途** | 通用 3D 点云渲染 | 地理空间数据可视化 |
| **版本** | ^0.172.0 | ^3.9.4 |
| **封装** | 原生 API | react-map-gl ^7.1.9 |
| **数据格式** | PCD, XYZ, PLY, TXT | GeoJSON |
| **渲染方式** | WebGL Points | Canvas 2D + WebGL |
| **交互** | OrbitControls | 内置地图交互 |
| **投影** | 无 (笛卡尔坐标) | 墨卡托投影 |
| **光照** | 支持 | 不适用 |

---

## 8. 核心代码逻辑

### 8.1 文件上传与类型识别

文件通过拖拽上传后，根据扩展名判断类型：

```typescript
// 根据文件扩展名判断类型
const getFileType = (fileName: string): FileType => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['pcd', 'xyz', 'txt', 'ply'].includes(ext)) {
        return FileType.POINT_CLOUD;
    }
    if (ext === 'json' || ext === 'geojson') {
        return FileType.GIS;
    }
    return FileType.UNKNOWN;
};
```

### 8.2 相机自动定位

点云和 GeoJSON 都支持自动定位到数据范围：

**点云 (Three.js):**
```typescript
// 计算包围盒中心，相机对准
const boundingBox = new THREE.Box3();
boundingBox.setFromBufferAttribute(new THREE.BufferAttribute(positions, 3));
boundingBox.getCenter(center);
cameraRef.current.position.set(center.x, center.y, center.z + maxDim * 2);
```

**GeoJSON (mapbox-gl):**
```typescript
// 使用 mapboxgl.LngLatBounds 计算边界
const bounds = new mapboxgl.LngLatBounds();
data.features.forEach((feature) => {
    bounds.extend(feature.geometry.coordinates);
});
const { lng, lat } = bounds.getCenter();
```

---

## 9. 依赖版本说明

```json
{
    "three": "^0.172.0",
    "mapbox-gl": "^3.9.4",
    "react-map-gl": "^7.1.9",
    "@react-three/fiber": "^8.17.14",
    "@react-three/drei": "^9.121.4"
}
```

### 9.1 Three.js 0.172.0 特性

- BufferGeometry 性能优化
- WebGLRenderer 改进
- PointsMaterial vertexColors 支持

### 9.2 mapbox-gl 3.9.4 特性

- GeoJSON Source 增强
- 更好的图层样式支持
- Popup 和 Marker 改进

---

## 10. 从 pcl.js 迁移到 Three.js

项目最初使用 **pcl.js** 进行点云可视化，但在 Vercel 部署时遇到错误：

```
Uncaught (in promise) TypeError: __PCLCore__[n.name] is not a constructor
```

**迁移原因：**
- pcl.js 依赖原生 WebAssembly，Vercel 环境兼容性问题
- Three.js 纯 JavaScript 实现，兼容性更好

**迁移收益：**
- 更好的跨平台支持
- 更轻量的依赖
- 统一的 3D 渲染方案

---

## 11. 总结

### 11.1 架构亮点

1. **模块化设计**: FileVisualizer 统一入口，根据文件类型路由到不同渲染器
2. **自动适配**: 自动根据数据范围调整相机位置
3. **实时控制**: GUI 面板支持点大小、颜色等实时调节
4. **清晰分工**: Three.js 负责点云，mapbox-gl 负责地理数据

### 11.2 技术集成要点

| 功能 | 实现方式 |
|------|----------|
| 点云渲染 | THREE.Points + BufferGeometry + PointsMaterial |
| 颜色映射 | 基于 Z 轴高度的 HSL 颜色渐变 |
| 地图底图 | react-map-gl + mapbox-gl |
| GeoJSON 渲染 | Source + Layer 组件化方式 |
| 交互控制 | OrbitControls (Three.js) / 内置控件 (mapbox) |
| 自动定位 | Box3 包围盒 (Three.js) / LngLatBounds (mapbox) |

---

## 参考资料

- [Three.js 官方文档](https://threejs.org/docs/)
- [mapbox-gl JS 文档](https://docs.mapbox.com/mapbox-gl-js/api/)
- [react-map-gl 文档](https://visgl.github.io/react-map-gl/)
- [Three.js PCDLoader](https://threejs.org/examples/#misc_loaders_pcd)
