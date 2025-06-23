"use client";

import { useState, useEffect, useCallback } from 'react';
import { BattlefieldCanvas } from '@/components/battlefield-canvas';
import { DeploymentPanel } from '@/components/deployment-panel';
import type { Unit, UnitType, GameState, Team, UnitDefinition, ScreenPosition } from '@/lib/game-types';
import { UNIT_DEFINITIONS } from '@/lib/game-types';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function Home() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitType, setSelectedUnitType] = useState<UnitType | null>(null);
  const [gameState, setGameState] = useState<GameState>('deployment');
  const [winner, setWinner] = useState<Team | null>(null);
  const [nextId, setNextId] = useState(0);
  const [unitScreenPositions, setUnitScreenPositions] = useState<Map<number, ScreenPosition>>(new Map());

  const handleDeployUnit = useCallback((point: THREE.Vector3) => {
    if (gameState !== 'deployment' || !selectedUnitType) return;
    
    // Only allow deployment on the player's side (bottom half, z > 0)
    if (point.z < 0) return;

    const definition = UNIT_DEFINITIONS[selectedUnitType];
    if (!definition) return;

    const newUnit: Unit = {
      id: nextId,
      team: 'player',
      type: selectedUnitType,
      position: { x: point.x, y: definition.yOffset, z: point.z },
      hp: definition.maxHp,
      ...definition,
      targetId: null,
      cooldown: 0,
    };

    setUnits(prevUnits => [...prevUnits, newUnit]);
    setNextId(prevId => prevId + 1);
  }, [gameState, selectedUnitType, nextId]);
  
  const handleStartBattle = () => {
    // Cannot start with no units
    if (units.filter(u => u.team === 'player').length === 0) return;

    setGameState('battle');
    // Add some enemy units
    const enemyUnits: Unit[] = [
      { id: 100, team: 'enemy', type: 'warrior', position: { x: -2, y: UNIT_DEFINITIONS.warrior.yOffset, z: -8 }, hp: 100, ...UNIT_DEFINITIONS.warrior, targetId: null, cooldown: 0 },
      { id: 101, team: 'enemy', type: 'warrior', position: { x: 2, y: UNIT_DEFINITIONS.warrior.yOffset, z: -8 }, hp: 100, ...UNIT_DEFINITIONS.warrior, targetId: null, cooldown: 0 },
      { id: 102, team: 'enemy', type: 'archer', position: { x: 0, y: UNIT_DEFINITIONS.archer.yOffset, z: -10 }, hp: 50, ...UNIT_DEFINITIONS.archer, targetId: null, cooldown: 0 },
    ];
    setUnits(prev => [...prev, ...enemyUnits]);
    setNextId(prevId => Math.max(prevId, 103));
  };

  const handleRestart = () => {
    setUnits([]);
    setSelectedUnitType(null);
    setGameState('deployment');
    setNextId(0);
    setUnitScreenPositions(new Map());
    setWinner(null);
  };

  useEffect(() => {
    if (gameState !== 'battle') return;

    let hasBattleEnded = false;

    const simulationInterval = setInterval(() => {
        if (hasBattleEnded) {
            clearInterval(simulationInterval);
            return;
        }

        setUnits(currentUnits => {
            const aliveUnits = currentUnits.filter(u => u.hp > 0);
            const playerUnits = aliveUnits.filter(u => u.team === 'player');
            const enemyUnits = aliveUnits.filter(u => u.team === 'enemy');

            // Check for win/loss only after the battle has begun
            if (currentUnits.some(u => u.team === 'player') && playerUnits.length === 0) {
                hasBattleEnded = true;
                setGameState('end');
                setWinner('enemy');
                return aliveUnits;
            }

            if (currentUnits.some(u => u.team === 'enemy') && enemyUnits.length === 0) {
                hasBattleEnded = true;
                setGameState('end');
                setWinner('player');
                return aliveUnits;
            }

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

                if (distance > newUnit.attackRange) {
                  // Move towards target
                  const direction = targetPos.clone().sub(unitPos).normalize();
                  newUnit.position.x += direction.x * newUnit.speed;
                  newUnit.position.y += direction.y * newUnit.speed;
                  newUnit.position.z += direction.z * newUnit.speed;
                } else if (newUnit.cooldown === 0) {
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
  }, [gameState]);

  const handleUnitPositionsUpdate = useCallback((positions: Map<number, ScreenPosition>) => {
    setUnitScreenPositions(new Map(positions));
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-background font-body">
      <div className="relative flex-grow">
        {gameState === 'end' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col justify-center items-center z-20">
            <div className="bg-card p-8 rounded-lg shadow-2xl text-center">
              <h2 className="text-5xl font-bold mb-4 text-foreground">
                {winner === 'player' ? 'Victory!' : 'Defeat!'}
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                {winner === 'player' ? 'You have vanquished the enemy forces.' : 'Your forces have been overwhelmed.'}
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
        onStartBattle={handleStartBattle}
        gameState={gameState}
      />
    </div>
  );
}
