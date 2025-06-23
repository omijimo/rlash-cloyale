export type UnitType = 'knight' | 'archer' | 'tower' | 'hogRider' | 'cannon';
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
  isBuilding?: boolean;
  healthDecay?: number; // HP loss per 100 ticks (1 second)
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
    maxHp: 30,
    attackDamage: 4,
    attackRange: 4,
    detectionRange: 6,
    attackSpeed: 8, // a bit faster
    speed: 0.06,
    yOffset: 0.6,
  },
  tower: {
    type: 'tower',
    maxHp: 250,
    attackDamage: 6,
    attackRange: 5,
    detectionRange: 5,
    attackSpeed: 8, 
    speed: 0, // Towers don't move
    yOffset: 1.5, // Taller
    isBuilding: true,
  },
  hogRider: {
    type: 'hogRider',
    maxHp: 250,
    attackDamage: 25,
    attackRange: 1.5,
    detectionRange: 10,
    attackSpeed: 12,
    speed: 0.08,
    yOffset: 0.4,
  },
  cannon: {
    type: 'cannon',
    maxHp: 200,
    attackDamage: 15,
    attackRange: 7,
    detectionRange: 7,
    attackSpeed: 15, // Slower attack speed than tower
    speed: 0,
    yOffset: 0.3,
    isBuilding: true,
    healthDecay: 2, // 2 hp per second (2 / 10 ticks per second)
  },
};
