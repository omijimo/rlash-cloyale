"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PlayCircle, Star, Zap, Shield, Sword, Target, Hammer, Factory, Crosshair, Swords, Crown, Wand2, Flame, ArrowUp, Eye, Bomb, Skull, Heart, Users } from 'lucide-react';
import type { UnitType, PlayerDeck, CardRarity } from '@/lib/game-types';
import { CARD_DEFINITIONS } from '@/lib/game-types';

interface DeckSelectionProps {
  onDeckConfirmed: (deck: PlayerDeck) => void;
}

const getCardIcon = (type: UnitType) => {
  const iconMap: Record<UnitType, React.ReactNode> = {
    // Melee troops
    knight: <Swords className="w-6 h-6" />,
    giant: <Shield className="w-6 h-6" />,
    prince: <Crown className="w-6 h-6" />,
    pekka: <Shield className="w-6 h-6" />,
    minipekka: <Sword className="w-6 h-6" />,
    barbarian: <Swords className="w-6 h-6" />,
    goblin: <Sword className="w-6 h-6" />,
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

const getRarityColor = (rarity: CardRarity) => {
  const colorMap: Record<CardRarity, string> = {
    common: 'bg-gray-500',
    rare: 'bg-orange-500',
    epic: 'bg-purple-500',
    legendary: 'bg-yellow-500',
  };
  return colorMap[rarity];
};

const getElixirColor = (cost: number) => {
  if (cost <= 2) return 'text-green-400';
  if (cost <= 4) return 'text-yellow-400';
  if (cost <= 6) return 'text-orange-400';
  return 'text-red-400';
};

export function DeckSelection({ onDeckConfirmed }: DeckSelectionProps) {
  const [selectedCards, setSelectedCards] = useState<UnitType[]>([]);

  // Get all available cards (excluding tower)
  const availableCards = Object.values(CARD_DEFINITIONS).filter((card: any) => card.type !== 'tower');

  const handleCardClick = (cardType: UnitType) => {
    if (selectedCards.includes(cardType)) {
      // Remove card from deck
      setSelectedCards((prev: UnitType[]) => prev.filter((card: UnitType) => card !== cardType));
    } else if (selectedCards.length < 8) {
      // Add card to deck
      setSelectedCards((prev: UnitType[]) => [...prev, cardType]);
    }
  };

  const handleConfirmDeck = () => {
    if (selectedCards.length === 8) {
      onDeckConfirmed({ cards: selectedCards });
    }
  };

  const handleQuickStart = () => {
    // Quick start with a balanced deck
    const quickDeck: UnitType[] = [
      'knight', 'archer', 'giant', 'wizard', 
      'fireball', 'cannon', 'hogRider', 'musketeer'
    ];
    onDeckConfirmed({ cards: quickDeck });
  };

  const totalElixirCost = selectedCards.reduce((total: number, cardType: UnitType) => {
    return total + (CARD_DEFINITIONS as any)[cardType].elixirCost;
  }, 0);

  const avgElixirCost = selectedCards.length > 0 ? (totalElixirCost / selectedCards.length).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 font-headline">
            Build Your Deck
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            Choose 8 cards to create your battle deck
          </p>
          <div className="flex justify-center items-center gap-6 mb-6">
            <div className="bg-black/40 px-4 py-2 rounded-lg">
              <span className="text-white">Cards Selected: </span>
              <span className={cn(
                "font-bold text-xl",
                selectedCards.length === 8 ? "text-green-400" : "text-yellow-400"
              )}>
                {selectedCards.length}/8
              </span>
            </div>
            <div className="bg-black/40 px-4 py-2 rounded-lg">
              <span className="text-white">Avg Elixir: </span>
              <span className={cn("font-bold text-xl", getElixirColor(parseFloat(avgElixirCost)))}>
                {avgElixirCost}
              </span>
            </div>
          </div>
        </div>

        {/* Selected Deck Preview */}
        {selectedCards.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Your Deck</h2>
            <div className="flex justify-center">
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2 bg-black/30 p-4 rounded-lg">
                {Array.from({ length: 8 }).map((_, index) => {
                  const cardType = selectedCards[index];
                  const card = cardType ? CARD_DEFINITIONS[cardType] : null;
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        "w-16 h-20 rounded border-2 flex flex-col items-center justify-center text-xs",
                        card 
                          ? "bg-gradient-to-b from-blue-600 to-blue-800 border-blue-400" 
                          : "bg-gray-600 border-gray-500 border-dashed"
                      )}
                    >
                      {card ? (
                        <>
                          <div className="flex items-center justify-center mb-1">
                            {getCardIcon(cardType!)}
                          </div>
                          <div className={cn("font-bold", getElixirColor(card.elixirCost))}>
                            {card.elixirCost}
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-400 text-center">
                          <div className="text-2xl">+</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            onClick={handleQuickStart}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
          >
            <PlayCircle className="mr-2 h-6 w-6" />
            Quick Start
          </Button>
          <Button
            onClick={handleConfirmDeck}
            disabled={selectedCards.length !== 8}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-8 py-3 text-lg"
          >
            <Sword className="mr-2 h-6 w-6" />
            Battle! ({selectedCards.length}/8)
          </Button>
        </div>

        {/* Card Collection */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {availableCards.map((card) => {
            const isSelected = selectedCards.includes(card.type);
            const canSelect = !isSelected && selectedCards.length < 8;
            
            return (
              <Card
                key={card.type}
                onClick={() => handleCardClick(card.type)}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg",
                  isSelected 
                    ? "ring-4 ring-green-400 bg-green-50 border-green-400" 
                    : canSelect 
                      ? "hover:ring-2 hover:ring-blue-400 bg-white" 
                      : "opacity-50 cursor-not-allowed bg-gray-100",
                  "relative overflow-hidden"
                )}
              >
                {/* Rarity indicator */}
                <div className={cn(
                  "absolute top-0 left-0 w-full h-1",
                  getRarityColor(card.rarity)
                )} />
                
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCardIcon(card.type)}
                      <div className={cn(
                        "text-2xl font-bold rounded-full w-8 h-8 flex items-center justify-center text-white",
                        getElixirColor(card.elixirCost).includes('green') ? 'bg-green-500' :
                        getElixirColor(card.elixirCost).includes('yellow') ? 'bg-yellow-500' :
                        getElixirColor(card.elixirCost).includes('orange') ? 'bg-orange-500' : 'bg-red-500'
                      )}>
                        {card.elixirCost}
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-xs", getRarityColor(card.rarity), "text-white border-0")}>
                      {card.rarity}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{card.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 mb-2">{card.description}</p>
                  {card.spawnCount && (
                    <div className="flex items-center text-xs text-blue-600">
                      <Users className="w-3 h-3 mr-1" />
                      Spawns {card.spawnCount}
                    </div>
                  )}
                  {card.isSpell && (
                    <div className="flex items-center text-xs text-purple-600">
                      <Wand2 className="w-3 h-3 mr-1" />
                      Spell
                    </div>
                  )}
                </CardContent>
                
                {isSelected && (
                  <div className="absolute inset-0 bg-green-400/20 flex items-center justify-center">
                    <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      ✓
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}