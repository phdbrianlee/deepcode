import React, { useRef, useEffect } from 'react';
import { TilesRenderer as ThreeTilesRenderer } from '3d-tiles-renderer/three';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function TilesRenderer({ 
  url, 
  onTilesLoad, 
  onStatsUpdate,
  onTilesetCreated,
  onTilesetBoundingBox
}) {
  const tilesRendererRef = useRef(null);
  const { camera, gl } = useThree();
  const groupRef = useRef(null);
  const frameCountRef = useRef(0);
  const initialCameraSetRef = useRef(false);

  useEffect(() => {
    if (!url) return;

    const tilesRenderer = new ThreeTilesRenderer(url);
    tilesRendererRef.current = tilesRenderer;
    initialCameraSetRef.current = false;

    tilesRenderer.setCamera(camera);
    tilesRenderer.setResolution(camera, gl.domElement.width, gl.domElement.height);

    tilesRenderer.errorTarget = 16;
    tilesRenderer.maxTilesProcessed = 250;

    tilesRenderer.addEventListener('load-root-tileset', () => {
      console.log('Root tileset loaded');

      const box = new THREE.Box3();
      const sphere = new THREE.Sphere();
      
      if (tilesRenderer.getBoundingBox(box)) {
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);
        
        tilesRenderer.group.position.copy(center).multiplyScalar(-1);
        console.log('Tileset bounding box:', box.min, box.max);
        console.log('Tileset center:', center);
        console.log('Tileset size:', size);

        if (onTilesetBoundingBox) {
          onTilesetBoundingBox({ box, center, size });
        }
      }

      if (tilesRenderer.getBoundingSphere(sphere)) {
        console.log('Tileset bounding sphere center:', sphere.center);
        console.log('Tileset bounding sphere radius:', sphere.radius);
      }

      if (onTilesLoad) onTilesLoad();
      if (onTilesetCreated) onTilesetCreated(tilesRenderer);
    });

    tilesRenderer.addEventListener('load-model', (e) => {
      const { scene: tileScene } = e;
      console.log('Model loaded, adding to scene');
      if (groupRef.current && tileScene) {
        groupRef.current.add(tileScene);
      }
    });

    tilesRenderer.addEventListener('dispose-model', (e) => {
      const { scene: tileScene } = e;
      if (groupRef.current && tileScene && tileScene.parent) {
        groupRef.current.remove(tileScene);
      }
    });

    tilesRenderer.addEventListener('load-error', (e) => {
      console.error('Tile load error:', e.error);
    });

    return () => {
      tilesRenderer.dispose();
      tilesRendererRef.current = null;
    };
  }, [url, camera, gl, onTilesLoad, onTilesetCreated, onTilesetBoundingBox]);

  useEffect(() => {
    const tilesRenderer = tilesRendererRef.current;
    if (!tilesRenderer) return;

    const handleResize = () => {
      tilesRenderer.setResolution(camera, gl.domElement.width, gl.domElement.height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [camera, gl]);

  useFrame(() => {
    const tilesRenderer = tilesRendererRef.current;
    if (!tilesRenderer) return;

    frameCountRef.current++;
    camera.updateMatrixWorld();
    tilesRenderer.update();

    if (frameCountRef.current % 30 === 0 && onStatsUpdate) {
      onStatsUpdate({
        tilesProcessed: tilesRenderer.stats.tilesProcessed,
        tilesLoaded: tilesRenderer.stats.loaded,
        tilesInFrustum: tilesRenderer.stats.inFrustum,
        used: tilesRenderer.stats.used,
        active: tilesRenderer.stats.active
      });
    }
  });

  return <group ref={groupRef} />;
}

export default TilesRenderer;
