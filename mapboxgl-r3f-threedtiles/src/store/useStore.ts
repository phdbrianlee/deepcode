import { create } from 'zustand';
import type { TilesetInfo, ControlSettings, SplatsSettings, TileStats, ViewState } from '../types';
import { TILESETS, DEFAULT_VIEW_STATE } from '../constants/tilesets';

interface AppState {
  // 当前选中的 tileset
  selectedTileset: TilesetInfo;
  setSelectedTileset: (tileset: TilesetInfo) => void;

  // View state
  viewState: ViewState;
  setViewState: (viewState: Partial<ViewState>) => void;

  // 控制设置
  controlSettings: ControlSettings;
  setControlSettings: (settings: Partial<ControlSettings>) => void;

  // Splats 设置
  splatsSettings: SplatsSettings;
  setSplatsSettings: (settings: Partial<SplatsSettings>) => void;

  // 瓦片统计
  tileStats: TileStats;
  setTileStats: (stats: Partial<TileStats>) => void;

  // UI 状态
  isControlPanelOpen: boolean;
  setControlPanelOpen: (open: boolean) => void;
  isInfoPanelOpen: boolean;
  setInfoPanelOpen: (open: boolean) => void;

  // 物理引擎开关
  physicsEnabled: boolean;
  setPhysicsEnabled: (enabled: boolean) => void;

  // 加载状态
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  selectedTileset: TILESETS[0],
  setSelectedTileset: (tileset) => set({ selectedTileset: tileset }),

  viewState: DEFAULT_VIEW_STATE,
  setViewState: (viewState) => set((state) => ({
    viewState: { ...state.viewState, ...viewState }
  })),

  controlSettings: {
    geometricErrorMultiplier: 1.0,
    distanceBias: 1.0,
    loadingStrategy: 'INCREMENTAL',
    colorScheme: 'elevation',
    pointSize: 2,
    opacity: 1.0,
  },
  setControlSettings: (settings) => set((state) => ({
    controlSettings: { ...state.controlSettings, ...settings }
  })),

  splatsSettings: {
    enabled: false,
    quality: 0.75,
    exposureEV: 0.0,
    saturation: 1.0,
    contrast: 1.0,
  },
  setSplatsSettings: (settings) => set((state) => ({
    splatsSettings: { ...state.splatsSettings, ...settings }
  })),

  tileStats: {
    numTilesLoaded: 0,
    numTilesRendered: 0,
    maxLOD: 0,
    percentageLoaded: 0,
  },
  setTileStats: (stats) => set((state) => ({
    tileStats: { ...state.tileStats, ...stats }
  })),

  isControlPanelOpen: true,
  setControlPanelOpen: (open) => set({ isControlPanelOpen: open }),
  isInfoPanelOpen: true,
  setInfoPanelOpen: (open) => set({ isInfoPanelOpen: open }),

  physicsEnabled: false,
  setPhysicsEnabled: (enabled) => set({ physicsEnabled: enabled }),

  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
}));
