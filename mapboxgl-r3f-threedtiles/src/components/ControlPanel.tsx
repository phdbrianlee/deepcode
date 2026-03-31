import { useStore } from '../store/useStore';
import { COLOR_SCHEMES, LOADING_STRATEGIES } from '../constants/tilesets';
import { ChevronLeft, ChevronRight, Settings, Palette, Box, Eye, Zap } from 'lucide-react';
import { useState } from 'react';
import type { ControlSettings } from '../types';

type LoadingStrategy = ControlSettings['loadingStrategy'];
type ColorScheme = ControlSettings['colorScheme'];

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}

function Slider({ label, value, min, max, step = 0.1, onChange, format }: SliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="text-sm font-mono text-green-500">{format ? format(value) : value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-green-500"
      />
    </div>
  );
}

interface SelectProps<T extends string> {
  label: string;
  value: T;
  options: { id: T; name: string }[];
  onChange: (value: T) => void;
}

function Select<T extends string>({ label, value, options, onChange }: SelectProps<T>) {
  return (
    <div className="space-y-2">
      <span className="text-sm text-slate-300">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm cursor-pointer hover:bg-slate-700 transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ControlPanel() {
  const { 
    isControlPanelOpen, 
    setControlPanelOpen, 
    controlSettings, 
    setControlSettings,
    splatsSettings,
    setSplatsSettings,
    physicsEnabled,
    setPhysicsEnabled
  } = useStore();

  const [expandedSection, setExpandedSection] = useState<string | null>('lod');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div 
      className={`fixed bottom-4 left-4 z-40 transition-all duration-300 ${
        isControlPanelOpen ? 'w-80' : 'w-12'
      }`}
    >
      <button
        onClick={() => setControlPanelOpen(!isControlPanelOpen)}
        className="absolute -right-3 top-4 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer"
      >
        {isControlPanelOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {isControlPanelOpen && (
        <div className="glass-panel p-4 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-700/50">
            <Settings className="w-5 h-5 text-green-500" />
            <h2 className="font-semibold">控制面板</h2>
          </div>

          {/* LOD 控制 */}
          <div className="border border-slate-700/50 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('lod')}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium">LOD 控制</span>
              </div>
            </button>
            {expandedSection === 'lod' && (
              <div className="p-4 space-y-4">
                <Slider
                  label="几何误差乘数"
                  value={controlSettings.geometricErrorMultiplier}
                  min={0.01}
                  max={10}
                  onChange={(v) => setControlSettings({ geometricErrorMultiplier: v })}
                />
                <Slider
                  label="距离偏差"
                  value={controlSettings.distanceBias}
                  min={0.1}
                  max={3}
                  onChange={(v) => setControlSettings({ distanceBias: v })}
                />
                <Select<LoadingStrategy>
                  label="加载策略"
                  value={controlSettings.loadingStrategy}
                  options={LOADING_STRATEGIES as { id: LoadingStrategy; name: string; description: string }[]}
                  onChange={(v) => setControlSettings({ loadingStrategy: v })}
                />
              </div>
            )}
          </div>

          {/* 颜色方案 */}
          <div className="border border-slate-700/50 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('color')}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium">颜色方案</span>
              </div>
            </button>
            {expandedSection === 'color' && (
              <div className="p-4 space-y-4">
                <Select<ColorScheme>
                  label="着色模式"
                  value={controlSettings.colorScheme}
                  options={COLOR_SCHEMES.map((c) => ({ id: c.id as ColorScheme, name: c.name }))}
                  onChange={(v) => setControlSettings({ colorScheme: v })}
                />
                <Slider
                  label="点大小"
                  value={controlSettings.pointSize}
                  min={1}
                  max={10}
                  step={0.5}
                  onChange={(v) => setControlSettings({ pointSize: v })}
                />
                <Slider
                  label="透明度"
                  value={controlSettings.opacity}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => setControlSettings({ opacity: v })}
                />
              </div>
            )}
          </div>

          {/* Splats 设置 */}
          <div className="border border-slate-700/50 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('splats')}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium">Gaussian Splats</span>
              </div>
            </button>
            {expandedSection === 'splats' && (
              <div className="p-4 space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={splatsSettings.enabled}
                    onChange={(e) => setSplatsSettings({ enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-green-500 focus:ring-green-500 cursor-pointer"
                  />
                  <span className="text-sm">启用 Splats</span>
                </label>
                {splatsSettings.enabled && (
                  <>
                    <Slider
                      label="质量"
                      value={splatsSettings.quality}
                      min={0.1}
                      max={1}
                      step={0.05}
                      format={(v) => `${Math.round(v * 100)}%`}
                      onChange={(v) => setSplatsSettings({ quality: v })}
                    />
                    <Slider
                      label="曝光补偿 (EV)"
                      value={splatsSettings.exposureEV}
                      min={-6}
                      max={6}
                      step={0.5}
                      format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`}
                      onChange={(v) => setSplatsSettings({ exposureEV: v })}
                    />
                    <Slider
                      label="饱和度"
                      value={splatsSettings.saturation}
                      min={0}
                      max={2}
                      step={0.1}
                      onChange={(v) => setSplatsSettings({ saturation: v })}
                    />
                    <Slider
                      label="对比度"
                      value={splatsSettings.contrast}
                      min={0}
                      max={2}
                      step={0.1}
                      onChange={(v) => setSplatsSettings({ contrast: v })}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* 物理引擎 */}
          <div className="border border-slate-700/50 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('physics')}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium">物理引擎</span>
              </div>
            </button>
            {expandedSection === 'physics' && (
              <div className="p-4 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={physicsEnabled}
                    onChange={(e) => setPhysicsEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-green-500 focus:ring-green-500 cursor-pointer"
                  />
                  <span className="text-sm">启用 Rapier3D 物理</span>
                </label>
                <p className="text-xs text-slate-500">
                  物理引擎支持刚体碰撞检测和动力学模拟，可用于室内导航和碰撞检测。
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
