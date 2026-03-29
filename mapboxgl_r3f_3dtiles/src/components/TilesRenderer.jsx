import React, { useRef, useEffect, useCallback } from 'react';
import { TilesRenderer as ThreeTilesRenderer } from '3d-tiles-renderer/three';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Spherical, Vector3 } from 'three';

function TilesRenderer({ 
  url, 
  onTilesLoad, 
  onStatsUpdate,
  mapboxRef,
  syncWithMapbox = true 
}) {
  const tilesRendererRef = useRef(null);
  const { camera, gl, scene } = useThree();
  const groupRef = useRef(null);
  const frameCountRef = useRef(0);
  const cameraMatrixRef = useRef(new THREE.Matrix4());
  const targetPositionRef = useRef(new THREE.Vector3());
  const tempVecRef = useRef(new THREE.Vector3());
  const tempSphereRef = useRef(new THREE.Sphere());

  useEffect(() => {
    if (!url) return;

    const tilesRenderer = new ThreeTilesRenderer(url);
    tilesRendererRef.current = tilesRenderer;

    tilesRenderer.setCamera(camera);
    tilesRenderer.setResolution(camera, gl.domElement.width, gl.domElement.height);

    tilesRenderer.errorTarget = 16;
    tilesRenderer.maxTilesProcessed = 250;

    tilesRenderer.addEventListener('load-root-tileset', () => {
      console.log('Root tileset loaded');
      if (onTilesLoad) onTilesLoad();

      const sphere = new THREE.Sphere();
      if (tilesRenderer.getBoundingSphere(sphere)) {
        tilesRenderer.group.position.copy(sphere.center).multiplyScalar(-1);
      }
    });

    tilesRenderer.addEventListener('load-model', (e) => {
      const { scene: tileScene } = e;
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
  }, [url, camera, gl, onTilesLoad]);

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

    if (syncWithMapbox && mapboxRef?.current) {
      syncCameraToMapbox();
    }

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

  const syncCameraToMapbox = useCallback(() => {
    if (!mapboxRef?.current || !tilesRendererRef.current) return;

    const map = mapboxRef.current.getMap();
    if (!map) return;

    const mapCenter = map.getCenter();
    const mapZoom = map.getZoom();
    const mapPitch = map.getPitch();
    const mapBearing = map.getBearing();

    const centerLon = mapCenter.lng;
    const centerLat = mapCenter.lat;

    const earthRadius = 6378137;
    const latRad = centerLat * Math.PI / 180;
    const metersPerPixel = earthRadius * 2 * Math.PI / (256 * Math.pow(2, mapZoom));

    const offsetX = (gl.domElement.width / 2) * metersPerPixel;
    const offsetY = (gl.domElement.height / 2) * metersPerPixel * Math.cos(latRad);

    const heading = mapBearing * Math.PI / 180;
    const pitch = mapPitch * Math.PI / 180;

    const distance = 1000 * Math.pow(2, 15 - Math.min(mapZoom, 15));

    const posX = -offsetX * Math.cos(heading) + offsetY * Math.sin(heading);
    const posY = -offsetX * Math.sin(heading) - offsetY * Math.cos(heading);
    const posZ = distance * Math.cos(pitch);
    const posW = distance * Math.sin(pitch);

    if (groupRef.current) {
      groupRef.current.position.set(
        posX + centerLon * 111319.9 * Math.cos(latRad),
        posY,
        -posZ - centerLat * 111319.9
      );

      groupRef.current.rotation.y = -heading;
    }
  }, [gl, mapboxRef]);

  return <group ref={groupRef} />;
}

export default TilesRenderer;
