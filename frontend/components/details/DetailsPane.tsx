'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Stay, LivingInfo, Document, Itinerary } from '@/lib/mock-data';
import {
  Hotel,
  MapPin,
  Star,
  Home,
  Clock,
} from 'lucide-react';

interface DetailsPaneProps {
  selectedItinerary?: Itinerary;
  stays: Stay[];
  livingInfo: LivingInfo;
  documents?: Document[];
}

export function DetailsPane({
  selectedItinerary,
  stays,
  livingInfo,
  documents,
}: DetailsPaneProps) {
  return (
    <Tabs defaultValue="itinerary" className="h-full flex flex-col" style={{ backgroundColor: 'hsl(217 28% 16%)' }}>
      <div className="px-4 pt-4 pb-2">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
          <TabsTrigger value="stays">Stays</TabsTrigger>
          <TabsTrigger value="living">Living</TabsTrigger>
        </TabsList>
      </div>

      <div className="flex-1 overflow-y-auto">
        <TabsContent value="itinerary" className="p-4 space-y-3">
          {selectedItinerary ? (
            <>
              <div className="bg-secondary border-2 border-border rounded-lg p-4 shadow-lg">
                <h3 className="font-semibold text-lg mb-2 text-primary drop-shadow-md">
                  {selectedItinerary.name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="text-green-400 font-semibold">${selectedItinerary.totalCost}</span>
                  <span>•</span>
                  <span>{Math.floor(selectedItinerary.totalTime / 60)}h {selectedItinerary.totalTime % 60}m</span>
                  <span>•</span>
                  <span>{selectedItinerary.transferCount} transfers</span>
                </div>
              </div>
              
              {selectedItinerary.legs.map((leg, idx) => (
                <Card key={leg.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="font-medium text-foreground">
                        Leg {idx + 1}: {leg.from} → {leg.to}
                      </div>
                      <Badge variant="secondary">{leg.mode}</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2 bg-secondary rounded-lg p-2 border border-border/50">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs">
                          {new Date(leg.departureTime).toLocaleString()} →{' '}
                          {new Date(leg.arrivalTime).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Provider: <span className="text-foreground">{leg.provider}</span></span>
                        <span className="text-green-400 font-semibold">${leg.cost}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <div className="text-center text-muted-foreground py-12 bg-secondary rounded-lg border border-border">
              Select an itinerary to view details
            </div>
          )}
        </TabsContent>

        <TabsContent value="stays" className="p-4 space-y-3">
          {stays.map((stay) => (
            <Card key={stay.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      <Hotel className="h-4 w-4" />
                      {stay.name}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {stay.location}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-semibold">{stay.rating}</span>
                  </div>
                </div>
                <div className="space-y-2 mt-3">
                  <div className="text-sm">
                    <span className="font-medium">${stay.pricePerNight}</span> / night ×{' '}
                    {stay.nights} nights ={' '}
                    <span className="text-green-600 font-semibold">
                      ${stay.pricePerNight * stay.nights}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {stay.amenities.map((amenity, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="living" className="p-4 space-y-4">
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-primary">
              <Home className="h-5 w-5" />
              Neighborhoods
            </h4>
            {livingInfo.neighborhoods.map((neighborhood, idx) => (
              <Card key={idx} className="mb-3">
                <CardContent className="pt-4">
                  <div className="font-medium text-lg">{neighborhood.name}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {neighborhood.description}
                  </p>
                  <div className="mt-3">
                    <Badge variant="default">Safety: {neighborhood.safety}/10</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-primary">
              <Home className="h-5 w-5" />
              Local Essentials
            </h4>
            {livingInfo.essentials.map((essential, idx) => (
              <Card key={idx} className="mb-3">
                <CardContent className="pt-4">
                  <div className="font-medium mb-2">{essential.category}</div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {essential.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

      </div>
    </Tabs>
  );
}

