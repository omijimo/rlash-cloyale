"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { BattlefieldCanvas } from '@/components/battlefield-canvas';
import { DeploymentPanel } from '@/components/deployment-panel';
import { DeckSelection } from '@/components/deck-selection';
import type { Unit, UnitType, GameState, Team, UnitDefinition, ScreenPosition, PlayerDeck } from '@/lib/game-types';
import { UNIT_DEFINITIONS, CARD_DEFINITIONS } from '@/lib/game-types';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { audioManager } from '@/lib/audio-manager';

const BATTLE_DURATION = 180; // 3 minutes
const MAX_ELIXIR = 10;
const ELIXIR_GENERATION_RATE = 1; // 1 elixir per second

export default function Home() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitType, setSelectedUnitType] = useState<UnitType | null>(null);
  const [gameState, setGameState] = useState<GameState>('deckSelection');
  const [winner, setWinner] = useState<Team | 'draw' | null>(null);
  const [unitScreenPositions, setUnitScreenPositions] = useState<Map<number, ScreenPosition>>(new Map());
  const [timeLeft, setTimeLeft] = useState(BATTLE_DURATION);
  const [playerDeck, setPlayerDeck] = useState<PlayerDeck>({ cards: [] });
  const [elixir, setElixir] = useState(MAX_ELIXIR);
  const enemyDeploymentCounterRef = useRef(0);

  const initializeState = useCallback(() => {
    const towerDefinition = UNIT_DEFINITIONS.tower;
    const kingTowerHp = towerDefinition.maxHp * 1.5;

    const initialUnits: Unit[] = [
      // Player towers
      { id: 0, team: 'player', ...towerDefinition, type: 'tower', position: { x: -5, y: towerDefinition.yOffset, z: 6 }, hp: towerDefinition.maxHp, targetId: null, cooldown: 0 },
      { id: 1, team: 'player', ...towerDefinition, type: 'tower', position: { x: 5, y: towerDefinition.yOffset, z: 6 }, hp: towerDefinition.maxHp, targetId: null, cooldown: 0 },
      { id: 2, team: 'player', ...towerDefinition, type: 'tower', position: { x: 0, y: towerDefinition.yOffset, z: 10 }, maxHp: kingTowerHp, hp: kingTowerHp, isKingTower: true, targetId: null, cooldown: 0 },
      // Enemy towers
      { id: 3, team: 'enemy', ...towerDefinition, type: 'tower', position: { x: -5, y: towerDefinition.yOffset, z: -6 }, hp: towerDefinition.maxHp, targetId: null, cooldown: 0 },
      { id: 4, team: 'enemy', ...towerDefinition, type: 'tower', position: { x: 5, y: towerDefinition.yOffset, z: -6 }, hp: towerDefinition.maxHp, targetId: null, cooldown: 0 },
      { id: 5, team: 'enemy', ...towerDefinition, type: 'tower', position: { x: 0, y: towerDefinition.yOffset, z: -10 }, maxHp: kingTowerHp, hp: kingTowerHp, isKingTower: true, targetId: null, cooldown: 0 },
    ];
    
    setUnits(initialUnits);
    setSelectedUnitType(null);
    setGameState('deployment');
    setUnitScreenPositions(new Map());
    setWinner(null);
    setTimeLeft(BATTLE_DURATION);
    setElixir(MAX_ELIXIR);
    enemyDeploymentCounterRef.current = 0;
  }, []);

  const handleDeckConfirmed = useCallback((deck: PlayerDeck) => {
    setPlayerDeck(deck);
    initializeState();
    audioManager.playBackgroundMusic();
  }, [initializeState]);

  useEffect(() => {
    // Start with deck selection
    setGameState('deckSelection');
  }, []);
  
  const handleDeployUnit = useCallback((point: THREE.Vector3) => {
    if (gameState === 'end' || !selectedUnitType) return;
    
    // Player can only deploy on their side of the field
    if (point.z < 0) return;

    const cardDef = CARD_DEFINITIONS[selectedUnitType];
    if (elixir < cardDef.elixirCost) return; // Can't afford the card

    let latestId = units.reduce((maxId, unit) => Math.max(unit.id, maxId), 0);
    const newUnitsToDeploy: Unit[] = [];

    // Handle spells differently
    if (cardDef.isSpell) {
      handleSpellCast(selectedUnitType, point);
      setElixir(prev => prev - cardDef.elixirCost);
      setSelectedUnitType(null);
      audioManager.playSoundEffect('spell');
      return;
    }

    // Handle units with spawn counts (like archers, skeletons, etc.)
    const spawnCount = cardDef.spawnCount || 1;
    const definition = UNIT_DEFINITIONS[selectedUnitType];
    
    for (let i = 0; i < spawnCount; i++) {
      const offsetX = spawnCount > 1 ? (i - (spawnCount - 1) / 2) * 0.8 : 0;
      const offsetZ = spawnCount > 3 ? Math.floor(i / 2) * 0.8 : 0;
      
      newUnitsToDeploy.push({
        id: ++latestId,
        team: 'player',
        ...definition,
        type: selectedUnitType,
        position: { 
          x: point.x + offsetX, 
          y: definition.yOffset, 
          z: point.z + offsetZ 
        },
        hp: definition.maxHp,
        targetId: null,
        cooldown: 0,
      });
    }

    if (newUnitsToDeploy.length === 0) return;

    // Deduct elixir cost
    setElixir(prev => prev - cardDef.elixirCost);
    audioManager.playSoundEffect('deploy');

    if (gameState === 'deployment') {
      // This is the first deployment, start battle and add enemies
      setGameState('battle');
      const enemyUnits: Unit[] = [
        { id: ++latestId, team: 'enemy', ...UNIT_DEFINITIONS.knight, type: 'knight', position: { x: -2, y: UNIT_DEFINITIONS.knight.yOffset, z: -8 }, hp: UNIT_DEFINITIONS.knight.maxHp, targetId: null, cooldown: 0 },
        { id: ++latestId, team: 'enemy', ...UNIT_DEFINITIONS.knight, type: 'knight', position: { x: 2, y: UNIT_DEFINITIONS.knight.yOffset, z: -8 }, hp: UNIT_DEFINITIONS.knight.maxHp, targetId: null, cooldown: 0 },
      ];
      setUnits(prev => [...prev, ...newUnitsToDeploy, ...enemyUnits]);
    } else {
      // Battle already started, just add the new units
      setUnits(prevUnits => [...prevUnits, ...newUnitsToDeploy]);
    }
    
    setSelectedUnitType(null);
  }, [gameState, selectedUnitType, units, elixir]);

  const handleSpellCast = (spellType: UnitType, point: THREE.Vector3) => {
    const spellDef = UNIT_DEFINITIONS[spellType];
    const splashRadius = spellDef.splashRadius || 2;
    
    // Find all units in range
    const affectedUnits = units.filter(unit => {
      const distance = Math.sqrt(
        Math.pow(unit.position.x - point.x, 2) + 
        Math.pow(unit.position.z - point.z, 2)
      );
      return distance <= splashRadius && unit.team === 'enemy';
    });

    // Apply damage
    setUnits(prevUnits => 
      prevUnits.map(unit => {
        if (affectedUnits.find(affected => affected.id === unit.id)) {
          return { ...unit, hp: Math.max(0, unit.hp - spellDef.attackDamage) };
        }
        return unit;
      })
    );
  };

  const handleRestart = () => {
    setGameState('deckSelection');
    audioManager.stopBackgroundMusic();
  };
  
  const checkTimeUpWinner = useCallback(() => {
    setUnits(currentUnits => {
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
      audioManager.stopBackgroundMusic();
      audioManager.playSoundEffect(result === 'player' ? 'victory' : 'defeat');
      return currentUnits;
    });
  }, []);

  // Elixir generation effect
  useEffect(() => {
    if (gameState !== 'battle' || winner) return;

    const elixirTimer = setInterval(() => {
      setElixir(prev => Math.min(MAX_ELIXIR, prev + ELIXIR_GENERATION_RATE / 10)); // 0.1 elixir per 100ms
    }, 100);

    return () => clearInterval(elixirTimer);
  }, [gameState, winner]);

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
      audioManager.stopBackgroundMusic();
      audioManager.playSoundEffect(result === 'player' ? 'victory' : 'defeat');
    };

    const simulationInterval = setInterval(() => {
        setUnits(currentUnits => {
            if (gameState !== 'battle' || winner) {
              return currentUnits;
            }
            
            let newUnits = [...currentUnits];
            enemyDeploymentCounterRef.current += 1;

            // Enemy AI - deploy units more intelligently
            if (enemyDeploymentCounterRef.current >= 150) { // Every 15 seconds
                enemyDeploymentCounterRef.current = 0;
                let latestId = newUnits.reduce((maxId, unit) => Math.max(unit.id, maxId), 0);
                
                // Choose enemy units based on player's deck
                const enemyUnitTypes: UnitType[] = ['knight', 'archer', 'giant', 'wizard', 'dragon', 'hogRider', 'cannon'];
                const randomTypes = enemyUnitTypes.sort(() => Math.random() - 0.5).slice(0, 2);
                
                randomTypes.forEach(unitType => {
                  const definition = UNIT_DEFINITIONS[unitType];
                  const spawnX = (Math.random() * 8) - 4;
                  const spawnZ = -8;

                  if (unitType === 'archer') {
                    // Deploy archers in pairs
                    for (let i = 0; i < 2; i++) {
                      newUnits.push({ 
                        id: ++latestId, 
                        team: 'enemy', 
                        ...definition, 
                        type: 'archer', 
                        position: { x: spawnX + (i - 0.5) * 0.8, y: definition.yOffset, z: spawnZ }, 
                        hp: definition.maxHp, 
                        targetId: null, 
                        cooldown: 0 
                      });
                    }
                  } else {
                    newUnits.push({ 
                      id: ++latestId, 
                      team: 'enemy', 
                      ...definition, 
                      type: unitType, 
                      position: { x: spawnX, y: definition.yOffset, z: spawnZ }, 
                      hp: definition.maxHp, 
                      targetId: null, 
                      cooldown: 0 
                    });
                  }
                });
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
                // Check if this unit can target the potential target
                const canTarget = canUnitTarget(unit, target);
                if (!canTarget) continue;
                
                const targetPos = new THREE.Vector3(target.position.x, target.position.y, target.position.z);
                const distance = unitPos.distanceTo(targetPos);
                if (distance < minDistance) {
                  minDistance = distance;
                  closestTarget = target;
                }
              }
              return closestTarget;
            };

            const canUnitTarget = (attacker: Unit, target: Unit): boolean => {
              const attackerDef = UNIT_DEFINITIONS[attacker.type];
              const targetDef = UNIT_DEFINITIONS[target.type];
              
              if (attackerDef.targetType === 'ground') {
                return !targetDef.isFlying;
              } else if (attackerDef.targetType === 'air') {
                return !!targetDef.isFlying;
              } else { // 'both'
                return true;
              }
            };

            const unitMap = new Map(aliveUnits.map(u => [u.id, u]));

            const damageEvents: { id: number, damage: number, attacker: Unit }[] = [];
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
                if (targetFromMap && canUnitTarget(newUnit, targetFromMap)) {
                  const unitPos = new THREE.Vector3(newUnit.position.x, newUnit.position.y, newUnit.position.z);
                  const targetPos = new THREE.Vector3(targetFromMap.position.x, targetFromMap.position.y, targetFromMap.position.z);
                  if (unitPos.distanceTo(targetPos) <= newUnit.detectionRange) {
                    currentTarget = targetFromMap;
                  } else {
                    newUnit.targetId = null; // Target is out of range
                  }
                } else {
                  newUnit.targetId = null; // Target is dead or can't be targeted
                }
              }

              // 2. If no valid target, find a new one
              if (!currentTarget) {
                let potentialTargets = allEnemyUnits;
                
                // Special targeting for hog riders and similar units
                if (newUnit.type === 'hogRider') {
                  potentialTargets = allEnemyUnits.filter(u => u.isBuilding);
                }
                
                const closestTarget = findClosestTargetInRange(newUnit, potentialTargets, newUnit.detectionRange);
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
                  damageEvents.push({ id: currentTarget.id, damage: newUnit.attackDamage, attacker: newUnit });
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
                      damageEvents.push({ id: pathTarget.id, damage: newUnit.attackDamage, attacker: newUnit });
                      newUnit.cooldown = newUnit.attackSpeed;
                    }
                }
              }
              return newUnit;
            });

            // Apply all damage events
            damageEvents.forEach(({ id, damage, attacker }) => {
              const target = updatedUnits.find(u => u.id === id);
              if (target) {
                target.hp -= damage;
                
                // Play appropriate sound effects
                if (target.hp <= 0) {
                  if (target.isBuilding) {
                    audioManager.playSoundEffect('destroy');
                  } else {
                    audioManager.playSoundEffect('damage');
                  }
                } else if (target.isBuilding) {
                  audioManager.playSoundEffect('tower_hit');
                } else {
                  audioManager.playSoundEffect('attack');
                }
                
                // Handle splash damage
                const attackerDef = UNIT_DEFINITIONS[attacker.type];
                if (attackerDef.splashRadius && attackerDef.splashRadius > 0) {
                  const targetPos = new THREE.Vector3(target.position.x, target.position.y, target.position.z);
                  updatedUnits.forEach(unit => {
                    if (unit.id !== target.id && unit.team === target.team) {
                      const unitPos = new THREE.Vector3(unit.position.x, unit.position.y, unit.position.z);
                      const distance = targetPos.distanceTo(unitPos);
                      if (distance <= attackerDef.splashRadius!) {
                        unit.hp -= damage * 0.5; // Reduced splash damage
                      }
                    }
                  });
                }
              }
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
        return { title: 'Victory!', description: 'Excellent strategy! You destroyed the enemy King Tower!' };
      case 'enemy':
        return { title: 'Defeat!', description: 'Your towers have fallen. Build a better deck and try again!' };
      case 'draw':
        return { title: 'Stalemate!', description: 'The battle ends in a draw. Both armies fought valiantly!' };
      default:
        return { title: '', description: '' };
    }
  };
  
  const { title, description } = getEndGameMessage();

  if (gameState === 'deckSelection') {
    return <DeckSelection onDeckConfirmed={handleDeckConfirmed} />;
  }

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
                New Battle!
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
        playerDeck={playerDeck}
        elixir={elixir}
        maxElixir={MAX_ELIXIR}
      />
    </div>
  );
}
