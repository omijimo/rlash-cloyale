"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { BattlefieldCanvas } from '@/components/battlefield-canvas';
import { DeploymentPanel } from '@/components/deployment-panel';
import type { Unit, UnitType, GameState, Team, UnitDefinition, ScreenPosition } from '@/lib/game-types';
import { UNIT_DEFINITIONS } from '@/lib/game-types';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const BATTLE_DURATION = 180; // 3 minutes

export default function Home() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitType, setSelectedUnitType] = useState<UnitType | null>(null);
  const [gameState, setGameState] = useState<GameState>('deployment');
  const [winner, setWinner] = useState<Team | 'draw' | null>(null);
  const [unitScreenPositions, setUnitScreenPositions] = useState<Map<number, ScreenPosition>>(new Map());
  const [timeLeft, setTimeLeft] = useState(BATTLE_DURATION);
  const enemyDeploymentCounterRef = useRef(0);

  const initializeState = useCallback(() => {
    const towerDefinition = UNIT_DEFINITIONS.tower;
    const kingTowerHp = towerDefinition.maxHp * 1.5;

    const initialUnits: Unit[] = [
      // Player towers
      { id: 0, team: 'player', type: 'tower', position: { x: -5, y: towerDefinition.yOffset, z: 6 }, hp: towerDefinition.maxHp, ...towerDefinition, targetId: null, cooldown: 0 },
      { id: 1, team: 'player', type: 'tower', position: { x: 5, y: towerDefinition.yOffset, z: 6 }, hp: towerDefinition.maxHp, ...towerDefinition, targetId: null, cooldown: 0 },
      { id: 2, team: 'player', type: 'tower', position: { x: 0, y: towerDefinition.yOffset, z: 10 }, hp: kingTowerHp, ...towerDefinition, maxHp: kingTowerHp, isKingTower: true, targetId: null, cooldown: 0 },
      // Enemy towers
      { id: 3, team: 'enemy', type: 'tower', position: { x: -5, y: towerDefinition.yOffset, z: -6 }, hp: towerDefinition.maxHp, ...towerDefinition, targetId: null, cooldown: 0 },
      { id: 4, team: 'enemy', type: 'tower', position: { x: 5, y: towerDefinition.yOffset, z: -6 }, hp: towerDefinition.maxHp, ...towerDefinition, targetId: null, cooldown: 0 },
      { id: 5, team: 'enemy', type: 'tower', position: { x: 0, y: towerDefinition.yOffset, z: -10 }, hp: kingTowerHp, ...towerDefinition, maxHp: kingTowerHp, isKingTower: true, targetId: null, cooldown: 0 },
    ];
    
    setUnits(initialUnits);
    setSelectedUnitType(null);
    setGameState('deployment');
    setUnitScreenPositions(new Map());
    setWinner(null);
    setTimeLeft(BATTLE_DURATION);
    enemyDeploymentCounterRef.current = 0;
  }, []);

  useEffect(() => {
    initializeState();
  }, [initializeState]);
  
  const handleDeployUnit = useCallback((point: THREE.Vector3) => {
    if (gameState === 'end' || !selectedUnitType) return;
    
    // Player can only deploy on their side of the field
    if (point.z < 0) return;

    let latestId = units.reduce((maxId, unit) => Math.max(unit.id, maxId), 0);
    const newUnitsToDeploy: Unit[] = [];

    if (selectedUnitType === 'archer') {
        const definition = UNIT_DEFINITIONS.archer;
        newUnitsToDeploy.push({
            id: ++latestId,
            team: 'player',
            type: 'archer',
            position: { x: point.x - 0.5, y: definition.yOffset, z: point.z },
            hp: definition.maxHp,
            ...definition,
            targetId: null,
            cooldown: 0,
        });
        newUnitsToDeploy.push({
            id: ++latestId,
            team: 'player',
            type: 'archer',
            position: { x: point.x + 0.5, y: definition.yOffset, z: point.z },
            hp: definition.maxHp,
            ...definition,
            targetId: null,
            cooldown: 0,
        });
    } else {
        const definition = UNIT_DEFINITIONS[selectedUnitType];
        if (!definition) return;
        newUnitsToDeploy.push({
            id: ++latestId,
            team: 'player',
            type: selectedUnitType,
            position: { x: point.x, y: definition.yOffset, z: point.z },
            hp: definition.maxHp,
            ...definition,
            targetId: null,
            cooldown: 0,
        });
    }

    if (newUnitsToDeploy.length === 0) return;

    if (gameState === 'deployment') {
        // This is the first deployment, start battle and add enemies
        setGameState('battle');
        const enemyUnits: Unit[] = [
            { id: ++latestId, team: 'enemy', type: 'knight', position: { x: -2, y: UNIT_DEFINITIONS.knight.yOffset, z: -8 }, hp: UNIT_DEFINITIONS.knight.maxHp, ...UNIT_DEFINITIONS.knight, targetId: null, cooldown: 0 },
            { id: ++latestId, team: 'enemy', type: 'knight', position: { x: 2, y: UNIT_DEFINITIONS.knight.yOffset, z: -8 }, hp: UNIT_DEFINITIONS.knight.maxHp, ...UNIT_DEFINITIONS.knight, targetId: null, cooldown: 0 },
        ];
        setUnits(prev => [...prev, ...newUnitsToDeploy, ...enemyUnits]);
    } else {
        // Battle already started, just add the new units
        setUnits(prevUnits => [...prevUnits, ...newUnitsToDeploy]);
    }
  }, [gameState, selectedUnitType, units]);

  const handleRestart = () => {
    initializeState();
  };
  
  const checkTimeUpWinner = useCallback(() => {
    // This function is called when the timer runs out.
    // It determines the winner based on remaining towers.
    setUnits(currentUnits => {
      // Check from a fresh copy of units to avoid race conditions.
      const aliveUnits = currentUnits.filter(u => u.hp > 0);
      const playerTowersLeft = aliveUnits.filter(u => u.team === 'player' && u.type === 'tower').length;
      const enemyTowersLeft = aliveUnits.filter(u => u.team === 'enemy' && u.type === 'tower').length;
      
      let result: Team | 'draw' = 'draw';
      if (playerTowersLeft > enemyTowersLeft) {
        result = 'player';
      } else if (enemyTowersLeft > playerTowersLeft) {
        result = 'enemy';
      }
      
      setGameState('end');
      setWinner(result);
      return currentUnits; // No actual change to units, just reading state.
    });
  }, []);

  // Timer effect
  useEffect(() => {
    if (gameState !== 'battle' || winner) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          checkTimeUpWinner();
          return 0;
        }
        return prev - 1
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, winner, checkTimeUpWinner]);

  // Game loop effect
  useEffect(() => {
    if (gameState !== 'battle' || winner) return;
    
    const endGame = (result: Team | 'draw') => {
      setGameState('end');
      setWinner(result);
    };

    const simulationInterval = setInterval(() => {
        setUnits(currentUnits => {
            if (gameState !== 'battle' || winner) {
              return currentUnits;
            }
            
            let newUnits = [...currentUnits];
            enemyDeploymentCounterRef.current += 1;

            if (enemyDeploymentCounterRef.current >= 100) { // Every 10 seconds
                enemyDeploymentCounterRef.current = 0;
                let latestId = newUnits.reduce((maxId, unit) => Math.max(unit.id, maxId), 0);
                const unitTypesToDeploy: UnitType[] = ['knight', 'archer', 'hogRider', 'cannon'];
                const typeToDeploy = unitTypesToDeploy[Math.floor(Math.random() * unitTypesToDeploy.length)];
                
                const spawnX = (Math.random() * 10) - 5;
                const spawnZ = -8;

                if (typeToDeploy === 'archer') {
                    const definition = UNIT_DEFINITIONS.archer;
                    newUnits.push({ id: ++latestId, team: 'enemy', type: 'archer', position: { x: spawnX - 0.5, y: definition.yOffset, z: spawnZ }, hp: definition.maxHp, ...definition, targetId: null, cooldown: 0 });
                    newUnits.push({ id: ++latestId, team: 'enemy', type: 'archer', position: { x: spawnX + 0.5, y: definition.yOffset, z: spawnZ }, hp: definition.maxHp, ...definition, targetId: null, cooldown: 0 });
                } else {
                    const definition = UNIT_DEFINITIONS[typeToDeploy];
                    newUnits.push({ id: ++latestId, team: 'enemy', type: typeToDeploy, position: { x: spawnX, y: definition.yOffset, z: spawnZ }, hp: definition.maxHp, ...definition, targetId: null, cooldown: 0 });
                }
            }

            const aliveUnits = newUnits.filter(u => u.hp > 0);
            
            const playerKingTower = aliveUnits.find(u => u.team === 'player' && u.isKingTower);
            const enemyKingTower = aliveUnits.find(u => u.team === 'enemy' && u.isKingTower);

            if (!enemyKingTower) { endGame('player'); return aliveUnits; }
            if (!playerKingTower) { endGame('enemy'); return aliveUnits; }

            const playerUnits = aliveUnits.filter(u => u.team === 'player');
            const enemyUnits = aliveUnits.filter(u => u.team === 'enemy');
            
            const findClosestTargetInRange = (unit: Unit, targets: Unit[], range: number) => {
              if (targets.length === 0) return null;
              let closestTarget: Unit | null = null;
              let minDistance = range;
              const unitPos = new THREE.Vector3(unit.position.x, unit.position.y, unit.position.z);
              for (const target of targets) {
                const targetPos = new THREE.Vector3(target.position.x, target.position.y, target.position.z);
                const distance = unitPos.distanceTo(targetPos);
                if (distance < minDistance) {
                  minDistance = distance;
                  closestTarget = target;
                }
              }
              return closestTarget;
            };

            const unitMap = new Map(aliveUnits.map(u => [u.id, u]));

            const updatedUnits = aliveUnits.map(unit => {
              let newUnit = { ...unit };

              if (newUnit.healthDecay) {
                newUnit.hp -= newUnit.healthDecay / 10;
              }

              if (newUnit.cooldown > 0) newUnit.cooldown--;

              const allEnemyUnits = newUnit.team === 'player' ? enemyUnits : playerUnits;
              let currentTarget: Unit | undefined;

              // 1. Check if the unit has a valid, existing target
              if (newUnit.targetId !== null) {
                const targetFromMap = unitMap.get(newUnit.targetId);
                // Check if target is alive (in unitMap) and in detection range
                if (targetFromMap) {
                  // Hog Riders should not have non-building targets
                  if (newUnit.type === 'hogRider' && !targetFromMap.isBuilding) {
                     newUnit.targetId = null;
                  } else {
                    const unitPos = new THREE.Vector3(newUnit.position.x, newUnit.position.y, newUnit.position.z);
                    const targetPos = new THREE.Vector3(targetFromMap.position.x, targetFromMap.position.y, targetFromMap.position.z);
                    if (unitPos.distanceTo(targetPos) <= newUnit.detectionRange) {
                      currentTarget = targetFromMap;
                    } else {
                      newUnit.targetId = null; // Target is out of range
                    }
                  }
                } else {
                  newUnit.targetId = null; // Target is dead
                }
              }

              // 2. If no valid target, find a new one
              if (!currentTarget) {
                const potentialAttackTargets = newUnit.type === 'hogRider'
                  ? allEnemyUnits.filter(u => u.isBuilding)
                  : allEnemyUnits;
                
                const closestTarget = findClosestTargetInRange(newUnit, potentialAttackTargets, newUnit.detectionRange);
                if (closestTarget) {
                  currentTarget = closestTarget;
                  newUnit.targetId = closestTarget.id;
                }
              }
              
              // 3. Act: either engage the target or follow the path
              if (currentTarget) {
                const unitPos = new THREE.Vector3(newUnit.position.x, newUnit.position.y, newUnit.position.z);
                const targetPos = new THREE.Vector3(currentTarget.position.x, currentTarget.position.y, currentTarget.position.z);
                const distance = unitPos.distanceTo(targetPos);

                if (distance > newUnit.attackRange) {
                  // Move towards target
                  if (!newUnit.isBuilding) {
                    const direction = targetPos.clone().sub(unitPos).normalize();
                    newUnit.position.x += direction.x * newUnit.speed;
                    newUnit.position.z += direction.z * newUnit.speed;
                  }
                } else if (newUnit.cooldown === 0) {
                  // Attack target
                  const targetInMap = unitMap.get(currentTarget.id);
                  if (targetInMap) {
                    targetInMap.hp -= newUnit.attackDamage;
                  }
                  newUnit.cooldown = newUnit.attackSpeed;
                }
              } else { // No enemy in detection range, follow path
                newUnit.targetId = null;
                if (newUnit.isBuilding) return newUnit; 

                const targetBuildings = allEnemyUnits.filter(u => u.isBuilding);
                let pathTarget: Unit | null = null;
                
                if (newUnit.type === 'hogRider') {
                  pathTarget = findClosestTargetInRange(newUnit, targetBuildings, Infinity);
                } else {
                  const kingTower = targetBuildings.find(t => t.isKingTower);
                  let laneBuildings: Unit[];
                  if (newUnit.position.x <= 0) { // Left lane
                      laneBuildings = targetBuildings.filter(b => b.position.x <= 0 && !b.isKingTower);
                  } else { // Right lane
                      laneBuildings = targetBuildings.filter(b => b.position.x > 0 && !b.isKingTower);
                  }

                  if(laneBuildings.length > 0) {
                      pathTarget = findClosestTargetInRange(newUnit, laneBuildings, Infinity);
                  } else {
                      pathTarget = kingTower || null;
                  }
                }
                
                if (pathTarget) {
                    const unitPos = new THREE.Vector3(newUnit.position.x, newUnit.position.y, newUnit.position.z);
                    const targetPos = new THREE.Vector3(pathTarget.position.x, pathTarget.position.y, pathTarget.position.z);
                    const distance = unitPos.distanceTo(targetPos);

                    if (distance > newUnit.attackRange) {
                        const direction = targetPos.clone().sub(unitPos).normalize();
                        newUnit.position.x += direction.x * newUnit.speed;
                        newUnit.position.z += direction.z * newUnit.speed;
                    } else if (newUnit.cooldown === 0) {
                      newUnit.targetId = pathTarget.id;
                      const targetInMap = unitMap.get(pathTarget.id);
                      if (targetInMap) {
                        targetInMap.hp -= newUnit.attackDamage;
                      }
                      newUnit.cooldown = newUnit.attackSpeed;
                    }
                }
              }
              return newUnit;
            });

            return updatedUnits.filter(u => u.hp > 0);
        });
    }, 100);

    return () => clearInterval(simulationInterval);
  }, [gameState, winner]);

  const handleUnitPositionsUpdate = useCallback((positions: Map<number, ScreenPosition>) => {
    setUnitScreenPositions(new Map(positions));
  }, []);
  
  const getEndGameMessage = () => {
    switch (winner) {
      case 'player':
        return { title: 'Glorious Victory!', description: 'You have crushed the enemy and claimed the battlefield.' };
      case 'enemy':
        return { title: 'Valiant Defeat!', description: 'Your forces have been routed. Live to fight another day.' };
      case 'draw':
        return { title: 'Stalemate!', description: 'The horns of retreat have sounded. Neither side claims victory.' };
      default:
        return { title: '', description: '' };
    }
  };
  
  const { title, description } = getEndGameMessage();

  return (
    <div className="flex flex-col h-screen w-screen bg-background font-body">
      <div className="relative flex-grow">
        {gameState === 'battle' && (
           <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-6 py-2 rounded-lg text-4xl font-bold z-10 font-headline">
            {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}
          </div>
        )}
        {gameState === 'end' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col justify-center items-center z-20">
            <div className="bg-card p-8 rounded-lg shadow-2xl text-center border-2 border-border">
              <h2 className="text-5xl font-bold mb-4 text-foreground font-headline">
                {title}
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                {description}
              </p>
              <Button size="lg" onClick={handleRestart} className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg">
                <RefreshCw className="mr-2 h-6 w-6" />
                To Battle!
              </Button>
            </div>
          </div>
        )}
        <BattlefieldCanvas 
          units={units} 
          onDeployUnit={handleDeployUnit}
          gameState={gameState}
          selectedUnitType={selectedUnitType}
          onUnitPositionsUpdate={handleUnitPositionsUpdate}
        />
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
          {units.map(unit => {
            const pos = unitScreenPositions.get(unit.id);
            if (!pos) return null;
            const yOffset = unit.isBuilding ? (unit.isKingTower ? 40 : 30) : 20;
            return (
              <div key={unit.id} className="health-bar" style={{ left: `${pos.x}px`, top: `${pos.y}px` }}>
                <div className="health-bar-inner" style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }}></div>
              </div>
            )
          })}
        </div>
      </div>
      <DeploymentPanel 
        selectedUnitType={selectedUnitType}
        onSelectUnit={setSelectedUnitType}
        gameState={gameState}
      />
    </div>
  );
}
