export interface TilesetInfo {
  id: string;
  name: string;
  url: string;
  type: 'glTF' | 'B3DM' | 'SPZ';
  center: [number, number, number];
  description: string;
}

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface ControlSettings {
  geometricErrorMultiplier: number;
  distanceBias: number;
  loadingStrategy: 'INCREMENTAL' | 'IMMEDIATE' | 'PERLEVEL';
  colorScheme: 'elevation' | 'intensity' | 'classification' | 'rgb';
  pointSize: number;
  opacity: number;
}

export interface SplatsSettings {
  enabled: boolean;
  quality: number;
  exposureEV: number;
  saturation: number;
  contrast: number;
}

export interface TileStats {
  numTilesLoaded: number;
  numTilesRendered: number;
  maxLOD: number;
  percentageLoaded: number;
}
