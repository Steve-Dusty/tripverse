'use client';

import { useEffect, useState } from 'react';
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
  const [itineraries, setItineraries] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchLatest = async () => {
      try {
        const res = await fetch('http://localhost:8000/itinerary/latest');
        if (res.status === 204) return;
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        const list = Array.isArray(json) ? json : [json];
        setItineraries(list);
      } catch {}
    };
    fetchLatest();
    const id = setInterval(fetchLatest, 3000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

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
        <TabsContent value="itinerary" className="p-4 space-y-6">
          {itineraries.length > 0 && itineraries.some(it => it && Object.keys(it).length > 0) ? (
            itineraries.map((it, idx) => {
              const legs = it.legs || [];
              const summary = it.summary || {};
              const totalMinutes = summary.total_duration_minutes ?? legs.reduce((acc: number, l: any) => acc + (l.duration_minutes || 0), 0);
              const totalMiles = summary.total_distance_miles ?? legs.reduce((acc: number, l: any) => acc + (l.distance_miles || 0), 0);
              const totalDays = Math.ceil(totalMinutes / (24 * 60));
              
              return (
                <div key={idx} className="space-y-6">
                  {/* Hero Summary Card */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-2xl text-gray-800">Your Amazing Journey</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                          <Clock className="h-4 w-4 text-blue-600" />
                          {Math.floor(totalMinutes / 60)}h {Math.round(totalMinutes % 60)}m
                        </span>
                        <span className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                          <MapPin className="h-4 w-4 text-green-600" />
                          {Math.round(totalMiles)} miles
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 text-lg leading-relaxed">
                      You'll be embarking on an incredible {totalDays}-day adventure, covering {Math.round(totalMiles)} miles 
                      across {legs.length} amazing segments. Get ready for an unforgettable experience!
                    </p>
                  </div>

                  {/* Journey Legs */}
                  {legs.map((leg: any, i: number) => {
                    const dayStart = i + 1;
                    const dayEnd = i + 2;
                    const modeEmojiMap = {
                      'car': '🚗',
                      'train': '🚂', 
                      'bus': '🚌',
                      'plane': '✈️'
                    };
                    const modeEmoji = modeEmojiMap[leg.mode as keyof typeof modeEmojiMap] || '🚀';
                    
                    return (
                      <Card key={i} className="bg-white border-2 border-gray-200 shadow-lg">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">{modeEmoji}</span>
                                <h4 className="font-bold text-xl text-gray-800">
                                  Day {dayStart} to Day {dayEnd}
                                </h4>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {leg.mode.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-gray-600 text-lg mb-3">
                                You'll be traveling from <span className="font-semibold text-gray-800">{leg.from?.name || leg.from}</span> to{' '}
                                <span className="font-semibold text-gray-800">{leg.to?.name || leg.to}</span>
                              </p>
                              <p className="text-gray-500 text-sm leading-relaxed">
                                This {Math.round(leg.duration_minutes)}-minute journey will take you through {Math.round(leg.distance_miles || leg.distance_km * 0.621371)} miles of beautiful scenery. 
                                Perfect time to relax, enjoy the views, and maybe catch up on some reading or podcasts!
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{Math.round(leg.duration_minutes)}</div>
                              <div className="text-sm text-gray-600">minutes</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{Math.round(leg.distance_miles || leg.distance_km * 0.621371)}</div>
                              <div className="text-sm text-gray-600">miles</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {/* Journey Conclusion */}
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
                    <h4 className="font-bold text-xl text-gray-800 mb-3">🎉 Journey Complete!</h4>
                    <p className="text-gray-700 leading-relaxed">
                      Congratulations! You've successfully planned an epic {totalDays}-day adventure covering {Math.round(totalMiles)} miles. 
                      This journey will create memories that last a lifetime. Safe travels and enjoy every moment!
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-gray-200 shadow-lg">
              <div className="text-6xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Itinerary Yet</h3>
              <p className="text-gray-500">Ask me to create an itinerary and I'll plan your perfect journey!</p>
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

