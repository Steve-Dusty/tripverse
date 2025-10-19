'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Itinerary } from '@/lib/mock-data';
import { Clock, DollarSign, Route, Star } from 'lucide-react';

interface ItineraryCardProps {
  itinerary: Itinerary;
  isSelected: boolean;
  onSelect: () => void;
}

export function ItineraryCard({ itinerary, isSelected, onSelect }: ItineraryCardProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{itinerary.name}</CardTitle>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm font-semibold">{itinerary.score}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <div>
              <div className="text-xs text-muted-foreground">Total Cost</div>
              <div className="font-semibold">${itinerary.totalCost}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-xs text-muted-foreground">Duration</div>
              <div className="font-semibold">{formatDuration(itinerary.totalTime)}</div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Route className="h-4 w-4 text-purple-600" />
          <div>
            <span className="text-xs text-muted-foreground">Transfers: </span>
            <span className="font-semibold">{itinerary.transferCount}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {itinerary.tags.map((tag, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

