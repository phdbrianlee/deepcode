import { useStore } from '../store/useStore';
import { TILESETS } from '../constants/tilesets';
import { Layers, ChevronDown, Info } from 'lucide-react';

export function Navbar() {
  const { selectedTileset, setSelectedTileset, isInfoPanelOpen, setInfoPanelOpen } = useStore();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 px-4 flex items-center justify-between glass-panel border-t-0 border-l-0 border-r-0 rounded-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
            <Layers className="w-5 h-5 text-green-500" />
          </div>
          <span className="font-semibold text-lg">3D Tiles Viewer</span>
        </div>

        <div className="relative group">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer">
            <span className="text-sm">{selectedTileset.name}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
          
          <div className="absolute top-full left-0 mt-1 w-64 py-1 bg-slate-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            {TILESETS.map((tileset) => (
              <button
                key={tileset.id}
                onClick={() => setSelectedTileset(tileset)}
                className={`w-full px-3 py-2 text-left hover:bg-slate-700 transition-colors cursor-pointer ${
                  selectedTileset.id === tileset.id ? 'bg-slate-700/50' : ''
                }`}
              >
                <div className="text-sm font-medium">{tileset.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{tileset.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setInfoPanelOpen(!isInfoPanelOpen)}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            isInfoPanelOpen ? 'bg-green-500/20 text-green-500' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
          }`}
        >
          <Info className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
