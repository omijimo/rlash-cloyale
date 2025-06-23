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

    const definition = UNIT_DEFINITIONS[selectedUnitType];
    if (!definition) return;
    
    const newId = Math.max(...units.map(u => u.id), 0) + 1;

    const newUnit: Unit = {
      id: newId,
      team: 'player',
      type: selectedUnitType,
      position: { x: point.x, y: definition.yOffset, z: point.z },
      hp: definition.maxHp,
      ...definition,
      targetId: null,
      cooldown: 0,
    };

    if (gameState === 'deployment') {
        // This is the first deployment, start battle and add enemies
        setGameState('battle');
        const enemyUnits: Unit[] = [
            { id: newId + 1, team: 'enemy', type: 'warrior', position: { x: -2, y: UNIT_DEFINITIONS.warrior.yOffset, z: -8 }, hp: 100, ...UNIT_DEFINITIONS.warrior, targetId: null, cooldown: 0 },
            { id: newId + 2, team: 'enemy', type: 'warrior', position: { x: 2, y: UNIT_DEFINITIONS.warrior.yOffset, z: -8 }, hp: 100, ...UNIT_DEFINITIONS.warrior, targetId: null, cooldown: 0 },
            { id: newId + 3, team: 'enemy', type: 'archer', position: { x: 0, y: UNIT_DEFINITIONS.archer.yOffset, z: -10 }, hp: 50, ...UNIT_DEFINITIONS.archer, targetId: null, cooldown: 0 },
        ];
        setUnits(prev => [...prev, newUnit, ...enemyUnits]);
    } else {
        // Battle already started, just add the new unit
        setUnits(prevUnits => [...prevUnits, newUnit]);
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
            // Stop simulation if the game is no longer in battle state
            if (gameState !== 'battle' || winner) {
              return currentUnits;
            }
            
            let newUnits = [...currentUnits];
            enemyDeploymentCounterRef.current += 1;

            // Spawn new enemy units periodically
            if (enemyDeploymentCounterRef.current >= 150) { // Every 15 seconds
                enemyDeploymentCounterRef.current = 0;

                const latestId = newUnits.reduce((maxId, unit) => Math.max(unit.id, maxId), 0);
                const unitTypesToDeploy: UnitType[] = ['warrior', 'archer'];
                const typeToDeploy = unitTypesToDeploy[Math.floor(Math.random() * unitTypesToDeploy.length)];
                const definition = UNIT_DEFINITIONS[typeToDeploy];

                newUnits.push({
                    id: latestId + 1,
                    team: 'enemy',
                    type: typeToDeploy,
                    position: { x: (Math.random() * 10) - 5, y: definition.yOffset, z: -8 },
                    hp: definition.maxHp,
                    ...definition,
                    targetId: null,
                    cooldown: 0,
                });
            }

            const aliveUnits = newUnits.filter(u => u.hp > 0);
            
            // Check for win conditions by king tower destruction
            const playerKingTower = aliveUnits.find(u => u.team === 'player' && u.isKingTower);
            const enemyKingTower = aliveUnits.find(u => u.team === 'enemy' && u.isKingTower);

            if (!enemyKingTower) {
              endGame('player');
              return aliveUnits;
            }
            if (!playerKingTower) {
              endGame('enemy');
              return aliveUnits;
            }

            const playerUnits = aliveUnits.filter(u => u.team === 'player');
            const enemyUnits = aliveUnits.filter(u => u.team === 'enemy');
            
            const findClosestTarget = (unit: Unit, targets: Unit[]) => {
              if (targets.length === 0) return null;
              let closestTarget: Unit | null = null;
              let minDistance = Infinity;

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
              const potentialTargets = unit.team === 'player' ? enemyUnits : playerUnits;
              let target = newUnit.targetId !== null ? unitMap.get(newUnit.targetId) : null;

              if (!target || target.hp <= 0) {
                target = findClosestTarget(newUnit, potentialTargets);
                newUnit.targetId = target ? target.id : null;
              }

              if (target) {
                const unitPos = new THREE.Vector3(newUnit.position.x, newUnit.position.y, newUnit.position.z);
                const targetPos = new THREE.Vector3(target.position.x, target.position.y, target.position.z);
                const distance = unitPos.distanceTo(targetPos);

                if (newUnit.cooldown > 0) {
                  newUnit.cooldown -= 1;
                }

                // Towers do not move
                if (distance > newUnit.attackRange && newUnit.type !== 'tower') {
                  const direction = targetPos.clone().sub(unitPos).normalize();
                  newUnit.position.x += direction.x * newUnit.speed;
                  newUnit.position.y += direction.y * newUnit.speed;
                  newUnit.position.z += direction.z * newUnit.speed;
                } else if (newUnit.cooldown === 0 && distance <= newUnit.attackRange) {
                  // Attack target
                  const targetInMap = unitMap.get(target.id);
                  if (targetInMap) {
                    targetInMap.hp -= newUnit.attackDamage;
                  }
                  newUnit.cooldown = newUnit.attackSpeed;
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
        return { title: 'Victory!', description: 'You have vanquished the enemy forces.' };
      case 'enemy':
        return { title: 'Defeat!', description: 'Your forces have been overwhelmed.' };
      case 'draw':
        return { title: 'Draw!', description: 'The battle ended in a stalemate.' };
      default:
        return { title: '', description: '' };
    }
  };
  
  const { title, description } = getEndGameMessage();

  return (
    <div className="flex flex-col h-screen w-screen bg-background font-body">
      <div className="relative flex-grow">
        {gameState === 'battle' && (
           <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-6 py-2 rounded-lg text-4xl font-bold z-10">
            {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}
          </div>
        )}
        {gameState === 'end' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col justify-center items-center z-20">
            <div className="bg-card p-8 rounded-lg shadow-2xl text-center">
              <h2 className="text-5xl font-bold mb-4 text-foreground">
                {title}
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                {description}
              </p>
              <Button size="lg" onClick={handleRestart} className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg">
                <RefreshCw className="mr-2 h-6 w-6" />
                Play Again
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
