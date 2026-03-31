import type { TilesetInfo } from '../types';

export const TILESETS: TilesetInfo[] = [
  {
    id: 'ayutthaya',
    name: 'Ayutthaya 古遗址',
    url: 'https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json',
    type: 'glTF',
    center: [100.5469, 14.3562, 0],
    description: '泰国大城府历史遗址的 3D 重建模型'
  },
  {
    id: 'christchurch',
    name: 'Christ Church',
    url: 'https://storage.googleapis.com/ogc-3d-tiles/christChurch2/tileset.json',
    type: 'B3DM',
    center: [-122.4194, 37.7749, 0],
    description: '使用摄影测量法创建的高精度教堂模型'
  },
  {
    id: 'drachenwald',
    name: 'Drachenwald Castle',
    url: 'https://storage.googleapis.com/ogc-3d-tiles/drachenwald/tileset.json',
    type: 'glTF',
    center: [8.8, 50.1, 0],
    description: '中世纪城堡的 3D 重建，包含完整的城墙和塔楼'
  }
];

export const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11';

export const DEFAULT_VIEW_STATE = {
  longitude: 100.5469,
  latitude: 14.3562,
  zoom: 15,
  pitch: 60,
  bearing: 0
};

export const COLOR_SCHEMES = [
  { id: 'elevation', name: '高程着色', gradient: ['#0000ff', '#00ffff', '#00ff00', '#ffff00', '#ff0000'] },
  { id: 'intensity', name: '强度着色', gradient: ['#000000', '#ffffff'] },
  { id: 'classification', name: '分类着色', gradient: ['#808080', '#8b4513', '#90ee90', '#228b22', '#006400'] },
  { id: 'rgb', name: 'RGB 颜色', gradient: ['#ff0000', '#00ff00', '#0000ff'] }
];

export const LOADING_STRATEGIES = [
  { id: 'INCREMENTAL', name: '渐进式', description: '逐步加载中间 LOD 级别' },
  { id: 'IMMEDIATE', name: '立即式', description: '跳过中间 LOD 直接加载目标级别' },
  { id: 'PERLEVEL', name: '逐级式', description: '等当前级别全部加载完再加载下一级' }
];
