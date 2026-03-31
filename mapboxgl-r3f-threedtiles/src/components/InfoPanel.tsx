import { useStore } from '../store/useStore';
import { X, Loader2, Layers, MapPin } from 'lucide-react';

export function InfoPanel() {
  const { 
    isInfoPanelOpen, 
    setInfoPanelOpen, 
    tileStats, 
    selectedTileset,
    viewState,
    isLoading 
  } = useStore();

  if (!isInfoPanelOpen) return null;

  const percentage = Math.min(100, (tileStats.percentageLoaded || 0) * 100);
  const progressWidth = `${percentage}%`;
  const progressText = `${Math.round(percentage)}%`;

  return (
    <div className="fixed top-20 right-4 z-40 w-64 glass-panel p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">信息面板</h3>
        <button 
          onClick={() => setInfoPanelOpen(false)}
          className="p-1 hover:bg-slate-700 rounded cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400">数据源</span>
          <span className="ml-auto font-mono text-xs">{selectedTileset.name}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Layers className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400">类型</span>
          <span className="ml-auto font-mono text-xs">{selectedTileset.type}</span>
        </div>

        <div className="border-t border-slate-700/50 pt-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3">加载状态</h4>
          
          <div className="flex items-center gap-2 mb-2">
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-green-500" />
            )}
            <span className="text-sm">{isLoading ? '加载中...' : '就绪'}</span>
          </div>

          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: progressWidth }}
            />
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            {progressText}
          </div>
        </div>

        <div className="border-t border-slate-700/50 pt-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3">瓦片统计</h4>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-slate-800/50 rounded p-2">
              <div className="text-xs text-slate-500">已加载</div>
              <div className="font-mono text-lg">{tileStats.numTilesLoaded}</div>
            </div>
            <div className="bg-slate-800/50 rounded p-2">
              <div className="text-xs text-slate-500">已渲染</div>
              <div className="font-mono text-lg">{tileStats.numTilesRendered}</div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700/50 pt-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3">相机状态</h4>
          
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">经度</span>
              <span>{viewState.longitude.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">纬度</span>
              <span>{viewState.latitude.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">缩放</span>
              <span>{viewState.zoom.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">俯仰</span>
              <span>{viewState.pitch.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">方位</span>
              <span>{viewState.bearing.toFixed(1)}°</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
