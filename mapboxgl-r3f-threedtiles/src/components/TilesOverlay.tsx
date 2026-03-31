import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OGC3DTile, TileLoader } from '@jdultra/threedtiles';
import { useStore } from '../store/useStore';

export function TilesOverlay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const tilesetRef = useRef<OGC3DTile | null>(null);
  const tileLoaderRef = useRef<TileLoader | null>(null);
  const animationFrameRef = useRef<number>(0);

  const { 
    selectedTileset, 
    setTileStats,
    setLoading,
    viewState 
  } = useStore();

  // 初始化 Three.js 渲染器
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000000
    );
    camera.position.set(0, 100, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);

    // 创建 TileLoader
    const tileLoader = new TileLoader({
      renderer,
      maxCachedItems: 100,
      meshCallback: (mesh: THREE.Mesh) => {
        if (mesh.material) {
          (mesh.material as THREE.Material).side = THREE.DoubleSide;
        }
      },
      pointsCallback: (points: THREE.Points) => {
        if (points.material) {
          // 每次回调时从 store 读取最新值，避免闭包陷阱
          const state = useStore.getState();
          (points.material as THREE.PointsMaterial).size = state.controlSettings.pointSize;
          (points.material as THREE.PointsMaterial).sizeAttenuation = true;
        }
      }
    });
    tileLoaderRef.current = tileLoader;

    // 渲染循环
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (cameraRef.current && rendererRef.current && sceneRef.current) {
        // 只调用一次 update，获取统计信息
        if (tilesetRef.current) {
          const stats = tilesetRef.current.update(cameraRef.current);
          if (stats) {
            setTileStats({
              numTilesLoaded: stats.numTilesLoaded || 0,
              numTilesRendered: stats.numTilesRendered || 0,
              maxLOD: stats.maxLOD || 0,
              percentageLoaded: stats.percentageLoaded || 0
            });
          }
        }

        if (tileLoaderRef.current) {
          tileLoaderRef.current.update();
        }

        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // 加载 tileset
  useEffect(() => {
    if (!sceneRef.current || !tileLoaderRef.current || !selectedTileset) return;

    if (tilesetRef.current) {
      tilesetRef.current.dispose();
      sceneRef.current.remove(tilesetRef.current as unknown as THREE.Object3D);
      tilesetRef.current = null;
    }

    setLoading(true);

    // 加载时读取当前设置
    const state = useStore.getState();
    const tileset = new OGC3DTile({
      url: selectedTileset.url,
      tileLoader: tileLoaderRef.current,
      renderer: rendererRef.current!,
      geometricErrorMultiplier: state.controlSettings.geometricErrorMultiplier,
      distanceBias: state.controlSettings.distanceBias,
      loadingStrategy: state.controlSettings.loadingStrategy,
      onLoadCallback: () => {
        setLoading(false);
      }
    });

    tilesetRef.current = tileset;
    sceneRef.current!.add(tileset as unknown as THREE.Object3D);

  }, [selectedTileset, setLoading]);

  // 更新几何误差乘数 (使用 getState() 避免闭包问题)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!tilesetRef.current) return;
    const state = useStore.getState();
    tilesetRef.current.setGeometricErrorMultiplier?.(state.controlSettings.geometricErrorMultiplier);
  });

  // 更新距离偏差
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!tilesetRef.current) return;
    const state = useStore.getState();
    tilesetRef.current.setDistanceBias?.(state.controlSettings.distanceBias);
  });

  // 更新 splats 设置
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!tilesetRef.current) return;
    const state = useStore.getState();
    if (state.splatsSettings.enabled) {
      tilesetRef.current.setSplatsQuality?.(state.splatsSettings.quality);
      tilesetRef.current.setSplatsExposureEV?.(state.splatsSettings.exposureEV);
      tilesetRef.current.setSplatsSaturation?.(state.splatsSettings.saturation);
      tilesetRef.current.setSplatsContrast?.(state.splatsSettings.contrast);
    }
  });

  // 同步相机到地图视图
  useEffect(() => {
    if (!cameraRef.current) return;

    const { longitude, latitude, zoom } = viewState;
    
    // 球面坐标转笛卡尔坐标
    // 使用 2^(20-zoom) * 10 作为距离基准，保证 zoom=15 时距离约为 5000
    const distance = Math.pow(2, 20 - zoom) * 10;
    const phi = (90 - latitude) * (Math.PI / 180);
    const theta = (longitude + 180) * (Math.PI / 180);

    const x = distance * Math.sin(phi) * Math.cos(theta);
    const y = distance * Math.cos(phi);
    const z = distance * Math.sin(phi) * Math.sin(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 0, 0);
    cameraRef.current.updateProjectionMatrix();
  }, [viewState]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
