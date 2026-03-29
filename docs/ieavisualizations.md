# IEA Visualizations 项目分析文档

## 项目概述

IEA Visualizations 是一个基于 React 的能源数据可视化项目集合，使用 WebGL 和 Mapbox 技术实现交互式地图可视化。项目托管于 GitHub (wonjiky/ieavisualisations)。

### 技术栈

- **前端框架**: React
- **地图库**: react-map-gl, Mapbox GL, Deck.gl
- **图表库**: Highcharts
- **数据解析**: PapaParse (CSV 解析)
- **HTTP 客户端**: Axios
- **地图类型**: 自定义 Mapbox 样式

---

## 1. Weather Grid WebGL 可视化

### 文件位置
`src/projects/weather-for-energy/components/Weather_grid_webgl.js`
`src/projects/weather-for-energy/components/Map_grid_webgl.js`

### 基本原理

使用 **Deck.gl 的 ScreenGridLayer** 实现网格热力图效果：

1. **数据来源**: CSV 文件 (`weather/grid/hdd.csv`)，格式为 `[经度, 纬度, 权重值]`
2. **颜色映射**: YlOrRd 6 色渐变调色板 (黄→橙→红)
3. **GPU 聚合**: `gpuAggregation: true` + `aggregation: 'SUM'`
4. **渲染参数**:
   - `cellSizePixels: 20` (网格单元大小)
   - `opacity: 0.8`

### 数据接口

```javascript
axios.get(`${props.baseURL}weather/grid/hdd.csv`)
```

CSV 数据结构：第一行/列为坐标轴，数据矩阵为 HDD (Heating Degree Days) 供热度日数。

### 实现效果

- 交互式世界地图 (Mapbox 底图)
- 网格化数值聚合展示
- GPU 加速渲染，支持大规模数据
- 支持缩放、平移交互

---

## 2. Weather Choropleth 可视化

### 文件位置
`src/projects/weather-for-energy/components/Weather.js`

### 基本原理

基于 Mapbox GL 的 Choropleth (分级填色图) 实现：

1. **两种视图模式**:
   - **Grid 模式**: 叠加栅格底图 (`grid-tiles` image source)
   - **Territory 模式**: 国家/地区填色图
2. **颜色插值**: 使用指数插值 `["interpolate", ["exponential", 0.5], ...]`
3. **动态样式**: 根据缩放级别调整圆点半径、文字大小等

### 数据接口

- 栅格底图: 通过 `gridURL` 动态加载 PNG
- 国家数据: 通过 `data` prop 传入

### 实现效果

- 国家/地区分级填色
- 中心点标记 (圆点 + 标签)
- 鼠标悬停弹出信息框
- 点击选择国家
- 争议区域过滤

---

## 3. Gas Trade Flow 可视化

### 文件位置
`src/projects/gas-trade-flow/components/GtfVector.js`
`src/projects/gas-trade-flow/components/GtfAnimatedFlowMap.js`

### 基本原理

#### 3.1 Vector 模式 (GtfVector.js)

基于 Mapbox GL 的国家贸易流向可视化：

1. **数据格式**: CSV (`gtf/flowdata.csv`)
2. **边境点标记**: Canvas 动态绘制扩散动画
3. **国家填色**: 根据贸易数据着色

#### 3.2 FlowMap 模式 (GtfAnimatedFlowMap.js)

基于 Deck.gl + FlowMapLayer 的流式可视化：

1. **动画渲染**: `requestAnimationFrame` 驱动
2. **FlowMapLayer**: `@flowmap.gl/core` 实现
3. **交互**: 支持 Flow/Location/LocationArea 高亮

### 数据接口

```javascript
axios.get(`${baseURL}gtf/flowdata.csv`)
```

### 实现效果

- 动态扩散动画 (边境点)
- 贸易流向弧线
- 国家颜色编码
- 鼠标悬停/点击交互
- 流量强度可视化

---

## 4. ETP Ownership Bubble 可视化

### 文件位置
`src/projects/etp-ownership-bubble/components/Bubble.js`

### 基本原理

基于 Highcharts 的 Bubble Chart (气泡图)：

- **X 轴**: 人均 GDP (USD per capita)
- **Y 轴**: 每户空调数量 (Units per household)
- **气泡大小**: 反映空调持有量
- **颜色**: 表示热指数 (Cooling Degree Days)

### 数据接口

使用静态 JSON 文件:
- `CDD.json` - 制冷度日数
- `income.json` - 人均收入
- `Nbperhh.json` - 每户空调数量

### 实现效果

- 三维数据可视化 (X, Y, 气泡大小)
- 图例显示气泡尺寸范围
- 悬停显示国家名称

