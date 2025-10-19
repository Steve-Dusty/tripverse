'use client';

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plane, Train, Bus, Car, Footprints } from 'lucide-react';

interface FilterPanelProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  maxBudget: number;
  transportModes: string[];
}

export function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [maxBudget, setMaxBudget] = useState([1000]);
  const [transportModes, setTransportModes] = useState<string[]>([
    'flight',
    'train',
    'bus',
    'car',
    'walk',
  ]);

  const handleBudgetChange = (value: number[]) => {
    setMaxBudget(value);
    onFilterChange({ maxBudget: value[0], transportModes });
  };

  const handleModeToggle = (mode: string, checked: boolean) => {
    const newModes = checked
      ? [...transportModes, mode]
      : transportModes.filter((m) => m !== mode);
    setTransportModes(newModes);
    onFilterChange({ maxBudget: maxBudget[0], transportModes: newModes });
  };

  const modes = [
    { id: 'flight', label: 'Flight', icon: Plane },
    { id: 'train', label: 'Train', icon: Train },
    { id: 'bus', label: 'Bus', icon: Bus },
    { id: 'car', label: 'Car', icon: Car },
    { id: 'walk', label: 'Walk', icon: Footprints },
  ];

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Filters</h3>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Max Budget: ${maxBudget[0]}
            </Label>
            <Slider
              value={maxBudget}
              onValueChange={handleBudgetChange}
              max={2000}
              min={100}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>$100</span>
              <span>$2,000</span>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">Transport Modes</Label>
            <div className="space-y-3">
              {modes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <div key={mode.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={mode.id}
                      checked={transportModes.includes(mode.id)}
                      onCheckedChange={(checked) =>
                        handleModeToggle(mode.id, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={mode.id}
                      className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                    >
                      <Icon className="h-4 w-4" />
                      {mode.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

