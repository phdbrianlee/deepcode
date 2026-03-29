import React, { useState, useCallback, useRef } from 'react';
import Map, { NavigationControl } from 'react-map-gl';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import TilesRenderer from './components/TilesRenderer';
import InfoPanel from './components/InfoPanel';
import './App.css';

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
        
        const centerLon = center.x / 111319.9;
        const centerLat = center.z / 111319.9;
        
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
