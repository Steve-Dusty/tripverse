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
  const [pollingInterval, setPollingInterval] = useState(3000); // Normal polling: 3s
  const [isFastPolling, setIsFastPolling] = useState(false);

  useEffect(() => {
    let mounted = true;
    let previousItineraryData: string | null = null;
    let fastPollingStartTime: number | null = null;

    const fetchLatest = async () => {
      try {
        const res = await fetch('http://localhost:8000/itinerary/latest');
        if (res.status === 204) {
          console.log('No itinerary data yet (204)');
          return;
        }
        if (!res.ok) return;
        const json = await res.json();
        
        if (!mounted) return;
        
        const currentDataStr = JSON.stringify(json);
        const list = Array.isArray(json) ? json : [json];
        
        console.log('Fetched itinerary - Days:', list[0]?.days?.length || 0, 'Fast polling:', isFastPolling);
        
        if (list.length > 0 && list[0].days) {
          console.log(`Itinerary has ${list[0].days.length} days with total legs:`, 
            list[0].days.reduce((acc: number, d: any) => acc + (d.legs?.length || 0), 0));
        }
        
        // If we received NEW itinerary data while fast polling, return to normal polling
        if (isFastPolling && previousItineraryData && previousItineraryData !== currentDataStr) {
          console.log('✅ New itinerary received! Returning to normal polling');
          setIsFastPolling(false);
          setPollingInterval(3000);
        }
        
        previousItineraryData = currentDataStr;
        setItineraries(list);
      } catch (err) {
        console.error('Error fetching itinerary:', err);
      }
    };

    // Track when fast polling started
    if (isFastPolling && !fastPollingStartTime) {
      fastPollingStartTime = Date.now();
      console.log('🚀 Started fast polling (300ms intervals)');
    }

    // Initial fetch
    fetchLatest();
    
    // Set up polling with current interval
    const id = setInterval(fetchLatest, pollingInterval);
    
    return () => { 
      mounted = false; 
      clearInterval(id); 
    };
  }, [pollingInterval, isFastPolling]);

  // Listen for itinerary requests from chat
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleItineraryRequest = (event: Event) => {
      console.log('Itinerary request event received, switching to fast polling (300ms)');
      setIsFastPolling(true);
      setPollingInterval(300); // Very fast polling: 300ms
      
      // Safety timeout: return to normal polling after 30 seconds
      timeoutId = setTimeout(() => {
        console.log('Fast polling timeout reached, returning to normal polling');
        setIsFastPolling(false);
        setPollingInterval(3000);
      }, 30000);
    };

    window.addEventListener('itinerary-request', handleItineraryRequest);
    return () => {
      window.removeEventListener('itinerary-request', handleItineraryRequest);
      if (timeoutId) clearTimeout(timeoutId);
    };
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
        <TabsContent value="itinerary" className="p-4 space-y-4">
          {itineraries.length > 0 && itineraries.some(it => it && Object.keys(it).length > 0) ? (
            itineraries.map((it, idx) => {
              const days = it.days || [];
              const summary = it.summary || {};
              
              console.log('=== RENDERING ITINERARY ===');
              console.log('Days:', days.length, days);
              
              if (days.length === 0) {
                return (
                  <div key={idx} className="text-center py-8 text-gray-500">
                    No itinerary data available
                  </div>
                );
              }
              
              return (
                <div key={idx} className="space-y-4">
                  {/* Trip Summary Header */}
                  <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl">
                    <CardContent className="p-6">
                      <h2 className="text-2xl font-bold mb-3">Your {days.length}-Day Adventure</h2>
                      <div className="flex gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          <span>{summary.total_days || days.length} days</span>
                        </div>
                        {summary.total_distance_miles && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            <span>{Math.round(summary.total_distance_miles)} miles</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Day-by-Day Itinerary */}
                  {days.map((day: any, dayIdx: number) => {
                    const dayLegs = Array.isArray(day.legs) ? day.legs : [];
                    const dayNumber = day.day ?? dayIdx + 1;
                    const dayTitle = day.title || `Day ${dayNumber}`;
                    const dayDate = day.date ? new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    }) : '';
                    
                    // Calculate day totals
                    const dayDuration = dayLegs.reduce((acc: number, leg: any) => acc + (Number(leg.duration_minutes) || 0), 0);
                    const dayDistance = dayLegs.reduce((acc: number, leg: any) => acc + (Number(leg.distance_miles) || 0), 0);
                    
                    console.log(`Rendering Day ${dayNumber} with ${dayLegs.length} activities`);
                    
                    return (
                      <Card key={`day-${dayNumber}`} className="overflow-hidden shadow-lg">
                        {/* Day Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-2xl font-bold">{dayTitle}</h3>
                              {dayDate && <p className="text-sm opacity-90 mt-1">{dayDate}</p>}
                            </div>
                            <div className="text-right text-sm">
                              <div className="font-semibold">{dayLegs.length} activities</div>
                              <div className="opacity-90">
                                {dayDuration > 0 && `${Math.floor(dayDuration / 60)}h ${dayDuration % 60}m`}
                                {dayDistance > 0 && ` • ${Math.round(dayDistance)} mi`}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Day Activities */}
                        <CardContent className="p-5 space-y-3">
                          {dayLegs.length > 0 ? (
                            dayLegs.map((leg: any, legIdx: number) => {
                              if (!leg) return null;
                              
                              const modeEmojiMap: Record<string, string> = {
                                'car': '🚗', 'train': '🚂', 'bus': '🚌', 'plane': '✈️',
                                'walk': '🚶', 'bike': '🚴', 'taxi': '🚕', 'metro': '🚇',
                                'boat': '⛵', 'hiking': '🥾'
                              };
                              
                              const mode = (leg.mode || 'unknown').toLowerCase();
                              const modeEmoji = modeEmojiMap[mode] || '🚀';
                              const fromName = (typeof leg.from === 'object' ? leg.from?.name : leg.from) || 'Start';
                              const toName = (typeof leg.to === 'object' ? leg.to?.name : leg.to) || 'End';
                              const fromTime = (typeof leg.from === 'object' ? leg.from?.time : '') || '';
                              const toTime = (typeof leg.to === 'object' ? leg.to?.time : '') || '';
                              const durationMinutes = Number(leg.duration_minutes) || 0;
                              const distanceMiles = Number(leg.distance_miles) || 0;
                              
                              return (
                                <div 
                                  key={`d${dayNumber}-l${legIdx}`}
                                  className="border-l-4 border-purple-400 pl-4 py-3 bg-gray-50 rounded-r-lg hover:bg-gray-100 transition-colors"
                                >
                                  {/* Activity Header */}
                                  <div className="flex items-start gap-3 mb-2">
                                    <span className="text-3xl">{modeEmoji}</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-bold text-lg text-gray-900 truncate">
                                          {fromName} → {toName}
                                        </h4>
                                        <Badge variant="secondary" className="text-xs">
                                          {mode}
                                        </Badge>
                                      </div>
                                      
                                      {/* Time Info */}
                                      {(fromTime || toTime) && (
                                        <p className="text-sm text-gray-600 mt-1">
                                          {fromTime && <span>🕐 {fromTime}</span>}
                                          {fromTime && toTime && <span className="mx-2">→</span>}
                                          {toTime && <span>🕐 {toTime}</span>}
                                        </p>
                                      )}
                                      
                                      {/* Description */}
                                      {leg.description && (
                                        <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                                          {leg.description}
                                        </p>
                                      )}
                                      
                                      {/* Duration & Distance */}
                                      <div className="flex gap-4 mt-2 text-xs text-gray-600">
                                        {durationMinutes > 0 && (
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {durationMinutes} min
                                          </span>
                                        )}
                                        {distanceMiles > 0 && (
                                          <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {Math.round(distanceMiles)} mi
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-center text-gray-500 py-4">No activities planned</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Trip Summary Footer */}
                  {summary && (
                    <Card className="bg-gradient-to-r from-green-50 to-blue-50 shadow-lg">
                      <CardContent className="p-6 text-center">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">🎉 Trip Summary</h3>
                        <p className="text-gray-700">
                          Your {days.length}-day adventure is ready!
                          {summary.total_distance_miles && ` Covering ${Math.round(summary.total_distance_miles)} miles`}
                          {summary.total_duration_minutes && ` over ${Math.floor(summary.total_duration_minutes / 60)} hours`}.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })
          ) : (
            <Card className="shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Itinerary Yet</h3>
                <p className="text-gray-500">Ask me to create an itinerary and I'll plan your journey!</p>
              </CardContent>
            </Card>
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

