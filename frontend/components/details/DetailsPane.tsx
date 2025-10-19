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
        <TabsContent value="itinerary" className="p-4 space-y-6">
          {itineraries.length > 0 && itineraries.some(it => it && Object.keys(it).length > 0) ? (
            itineraries.map((it, idx) => {
              // Support both old flat legs structure and new days structure
              const days = it.days || [];
              const flatLegs = it.legs || [];
              const summary = it.summary || {};
              
              // Calculate totals
              let totalMinutes = summary.total_duration_minutes;
              let totalMiles = summary.total_distance_miles;
              let totalDays = summary.total_days || days.length;
              
              // Fallback calculation if summary is incomplete
              if (!totalMinutes || !totalMiles) {
                if (days.length > 0) {
                  // Calculate from days structure
                  totalMinutes = days.reduce((acc: number, day: any) => {
                    const dayLegs = day.legs || [];
                    return acc + dayLegs.reduce((legAcc: number, l: any) => legAcc + (l.duration_minutes || 0), 0);
                  }, 0);
                  totalMiles = days.reduce((acc: number, day: any) => {
                    const dayLegs = day.legs || [];
                    return acc + dayLegs.reduce((legAcc: number, l: any) => legAcc + (l.distance_miles || 0), 0);
                  }, 0);
                } else {
                  // Calculate from flat legs
                  totalMinutes = flatLegs.reduce((acc: number, l: any) => acc + (l.duration_minutes || 0), 0);
                  totalMiles = flatLegs.reduce((acc: number, l: any) => acc + (l.distance_miles || 0), 0);
                  totalDays = Math.ceil(totalMinutes / (24 * 60));
                }
              }
              
              const totalLegsCount = days.length > 0 
                ? days.reduce((acc: number, day: any) => acc + (day.legs || []).length, 0)
                : flatLegs.length;
              
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
                      across {totalLegsCount} amazing segments. Get ready for an unforgettable experience!
                    </p>
                  </div>

                  {/* Render days structure if available */}
                  {days.length > 0 ? (
                    days.map((day: any, dayIdx: number) => {
                      // Safely extract day info with fallbacks
                      const dayLegs = Array.isArray(day.legs) ? day.legs : [];
                      const dayNumber = day.day ?? dayIdx + 1;
                      const dayTitle = day.title || `Day ${dayNumber}`;
                      const dayDate = day.date ? new Date(day.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : '';
                      
                      console.log(`Rendering Day ${dayNumber}:`, dayTitle, `with ${dayLegs.length} legs`);
                      
                      return (
                        <div key={`day-${dayIdx}-${dayNumber}`} className="space-y-4">
                          {/* Day Header */}
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-4 shadow-lg">
                            <h3 className="text-xl font-bold">{dayTitle}</h3>
                            {dayDate && <p className="text-sm opacity-90 mt-1">{dayDate}</p>}
                          </div>
                          
                          {/* Day's Legs */}
                          {dayLegs.length > 0 ? (
                            dayLegs.map((leg: any, legIdx: number) => {
                              // Handle undefined/null leg gracefully
                              if (!leg) {
                                console.warn(`Leg ${legIdx} in Day ${dayNumber} is null/undefined`);
                                return null;
                              }
                              
                              const modeEmojiMap: Record<string, string> = {
                                'car': '🚗',
                                'train': '🚂', 
                                'bus': '🚌',
                                'plane': '✈️',
                                'walk': '🚶',
                                'bike': '🚴',
                                'taxi': '🚕',
                                'metro': '🚇',
                                'boat': '⛵',
                                'hiking': '🥾'
                              };
                              
                              const mode = (leg.mode || 'unknown').toLowerCase();
                              const modeEmoji = modeEmojiMap[mode] || '🚀';
                              
                              // Safely extract from/to info
                              const fromName = (typeof leg.from === 'object' ? leg.from?.name : leg.from) || 'Start';
                              const toName = (typeof leg.to === 'object' ? leg.to?.name : leg.to) || 'Destination';
                              const fromTime = (typeof leg.from === 'object' ? leg.from?.time : '') || '';
                              const toTime = (typeof leg.to === 'object' ? leg.to?.time : '') || '';
                              
                              // Safely extract numeric values
                              const durationMinutes = Number(leg.duration_minutes) || 0;
                              const distanceMiles = Number(leg.distance_miles) || Number(leg.distance_km) * 0.621371 || 0;
                              
                              console.log(`  Leg ${legIdx + 1}: ${fromName} -> ${toName} (${mode})`);
                              
                              return (
                                <Card key={`day-${dayIdx}-leg-${legIdx}`} className="bg-white border-2 border-gray-200 shadow-lg">
                                  <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                          <span className="text-2xl">{modeEmoji}</span>
                                          <div>
                                            <h4 className="font-bold text-xl text-gray-800">
                                              {fromName} → {toName}
                                            </h4>
                                            {(fromTime || toTime) && (
                                              <p className="text-sm text-gray-500">
                                                {fromTime && `Depart: ${fromTime}`}
                                                {fromTime && toTime && ' • '}
                                                {toTime && `Arrive: ${toTime}`}
                                              </p>
                                            )}
                                          </div>
                                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            {mode.toUpperCase()}
                                          </Badge>
                                        </div>
                                        {leg.description && (
                                          <p className="text-gray-600 text-base mb-3 ml-11">
                                            {leg.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg ml-11">
                                      <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                          {durationMinutes > 0 ? Math.round(durationMinutes) : '-'}
                                        </div>
                                        <div className="text-sm text-gray-600">minutes</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                          {distanceMiles > 0 ? Math.round(distanceMiles) : '-'}
                                        </div>
                                        <div className="text-sm text-gray-600">miles</div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              No activities planned for this day
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    /* Fallback to flat legs structure for backward compatibility */
                    flatLegs.map((leg: any, i: number) => {
                      const dayStart = i + 1;
                      const dayEnd = i + 2;
                      const modeEmojiMap = {
                        'car': '🚗',
                        'train': '🚂', 
                        'bus': '🚌',
                        'plane': '✈️',
                        'walk': '🚶'
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
                    })
                  )}
                  
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

