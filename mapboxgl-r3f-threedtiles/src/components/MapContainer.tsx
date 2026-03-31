import { useCallback, useEffect, useRef, useState } from 'react';
import { Map, NavigationControl } from 'react-map-gl';
import { AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { MAPBOX_STYLE } from '../constants/tilesets';
import { TilesOverlay } from './TilesOverlay';
import type { MapRef } from 'react-map-gl';

function TokenWarning() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-[100]">
      <div className="glass-panel p-6 max-w-md text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Mapbox Token 未配置</h2>
        <p className="text-sm text-slate-400 mb-4">
          请在项目根目录创建 <code className="bg-slate-800 px-2 py-1 rounded">.env</code> 文件，
          并添加您的 Mapbox Access Token：
        </p>
        <code className="block bg-slate-800 p-3 rounded text-sm font-mono text-left">
          VITE_MAPBOX_TOKEN=your_token_here
        </code>
        <p className="text-xs text-slate-500 mt-4">
          获取 Token: <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">https://account.mapbox.com/access-tokens/</a>
        </p>
      </div>
    </div>
  );
}

export function MapContainer() {
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;
  
  const { 
    viewState, 
    setViewState, 
    selectedTileset
  } = useStore();
  
  const mapRef = useRef<MapRef>(null);
  const [hasToken, setHasToken] = useState(!!MAPBOX_TOKEN);

  const handleMove = useCallback((evt: { viewState: typeof viewState }) => {
    setViewState(evt.viewState);
  }, [setViewState]);

  useEffect(() => {
    setHasToken(!!MAPBOX_TOKEN);
  }, [MAPBOX_TOKEN]);

  useEffect(() => {
    if (mapRef.current && selectedTileset) {
      const [lng, lat] = selectedTileset.center;
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 15,
        pitch: 60,
        bearing: 0,
        duration: 2000
      });
    }
  }, [selectedTileset]);

  if (!hasToken) {
    return <TokenWarning />;
  }

  return (
    <div className="absolute inset-0">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleMove}
        mapStyle={MAPBOX_STYLE}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />
        
        <TilesOverlay />
      </Map>
    </div>
  );
}
