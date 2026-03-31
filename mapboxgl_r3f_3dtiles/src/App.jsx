import React, { useState, useCallback, useRef } from 'react';
import Map, { NavigationControl } from 'react-map-gl';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import TilesRenderer from './components/TilesRenderer';
import InfoPanel from './components/InfoPanel';
import './App.css';

// WGS84 椭球体参数
const WGS84_A = 6378137.0; // 长半轴 (米)
const WGS84_F = 1 / 298.257223563; // 扁率
const WGS84_E2 = 2 * WGS84_F - WGS84_F * WGS84_F; // 第一偏心率平方

/**
 * 将 ECEF 坐标转换为 WGS84 经纬度
 * @param {number} x - ECEF X 坐标 (米)
 * @param {number} y - ECEF Y 坐标 (米)
 * @param {number} z - ECEF Z 坐标 (米)
 * @returns {{ longitude: number, latitude: number, height: number }}
 */
function ecefToLLA(x, y, z) {
  // 计算经度 (弧度) -> 转换为度
  const lon = Math.atan2(y, x) * (180 / Math.PI);

  // 计算纬度的初始估计值
  const p = Math.sqrt(x * x + y * y);
  let lat = Math.atan2(z, p * (1 - WGS84_E2));

  // 迭代计算精确纬度 (Bowring's method, 3次迭代足够)
  for (let i = 0; i < 3; i++) {
    const sinLat = Math.sin(lat);
    const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinLat * sinLat);
    lat = Math.atan2(z + WGS84_E2 * N * sinLat, p);
  }

  // 计算高度
  const sinLat = Math.sin(lat);
  const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinLat * sinLat);
  const height = p / Math.cos(lat) - N;

  // 纬度转换为度
  const latDeg = lat * (180 / Math.PI);

  return {
    longitude: lon,
    latitude: latDeg,
    height
  };
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN';
const DEFAULT_TILESET_URL = 'https://raw.githubusercontent.com/CesiumGS/3d-tiles-standards/master/data/SampleData/Cesium3DTileset/tileset.json';

function App() {
  const [viewState, setViewState] = useState({
    longitude: -75.59777,
    latitude: 40.03883,
    zoom: 10,
    pitch: 45,
    bearing: 0
  });
  const [tilesetUrl, setTilesetUrl] = useState('');
  const [inputUrl, setInputUrl] = useState(DEFAULT_TILESET_URL);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [stats, setStats] = useState({
    tilesProcessed: 0,
    tilesLoaded: 0,
    tilesInFrustum: 0
  });
  const mapRef = useRef(null);
  const tilesRendererRef = useRef(null);

  const handleViewStateChange = useCallback(({ viewState: newViewState }) => {
    setViewState(newViewState);
  }, []);

  const handleTilesLoad = useCallback(() => {
    setTilesLoaded(true);
  }, []);

  const handleStatsUpdate = useCallback((newStats) => {
    setStats(newStats);
  }, []);

  const handleLoadTileset = useCallback(() => {
    if (!inputUrl.trim()) {
      alert('Please enter a tileset URL');
      return;
    }
    setTilesLoaded(false);
    setTilesetUrl(inputUrl.trim());
  }, [inputUrl]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleLoadTileset();
    }
  }, [handleLoadTileset]);

  const handleTilesetCreated = useCallback((renderer) => {
    tilesRendererRef.current = renderer;
  }, []);

  const handleViewOnMap = useCallback(() => {
    if (tilesRendererRef.current) {
      const renderer = tilesRendererRef.current;
      const box = new THREE.Box3();
      if (renderer.getBoundingBox(box)) {
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);
        
        // 使用精确的 ECEF 到 WGS84 经纬度转换
        const { longitude: centerLon, latitude: centerLat } = ecefToLLA(center.x, center.y, center.z);
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const zoom = Math.max(1, 14 - Math.log2(maxDim / 100));

        setViewState(prev => ({
          ...prev,
          longitude: centerLon,
          latitude: centerLat,
          zoom: Math.min(zoom, 18),
          pitch: 45,
          bearing: 0
        }));
      }
    }
  }, []);

  return (
    <div className="app-container">
      <div className="map-container">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={handleViewStateChange}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
          scrollZoom={true}
          touchZoomRotate={true}
          dragRotate={true}
          dragPan={true}
          keyboard={true}
          doubleClickZoom={true}
          touchPitch={true}
        >
          <NavigationControl position="top-right" />
        </Map>
      </div>

      <div className="url-input-panel">
        <h3>3D Tiles Loader</h3>
        <div className="input-group">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter tileset JSON URL..."
            className="url-input"
          />
          <button onClick={handleLoadTileset} className="load-button">
            Load Tileset
          </button>
        </div>
        {!tilesLoaded && tilesetUrl && (
          <div className="loading-text">Loading tileset...</div>
        )}
      </div>

      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 0, 0], fov: 60 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          {tilesetUrl && (
            <TilesRenderer
              key={tilesetUrl}
              url={tilesetUrl}
              onTilesLoad={handleTilesLoad}
              onStatsUpdate={handleStatsUpdate}
              onTilesetCreated={handleTilesetCreated}
            />
          )}
        </Canvas>
      </div>

      <InfoPanel
        tilesLoaded={tilesLoaded}
        stats={stats}
        tilesetUrl={tilesetUrl}
        onViewOnMap={tilesLoaded ? handleViewOnMap : null}
      />

      <div className="controls-hint">
        <p>Enter a tileset URL and click Load | Scroll to zoom | Drag to pan</p>
      </div>
    </div>
  );
}

export default App;
