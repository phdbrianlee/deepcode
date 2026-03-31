import { useStore } from '../store/useStore';
import { COLOR_SCHEMES } from '../constants/tilesets';

export function LayerLegend() {
  const { controlSettings, isControlPanelOpen } = useStore();

  if (!isControlPanelOpen) return null;

  const currentScheme = COLOR_SCHEMES.find((c) => c.id === controlSettings.colorScheme);

  if (!currentScheme) return null;

  return (
    <div className="fixed bottom-4 left-4 z-30 ml-[21rem]">
      <div className="glass-panel p-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">
          {currentScheme.name}
        </h4>
        <div className="flex items-stretch h-3 rounded overflow-hidden">
          {currentScheme.gradient.map((color, index) => (
            <div
              key={index}
              className="flex-1"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1 text-xs text-slate-500 font-mono">
          <span>低</span>
          <span>高</span>
        </div>
      </div>
    </div>
  );
}
