export type UnitType = 'knight' | 'archer' | 'tower';
export type Team = 'player' | 'enemy';
export type GameState = 'deployment' | 'battle' | 'end';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface ScreenPosition {
  x: number;
  y: number;
}

export interface UnitDefinition {
  type: UnitType;
  maxHp: number;
  attackDamage: number;
  attackRange: number;
  detectionRange: number;
  attackSpeed: number; // in ticks
  speed: number;
  yOffset: number;
}

export interface Unit extends UnitDefinition {
  id: number;
  team: Team;
  position: Vector3;
  hp: number;
  targetId: number | null;
  cooldown: number;
  isKingTower?: boolean;
}

export const UNIT_DEFINITIONS: Record<UnitType, UnitDefinition> = {
  knight: {
    type: 'knight',
    maxHp: 100,
    attackDamage: 10,
    attackRange: 1.5,
    detectionRange: 3,
    attackSpeed: 10, // 1 attack per second
    speed: 0.05,
    yOffset: 0.5,
  },
  archer: {
    type: 'archer',
    maxHp: 40,
    attackDamage: 5,
    attackRange: 4,
    detectionRange: 6,
    attackSpeed: 8, // a bit faster
    speed: 0.06,
    yOffset: 0.5,
  },
  tower: {
    type: 'tower',
    maxHp: 500,
    attackDamage: 10,
    attackRange: 7,
    detectionRange: 7,
    attackSpeed: 8, 
    speed: 0, // Towers don't move
    yOffset: 1.5, // Taller
  },
};