---

## 5. Heating/Cooling Demands 可视化

### 文件位置
`src/projects/heating-cooling-demands/components/CDD.js`

### 基本原理

基于 Mapbox GL 的双层栅格叠加可视化：

1. **主栅格层 (Main)**: 基础热需求地图
2. **叠加栅格层 (Overlay)**: 可选附加信息层
3. **ETP 区域边界**: Vector Tile 叠加

### 视图模式

- **Service 模式**: 显示栅格地图
- **Territory 模式**: 显示国家填色图

### 数据接口

- 栅格底图: PNG 格式动态加载
- Vector Tile: ETP 区域边界数据

### 实现效果

- 栅格渐变色彩显示
- 国家/区域边界叠加
- 区域快速导航 (点击跳转)
- 双栅格叠加对比

---

## 6. COVID Impact on Electricity 可视化

### 文件位置
`src/projects/covid-impact-electricty/components/Electricity.js`

### 基本原理

基于 Highcharts 的时间序列 + 堆叠面积图：

1. **Line Chart**: 年度总发电量对比
   - 2020 年实际值
   - 2015-19 平均范围 (arearange)
2. **Area Chart**: 能源结构堆叠百分比
   - Nuclear, Coal, Natural gas, Hydro, Wind, Solar 等

### 数据接口

内嵌静态数据数组

### 实现效果

- 疫情期间发电量变化可视化
- 与历史平均值对比
- 锁定时间标记 (橙色虚线)
- 堆叠面积图展示能源结构变化

---

## 7. CCUS Projects 可视化

### 文件位置
`src/projects/ccus-combo-map/components/Map.js`

### 基本原理

基于 Mapbox GL 的点标记可视化：

1. **Circle Layer**: 项目位置标记
2. **Canvas 动画**: 动态扩散效果
3. **颜色编码**: 
   - 蓝色: Industry/Fuel transformation
   - 青绿色: Power

### 数据接口

```javascript
// projects.json 包含项目列表
```

### 实现效果

- 项目位置标记
- 动态扩散动画
- 颜色区分行业类型
- 点击放大到项目位置

---

## 8. CCUS Region Maps

### 文件位置

- `src/projects/ccus-region-maps/europe/components/CCUS_Europe.js`
- `src/projects/ccus-region-maps/us/components/CCUS_US.js`
- `src/projects/ccus-region-maps/china/components/CCUS_China.js`

### 基本原理

区域级 CCUS (Carbon Capture, Utilization and Storage) 可视化：

- 特定区域的详细项目分布
- 各区域自定义底图样式

---

## 组件架构总结

| 项目 | 地图技术 | 渲染技术 | 数据类型 |
|------|----------|----------|----------|
| Weather Grid | DeckGL | ScreenGridLayer | CSV (网格) |
| Weather Choropleth | Mapbox GL | Vector Tile | Image + GeoJSON |
| Gas Trade Flow | DeckGL | FlowMapLayer | CSV (流向) |
| ETP Bubble | - | Highcharts | JSON (统计) |
| Heating/Cooling | Mapbox GL | Raster + Vector | PNG + Tile |
| COVID Electricity | - | Highcharts | 内嵌数据 |
| CCUS Projects | Mapbox GL | Circle + Canvas | GeoJSON |
| CCUS Regions | Mapbox GL | 自定义 | 多源 |

---

## 通用技术模式

### 1. Mapbox GL 集成模式

```javascript
const config = {
  map: "oecd",
  style: "mapbox://styles/iea/...",
  center: [0, 30],
  minZoom: 1.5,
  maxZoom: 5.5,
};
const { map, mapContainerRef, popUp } = useMap(config);
```

### 2. DeckGL 集成模式

```javascript
<DeckGL initialViewState={viewState} layers={layers} controller={true}>
  <MapGL viewState={viewState} mapboxApiAccessToken={...} />
</DeckGL>
```

### 3. Canvas 动画模式

```javascript
render() {
  let t = (performance.now() % duration) / duration;
  // 绘制动画帧
  this.data = ctx.getImageData(...).data;
  map.triggerRepaint();
  return true;
}
```

### 4. 颜色插值模式

```javascript
map.setPaintProperty("layer", "fill-color", [
  "interpolate",
  ["exponential", 0.5],
  ["zoom"],
  2.3, color1,
  3, "#fff"
]);
```

---

## 环境变量

| 变量 | 说明 |
|------|------|
| `REACT_APP_MAPBOX_KEY` | Mapbox API 访问令牌 |
| `REACT_APP_DEV` | 开发环境 API 基础 URL |
| `REACT_APP_PROD` | 生产环境 API 基础 URL |
