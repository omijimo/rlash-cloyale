"use client";

import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { Unit, UnitType, GameState, ScreenPosition } from '@/lib/game-types';
import { UNIT_DEFINITIONS } from '@/lib/game-types';

interface BattlefieldCanvasProps {
  units: Unit[];
  onDeployUnit: (point: THREE.Vector3) => void;
  gameState: GameState;
  selectedUnitType: UnitType | null;
  onUnitPositionsUpdate: (positions: Map<number, ScreenPosition>) => void;
}

export function BattlefieldCanvas({ units, onDeployUnit, gameState, selectedUnitType, onUnitPositionsUpdate }: BattlefieldCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(new THREE.PerspectiveCamera(75, 1, 0.1, 1000));
  const planeRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const unitMeshesRef = useRef(new Map<number, THREE.Mesh>());
  const placementIndicatorRef = useRef<THREE.Mesh | null>(null);

  const unitsRef = useRef(units);
  const gameStateRef = useRef(gameState);
  const selectedUnitTypeRef = useRef(selectedUnitType);
  const onDeployUnitRef = useRef(onDeployUnit);
  const onUnitPositionsUpdateRef = useRef(onUnitPositionsUpdate);

  useEffect(() => { unitsRef.current = units; }, [units]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { selectedUnitTypeRef.current = selectedUnitType; }, [selectedUnitType]);
  useEffect(() => { onDeployUnitRef.current = onDeployUnit; }, [onDeployUnit]);
  useEffect(() => { onUnitPositionsUpdateRef.current = onUnitPositionsUpdate; }, [onUnitPositionsUpdate]);

  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;
    
    // --- Scene setup (only once) ---
    if (rendererRef.current) return;

    cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
    cameraRef.current.updateProjectionMatrix();

    // --- Renderer ---
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(rendererRef.current.domElement);
    const renderer = rendererRef.current;

    const scene = sceneRef.current;
    scene.background = new THREE.Color('#F0F0F0');

    // --- Camera ---
    const camera = cameraRef.current;
    camera.position.set(0, 15, 15);
    camera.lookAt(0, 0, 0);

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // --- Battlefield ---
    const planeGeometry = new THREE.PlaneGeometry(20, 30);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: '#8BC34A' });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);
    planeRef.current = plane;
    
    // Dividing line
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const points = [new THREE.Vector3(-10, 0.01, 0), new THREE.Vector3(10, 0.01, 0)];
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);
    
    // --- Placement Indicator ---
    const indicatorGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32);
    const indicatorMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    placementIndicatorRef.current = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    placementIndicatorRef.current.visible = false;
    scene.add(placementIndicatorRef.current);

    // --- Mouse Events ---
    const handleMouseMove = (event: MouseEvent) => {
      if (!mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    
    const handleClick = () => {
        if(gameStateRef.current === 'deployment' && placementIndicatorRef.current?.visible) {
            onDeployUnitRef.current(placementIndicatorRef.current.position);
        }
    };

    currentMount.addEventListener('mousemove', handleMouseMove);
    currentMount.addEventListener('click', handleClick);

    // --- Resize Listener ---
    const handleResize = () => {
      if (mountRef.current && renderer) {
        camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    
    // --- Animation Loop ---
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Update placement indicator
      if (gameStateRef.current === 'deployment' && selectedUnitTypeRef.current) {
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const intersects = raycasterRef.current.intersectObject(planeRef.current!);
        if (intersects.length > 0) {
          const point = intersects[0].point;
          if(point.z > 0) { 
            const definition = UNIT_DEFINITIONS[selectedUnitTypeRef.current];
            placementIndicatorRef.current!.position.set(point.x, definition.yOffset, point.z);
            placementIndicatorRef.current!.visible = true;
          } else {
            placementIndicatorRef.current!.visible = false;
          }
        }
      } else {
        placementIndicatorRef.current!.visible = false;
      }

      // Smoothly move unit meshes
      unitMeshesRef.current.forEach((mesh, id) => {
        const unitData = unitsRef.current.find(u => u.id === id);
        if (unitData) {
          mesh.position.lerp(new THREE.Vector3(unitData.position.x, unitData.position.y, unitData.position.z), 0.2);
        }
      });
      
      // Update screen positions for HUD
      const screenPositions = new Map<number, ScreenPosition>();
      const visibleUnits = unitsRef.current.filter(u => u.hp > 0);
      visibleUnits.forEach(unit => {
        const mesh = unitMeshesRef.current.get(unit.id);
        if (mesh) {
            const vector = new THREE.Vector3();
            vector.copy(mesh.position);
            
            const hudYOffset = unit.isKingTower ? 2.5 : unit.type === 'tower' ? 2 : 1;
            vector.y += hudYOffset;
            vector.project(camera);

            if (mountRef.current) {
                const x = (vector.x *  .5 + .5) * mountRef.current.clientWidth;
                const y = (vector.y * -.5 + .5) * mountRef.current.clientHeight;
                
                const screenYOffset = unit.isKingTower ? 40 : unit.type === 'tower' ? 30 : 20;
                screenPositions.set(unit.id, { x, y: y - screenYOffset});
            }
        }
      });
      onUnitPositionsUpdateRef.current(screenPositions);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (currentMount) {
        currentMount.removeEventListener('mousemove', handleMouseMove);
        currentMount.removeEventListener('click', handleClick);
        if (renderer.domElement) {
          currentMount.removeChild(renderer.domElement);
        }
      }
      renderer.dispose();
      rendererRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const currentMeshes = unitMeshesRef.current;
    const unitIds = new Set(units.map(u => u.id));

    // Add or update meshes
    units.forEach(unit => {
      if (!currentMeshes.has(unit.id)) {
        let geometry: THREE.BufferGeometry;
        switch (unit.type) {
          case 'tower':
            geometry = unit.isKingTower 
              ? new THREE.BoxGeometry(2, 4, 2) 
              : new THREE.BoxGeometry(1.5, 3, 1.5);
            break;
          case 'warrior':
            geometry = new THREE.BoxGeometry(1, 1, 1);
            break;
          case 'archer':
            geometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 16);
            break;
          default:
            geometry = new THREE.BoxGeometry(1, 1, 1);
        }
        
        const color = unit.team === 'player' ? '#3F51B5' : '#D32F2F';
        const material = new THREE.MeshStandardMaterial({ color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(unit.position.x, unit.position.y, unit.position.z);
        scene.add(mesh);
        currentMeshes.set(unit.id, mesh);
      }
    });

    // Remove old meshes for units that are gone (hp <= 0)
    currentMeshes.forEach((mesh, id) => {
      if (!unitIds.has(id)) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        if (mesh.material instanceof THREE.Material) {
          mesh.material.dispose();
        } else if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        }
        currentMeshes.delete(id);
      }
    });

  }, [units]);

  return <div ref={mountRef} className="w-full h-full" />;
}
