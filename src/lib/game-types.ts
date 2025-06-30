export type UnitType = 
  // Troops
  | 'knight' | 'archer' | 'giant' | 'wizard' | 'dragon' | 'barbarian' | 'goblin' 
  | 'hogRider' | 'prince' | 'minion' | 'skeleton' | 'bomber' | 'musketeer'
  | 'valkyrie' | 'balloon' | 'witch' | 'pekka' | 'minipekka' | 'royalGiant'
  // Buildings
  | 'tower' | 'cannon' | 'tesla' | 'infernoTower' | 'xbow' | 'mortar'
  // Spells
  | 'fireball' | 'arrows' | 'lightning' | 'zap' | 'rocket';

export type Team = 'player' | 'enemy';
export type GameState = 'deckSelection' | 'deployment' | 'battle' | 'end';
export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';

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
  splashRadius?: number; // For splash damage units
  isFlying?: boolean; // Flying units
  targetType?: 'ground' | 'air' | 'both'; // What they can target
}

export interface CardDefinition {
  type: UnitType;
  name: string;
  description: string;
  elixirCost: number;
  rarity: CardRarity;
  isSpell?: boolean;
  spawnCount?: number; // For cards that spawn multiple units (archers, skeletons, etc.)
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

export interface PlayerDeck {
  cards: UnitType[];
}

export const UNIT_DEFINITIONS: Record<UnitType, UnitDefinition> = {
  // Melee Troops
  knight: {
    type: 'knight',
    maxHp: 100,
    attackDamage: 10,
    attackRange: 1.5,
    detectionRange: 3,
    attackSpeed: 10,
    speed: 0.05,
    yOffset: 0.5,
    targetType: 'ground',
  },
  giant: {
    type: 'giant',
    maxHp: 300,
    attackDamage: 20,
    attackRange: 1.5,
    detectionRange: 3,
    attackSpeed: 15,
    speed: 0.03,
    yOffset: 1.2,
    targetType: 'ground',
  },
  prince: {
    type: 'prince',
    maxHp: 150,
    attackDamage: 30,
    attackRange: 2,
    detectionRange: 4,
    attackSpeed: 12,
    speed: 0.08,
    yOffset: 0.7,
    targetType: 'ground',
  },
  pekka: {
    type: 'pekka',
    maxHp: 350,
    attackDamage: 50,
    attackRange: 1.5,
    detectionRange: 3,
    attackSpeed: 20,
    speed: 0.02,
    yOffset: 1.5,
    targetType: 'ground',
  },
  minipekka: {
    type: 'minipekka',
    maxHp: 120,
    attackDamage: 35,
    attackRange: 1.5,
    detectionRange: 3,
    attackSpeed: 12,
    speed: 0.06,
    yOffset: 0.8,
    targetType: 'ground',
  },
  barbarian: {
    type: 'barbarian',
    maxHp: 80,
    attackDamage: 15,
    attackRange: 1.5,
    detectionRange: 3,
    attackSpeed: 10,
    speed: 0.06,
    yOffset: 0.6,
    targetType: 'ground',
  },
  goblin: {
    type: 'goblin',
    maxHp: 25,
    attackDamage: 8,
    attackRange: 1.5,
    detectionRange: 3,
    attackSpeed: 8,
    speed: 0.08,
    yOffset: 0.3,
    targetType: 'ground',
  },
  skeleton: {
    type: 'skeleton',
    maxHp: 15,
    attackDamage: 6,
    attackRange: 1.5,
    detectionRange: 3,
    attackSpeed: 8,
    speed: 0.07,
    yOffset: 0.4,
    targetType: 'ground',
  },
  valkyrie: {
    type: 'valkyrie',
    maxHp: 140,
    attackDamage: 12,
    attackRange: 1.5,
    detectionRange: 3,
    attackSpeed: 12,
    speed: 0.05,
    yOffset: 0.6,
    splashRadius: 2,
    targetType: 'ground',
  },
  hogRider: {
    type: 'hogRider',
    maxHp: 200,
    attackDamage: 25,
    attackRange: 1.5,
    detectionRange: 10,
    attackSpeed: 15,
    speed: 0.1,
    yOffset: 0.4,
    targetType: 'ground',
  },
  royalGiant: {
    type: 'royalGiant',
    maxHp: 250,
    attackDamage: 30,
    attackRange: 6,
    detectionRange: 6,
    attackSpeed: 18,
    speed: 0.04,
    yOffset: 1.3,
    targetType: 'ground',
  },

  // Ranged Troops
  archer: {
    type: 'archer',
    maxHp: 30,
    attackDamage: 5,
    attackRange: 4,
    detectionRange: 6,
    attackSpeed: 8,
    speed: 0.06,
    yOffset: 0.6,
    targetType: 'both',
  },
  wizard: {
    type: 'wizard',
    maxHp: 60,
    attackDamage: 12,
    attackRange: 5,
    detectionRange: 6,
    attackSpeed: 12,
    speed: 0.05,
    yOffset: 0.7,
    splashRadius: 1.5,
    targetType: 'both',
  },
  musketeer: {
    type: 'musketeer',
    maxHp: 80,
    attackDamage: 15,
    attackRange: 6,
    detectionRange: 7,
    attackSpeed: 10,
    speed: 0.05,
    yOffset: 0.6,
    targetType: 'both',
  },
  bomber: {
    type: 'bomber',
    maxHp: 40,
    attackDamage: 18,
    attackRange: 4,
    detectionRange: 5,
    attackSpeed: 12,
    speed: 0.05,
    yOffset: 0.5,
    splashRadius: 2,
    targetType: 'ground',
  },
  witch: {
    type: 'witch',
    maxHp: 70,
    attackDamage: 8,
    attackRange: 5,
    detectionRange: 6,
    attackSpeed: 15,
    speed: 0.04,
    yOffset: 0.7,
    targetType: 'both',
  },

  // Flying Units
  dragon: {
    type: 'dragon',
    maxHp: 180,
    attackDamage: 20,
    attackRange: 3,
    detectionRange: 5,
    attackSpeed: 12,
    speed: 0.06,
    yOffset: 2,
    isFlying: true,
    splashRadius: 1.5,
    targetType: 'both',
  },
  balloon: {
    type: 'balloon',
    maxHp: 120,
    attackDamage: 40,
    attackRange: 1.5,
    detectionRange: 3,
    attackSpeed: 25,
    speed: 0.04,
    yOffset: 2.5,
    isFlying: true,
    targetType: 'ground',
  },
  minion: {
    type: 'minion',
    maxHp: 35,
    attackDamage: 8,
    attackRange: 2.5,
    detectionRange: 4,
    attackSpeed: 8,
    speed: 0.07,
    yOffset: 1.5,
    isFlying: true,
    targetType: 'both',
  },

  // Buildings
  tower: {
    type: 'tower',
    maxHp: 300,
    attackDamage: 6,
    attackRange: 5,
    detectionRange: 5,
    attackSpeed: 8,
    speed: 0,
    yOffset: 1.5,
    isBuilding: true,
    targetType: 'both',
  },
  cannon: {
    type: 'cannon',
    maxHp: 200,
    attackDamage: 15,
    attackRange: 7,
    detectionRange: 7,
    attackSpeed: 15,
    speed: 0,
    yOffset: 0.3,
    isBuilding: true,
    healthDecay: 2,
    targetType: 'ground',
  },
  tesla: {
    type: 'tesla',
    maxHp: 180,
    attackDamage: 12,
    attackRange: 5,
    detectionRange: 5,
    attackSpeed: 8,
    speed: 0,
    yOffset: 0.2,
    isBuilding: true,
    healthDecay: 1.5,
    targetType: 'both',
  },
  infernoTower: {
    type: 'infernoTower',
    maxHp: 160,
    attackDamage: 8,
    attackRange: 6,
    detectionRange: 6,
    attackSpeed: 5,
    speed: 0,
    yOffset: 1,
    isBuilding: true,
    healthDecay: 2,
    targetType: 'both',
  },
  xbow: {
    type: 'xbow',
    maxHp: 150,
    attackDamage: 20,
    attackRange: 12,
    detectionRange: 12,
    attackSpeed: 15,
    speed: 0,
    yOffset: 0.4,
    isBuilding: true,
    healthDecay: 2.5,
    targetType: 'ground',
  },
  mortar: {
    type: 'mortar',
    maxHp: 140,
    attackDamage: 25,
    attackRange: 8,
    detectionRange: 8,
    attackSpeed: 20,
    speed: 0,
    yOffset: 0.5,
    isBuilding: true,
    healthDecay: 2,
    splashRadius: 2,
    targetType: 'ground',
  },

  // Spells (placeholder definitions - spells work differently)
  fireball: {
    type: 'fireball',
    maxHp: 1,
    attackDamage: 50,
    attackRange: 0,
    detectionRange: 0,
    attackSpeed: 1,
    speed: 0,
    yOffset: 0,
    splashRadius: 2.5,
    targetType: 'both',
  },
  arrows: {
    type: 'arrows',
    maxHp: 1,
    attackDamage: 20,
    attackRange: 0,
    detectionRange: 0,
    attackSpeed: 1,
    speed: 0,
    yOffset: 0,
    splashRadius: 3,
    targetType: 'both',
  },
  lightning: {
    type: 'lightning',
    maxHp: 1,
    attackDamage: 80,
    attackRange: 0,
    detectionRange: 0,
    attackSpeed: 1,
    speed: 0,
    yOffset: 0,
    targetType: 'both',
  },
  zap: {
    type: 'zap',
    maxHp: 1,
    attackDamage: 15,
    attackRange: 0,
    detectionRange: 0,
    attackSpeed: 1,
    speed: 0,
    yOffset: 0,
    splashRadius: 2,
    targetType: 'both',
  },
  rocket: {
    type: 'rocket',
    maxHp: 1,
    attackDamage: 100,
    attackRange: 0,
    detectionRange: 0,
    attackSpeed: 1,
    speed: 0,
    yOffset: 0,
    splashRadius: 2,
    targetType: 'both',
  },
};

export const CARD_DEFINITIONS: Record<UnitType, CardDefinition> = {
  // Common Cards (1-3 elixir)
  skeleton: { type: 'skeleton', name: 'Skeletons', description: 'Fast, cheap swarm unit', elixirCost: 1, rarity: 'common', spawnCount: 4 },
  goblin: { type: 'goblin', name: 'Goblins', description: 'Fast, cheap melee units', elixirCost: 2, rarity: 'common', spawnCount: 3 },
  archer: { type: 'archer', name: 'Archers', description: 'Ranged ground and air targeting units', elixirCost: 3, rarity: 'common', spawnCount: 2 },
  knight: { type: 'knight', name: 'Knight', description: 'Tanky melee unit with good damage', elixirCost: 3, rarity: 'common' },
  barbarian: { type: 'barbarian', name: 'Barbarians', description: 'Strong melee fighters', elixirCost: 4, rarity: 'common', spawnCount: 4 },
  minion: { type: 'minion', name: 'Minions', description: 'Flying units that target ground and air', elixirCost: 3, rarity: 'common', spawnCount: 3 },
  cannon: { type: 'cannon', name: 'Cannon', description: 'Defensive building targeting ground units', elixirCost: 3, rarity: 'common' },
  bomber: { type: 'bomber', name: 'Bomber', description: 'Area damage against ground troops', elixirCost: 2, rarity: 'common' },
  
  // Rare Cards (3-5 elixir)
  musketeer: { type: 'musketeer', name: 'Musketeer', description: 'Long range ground and air targeting', elixirCost: 4, rarity: 'rare' },
  wizard: { type: 'wizard', name: 'Wizard', description: 'Area damage dealer', elixirCost: 5, rarity: 'rare' },
  giant: { type: 'giant', name: 'Giant', description: 'High HP tank unit', elixirCost: 5, rarity: 'rare' },
  hogRider: { type: 'hogRider', name: 'Hog Rider', description: 'Fast building-targeting unit', elixirCost: 4, rarity: 'rare' },
  valkyrie: { type: 'valkyrie', name: 'Valkyrie', description: '360° splash damage', elixirCost: 4, rarity: 'rare' },
  tesla: { type: 'tesla', name: 'Tesla', description: 'Hidden defensive building', elixirCost: 4, rarity: 'rare' },
  fireball: { type: 'fireball', name: 'Fireball', description: 'Area damage spell', elixirCost: 4, rarity: 'rare', isSpell: true },
  
  // Epic Cards (4-7 elixir)
  prince: { type: 'prince', name: 'Prince', description: 'Charge attack with high damage', elixirCost: 5, rarity: 'epic' },
  witch: { type: 'witch', name: 'Witch', description: 'Spawns skeletons while attacking', elixirCost: 5, rarity: 'epic' },
  balloon: { type: 'balloon', name: 'Balloon', description: 'Flying building-targeting unit', elixirCost: 5, rarity: 'epic' },
  xbow: { type: 'xbow', name: 'X-Bow', description: 'Long range siege building', elixirCost: 6, rarity: 'epic' },
  infernoTower: { type: 'infernoTower', name: 'Inferno Tower', description: 'Increasing damage over time', elixirCost: 5, rarity: 'epic' },
  lightning: { type: 'lightning', name: 'Lightning', description: 'High damage to 3 targets', elixirCost: 6, rarity: 'epic', isSpell: true },
  rocket: { type: 'rocket', name: 'Rocket', description: 'Highest damage spell', elixirCost: 6, rarity: 'epic', isSpell: true },
  
  // Legendary Cards (6-9 elixir)
  pekka: { type: 'pekka', name: 'P.E.K.K.A', description: 'Armored melee powerhouse', elixirCost: 7, rarity: 'legendary' },
  dragon: { type: 'dragon', name: 'Baby Dragon', description: 'Flying splash damage dealer', elixirCost: 4, rarity: 'legendary' },
  minipekka: { type: 'minipekka', name: 'Mini P.E.K.K.A', description: 'High damage armored unit', elixirCost: 4, rarity: 'legendary' },
  royalGiant: { type: 'royalGiant', name: 'Royal Giant', description: 'Long range giant', elixirCost: 6, rarity: 'legendary' },
  
  // Special
  tower: { type: 'tower', name: 'Tower', description: 'Defensive structure', elixirCost: 0, rarity: 'common' },
  mortar: { type: 'mortar', name: 'Mortar', description: 'Siege building with splash damage', elixirCost: 4, rarity: 'common' },
  arrows: { type: 'arrows', name: 'Arrows', description: 'Area damage spell', elixirCost: 3, rarity: 'common', isSpell: true },
  zap: { type: 'zap', name: 'Zap', description: 'Instant damage and stun', elixirCost: 2, rarity: 'common', isSpell: true },
};
