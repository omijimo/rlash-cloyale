"use client";

import { Swords, Crosshair, Hammer, Factory, Zap, Shield, Target, Crown, Wand2, Flame, ArrowUp, Eye, Bomb, Skull, Volume2, VolumeX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UnitType, GameState, PlayerDeck } from '@/lib/game-types';
import { CARD_DEFINITIONS } from '@/lib/game-types';
import { audioManager } from '@/lib/audio-manager';

interface DeploymentPanelProps {
  selectedUnitType: UnitType | null;
  onSelectUnit: (type: UnitType | null) => void;
  gameState: GameState;
  playerDeck: PlayerDeck;
  elixir: number;
  maxElixir: number;
}

const getCardIcon = (type: UnitType) => {
  const iconMap: Record<UnitType, React.ReactNode> = {
    // Melee troops
    knight: <Swords className="w-6 h-6" />,
    giant: <Shield className="w-6 h-6" />,
    prince: <Crown className="w-6 h-6" />,
    pekka: <Shield className="w-6 h-6" />,
    minipekka: <Swords className="w-6 h-6" />,
    barbarian: <Swords className="w-6 h-6" />,
    goblin: <Swords className="w-6 h-6" />,
    skeleton: <Skull className="w-6 h-6" />,
    valkyrie: <Swords className="w-6 h-6" />,
    hogRider: <Hammer className="w-6 h-6" />,
    royalGiant: <Shield className="w-6 h-6" />,
    
    // Ranged troops
    archer: <Crosshair className="w-6 h-6" />,
    wizard: <Wand2 className="w-6 h-6" />,
    musketeer: <Target className="w-6 h-6" />,
    bomber: <Bomb className="w-6 h-6" />,
    witch: <Wand2 className="w-6 h-6" />,
    
    // Flying units
    dragon: <Eye className="w-6 h-6" />,
    balloon: <ArrowUp className="w-6 h-6" />,
    minion: <Eye className="w-6 h-6" />,
    
    // Buildings
    tower: <Factory className="w-6 h-6" />,
    cannon: <Factory className="w-6 h-6" />,
    tesla: <Zap className="w-6 h-6" />,
    infernoTower: <Flame className="w-6 h-6" />,
    xbow: <Target className="w-6 h-6" />,
    mortar: <Factory className="w-6 h-6" />,
    
    // Spells
    fireball: <Flame className="w-6 h-6" />,
    arrows: <Crosshair className="w-6 h-6" />,
    lightning: <Zap className="w-6 h-6" />,
    zap: <Zap className="w-6 h-6" />,
    rocket: <ArrowUp className="w-6 h-6" />,
  };
  
  return iconMap[type] || <Swords className="w-6 h-6" />;
};

const getElixirColor = (cost: number) => {
  if (cost <= 2) return 'text-green-400';
  if (cost <= 4) return 'text-yellow-400';
  if (cost <= 6) return 'text-orange-400';
  return 'text-red-400';
};

export function DeploymentPanel({ 
  selectedUnitType, 
  onSelectUnit, 
  gameState, 
  playerDeck, 
  elixir, 
  maxElixir 
}: DeploymentPanelProps) {
  if (gameState === 'end' || gameState === 'deckSelection') {
    return null;
  }

  const handleCardSelect = (cardType: UnitType) => {
    const cardDef = CARD_DEFINITIONS[cardType];
    if (elixir >= cardDef.elixirCost) {
      audioManager.playSoundEffect('card_select');
      onSelectUnit(cardType === selectedUnitType ? null : cardType);
    }
  };

  const handleMuteToggle = () => {
    audioManager.toggleMute();
  };

  return (
    <div className="bg-gradient-to-t from-indigo-900/95 via-purple-900/90 to-blue-900/85 backdrop-blur-sm border-t-2 border-purple-400/50 p-4 shadow-2xl">
      <div className="container mx-auto">
        {/* Elixir Bar */}
        <div className="flex items-center justify-center mb-4">
          <div className="bg-black/40 rounded-full p-2 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-purple-400" />
              <div className="text-white font-bold text-lg">
                {Math.floor(elixir)}/{maxElixir}
              </div>
            </div>
            <div className="w-48 h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${(elixir / maxElixir) * 100}%` }}
              />
            </div>
            <Button
              onClick={handleMuteToggle}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              {audioManager.isMusicMuted() ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Card Hand */}
        <div className="flex justify-center">
          <div className="flex gap-3">
            {playerDeck.cards.map((cardType, index) => {
              const cardDef = CARD_DEFINITIONS[cardType];
              const isSelected = selectedUnitType === cardType;
              const canAfford = elixir >= cardDef.elixirCost;
              const isPlayable = gameState === 'battle' || gameState === 'deployment';
              
              return (
                <Card 
                  key={`${cardType}-${index}`}
                  onClick={() => isPlayable && handleCardSelect(cardType)}
                  className={cn(
                    'relative w-20 h-28 transition-all duration-200 cursor-pointer overflow-hidden',
                    'bg-gradient-to-b from-blue-600 to-blue-800 border-2',
                    isSelected 
                      ? 'ring-4 ring-yellow-400 border-yellow-400 scale-110 shadow-lg shadow-yellow-400/50' 
                      : canAfford && isPlayable
                        ? 'border-blue-400 hover:scale-105 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-400/30'
                        : 'border-gray-500 opacity-60 cursor-not-allowed',
                    !canAfford && 'grayscale'
                  )}
                >
                  <CardContent className="p-2 h-full flex flex-col items-center justify-between">
                    {/* Elixir Cost */}
                    <div className={cn(
                      "absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                      canAfford ? 'bg-purple-500' : 'bg-gray-500'
                    )}>
                      {cardDef.elixirCost}
                    </div>
                    
                    {/* Card Icon */}
                    <div className="flex-1 flex items-center justify-center text-white">
                      {getCardIcon(cardType)}
                    </div>
                    
                    {/* Card Name */}
                    <div className="text-white text-xs font-semibold text-center leading-tight">
                      {cardDef.name}
                    </div>
                    
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-yellow-400/20 border-2 border-yellow-400 rounded pointer-events-none">
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                          <div className="bg-yellow-400 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                            ✓
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Not Affordable Overlay */}
                    {!canAfford && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="text-red-400 text-xs font-bold">
                          {cardDef.elixirCost - Math.floor(elixir)}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
        
        {/* Gameplay Hint */}
        {gameState === 'deployment' && (
          <div className="text-center mt-3">
            <p className="text-purple-200 text-sm">
              Select a card and deploy it on your side of the battlefield!
            </p>
          </div>
        )}
        
        {selectedUnitType && (
          <div className="text-center mt-2">
            <p className="text-yellow-300 text-sm">
              {CARD_DEFINITIONS[selectedUnitType].name} selected - Click to deploy!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
