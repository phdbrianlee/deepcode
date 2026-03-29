import React, { useState, useCallback, useRef, useEffect } from 'react';
import Map, { NavigationControl } from 'react-map-gl';
import { Canvas } from '@react-three/fiber';
import TilesRenderer from './components/TilesRenderer';
import InfoPanel from './components/InfoPanel';
import './App.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN';
const TILESET_URL = 'https://raw.githubusercontent.com/CesiumGS/3d-tiles-standards/master/data/SampleData/Cesium3DTileset/tileset.json';

function App() {
  const [viewState, setViewState] = useState({
    longitude: -75.59777,
    latitude: 40.03883,
    zoom: 10,
    pitch: 45,
    bearing: 0
  });
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [stats, setStats] = useState({
    tilesProcessed: 0,
    tilesLoaded: 0,
    tilesInFrustum: 0
  });
  const mapRef = useRef(null);

  const handleViewStateChange = useCallback(({ viewState: newViewState }) => {
    setViewState(newViewState);
  }, []);

  const handleTilesLoad = useCallback(() => {
    setTilesLoaded(true);
  }, []);

  const handleStatsUpdate = useCallback((newStats) => {
    setStats(newStats);
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
        >
          <NavigationControl position="top-right" />
        </Map>
      </div>

      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 0, 0], fov: 60 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <TilesRenderer
            url={TILESET_URL}
            camera={null}
            onTilesLoad={handleTilesLoad}
            onStatsUpdate={handleStatsUpdate}
          />
        </Canvas>
      </div>

      <InfoPanel
        tilesLoaded={tilesLoaded}
        stats={stats}
        tilesetUrl={TILESET_URL}
      />

      <div className="controls-hint">
        <p>Use mouse to navigate the map | Scroll to zoom</p>
      </div>
    </div>
  );
}

export default App;
