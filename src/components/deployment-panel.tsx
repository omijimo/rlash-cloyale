"use client";

import { Swords, Crosshair, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { UnitType, GameState } from '@/lib/game-types';

interface DeploymentPanelProps {
  selectedUnitType: UnitType | null;
  onSelectUnit: (type: UnitType | null) => void;
  onStartBattle: () => void;
  gameState: GameState;
}

const unitTypes: { type: UnitType, name: string, icon: React.ReactNode }[] = [
  { type: 'warrior', name: 'Warrior', icon: <Swords className="w-8 h-8" /> },
  { type: 'archer', name: 'Archer', icon: <Crosshair className="w-8 h-8" /> },
];

export function DeploymentPanel({ selectedUnitType, onSelectUnit, onStartBattle, gameState }: DeploymentPanelProps) {
  if (gameState !== 'deployment') {
    return null;
  }

  return (
    <div className="bg-card/80 backdrop-blur-sm border-t p-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div>
          <h2 className="text-lg font-headline font-semibold mb-2 text-foreground">Deploy Your Units</h2>
          <div className="flex gap-4">
            {unitTypes.map(unit => (
              <Card 
                key={unit.type}
                onClick={() => onSelectUnit(unit.type === selectedUnitType ? null : unit.type)}
                className={cn(
                  'p-4 w-32 text-center cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105',
                  selectedUnitType === unit.type ? 'ring-2 ring-primary bg-primary/10' : 'bg-secondary'
                )}
              >
                <CardContent className="p-0 flex flex-col items-center gap-2">
                  {unit.icon}
                  <p className="font-semibold text-foreground">{unit.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <Button size="lg" onClick={onStartBattle} className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg">
          <Play className="mr-2 h-6 w-6" />
          Start Battle
        </Button>
      </div>
    </div>
  );
}
