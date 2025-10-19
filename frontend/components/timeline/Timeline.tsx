'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { TripLeg, CalendarEvent } from '@/lib/mock-data';
import { Plane, Train, Bus, Car, Footprints, Calendar } from 'lucide-react';

interface TimelineProps {
  legs: TripLeg[];
  calendarEvents: CalendarEvent[];
}

export function Timeline({ legs, calendarEvents }: TimelineProps) {
  const getIcon = (mode: string) => {
    switch (mode) {
      case 'flight':
        return Plane;
      case 'train':
        return Train;
      case 'bus':
        return Bus;
      case 'car':
        return Car;
      case 'walk':
        return Footprints;
      default:
        return Calendar;
    }
  };

  const allEvents = [
    ...legs.map((leg) => ({
      id: leg.id,
      type: 'trip' as const,
      title: `${leg.from} → ${leg.to}`,
      start: new Date(leg.departureTime),
      end: new Date(leg.arrivalTime),
      icon: getIcon(leg.mode),
      color: 'bg-blue-500',
      data: leg,
    })),
    ...calendarEvents.map((event) => ({
      id: event.id,
      type: 'calendar' as const,
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      icon: Calendar,
      color: event.color,
      data: event,
    })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4">
        <h3 className="font-semibold text-lg">Timeline</h3>
        <p className="text-xs text-muted-foreground">Trip legs & calendar events</p>
      </div>
      
      <div className="space-y-4">
        {allEvents.map((event, idx) => {
          const Icon = event.icon;
          return (
            <div key={event.id} className="relative">
              {/* Timeline connector */}
              {idx < allEvents.length - 1 && (
                <div className="absolute left-[15px] top-12 w-0.5 h-full bg-border" />
              )}
              
              <div className="flex gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${event.type === 'trip' ? 'bg-primary' : 'bg-muted'} flex items-center justify-center relative z-10`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                
                <div className="flex-1 pb-6">
                  <div className="bg-card border rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div className="font-medium text-sm">{event.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(event.start, 'MMM d, h:mm a')} → {format(event.end, 'h:mm a')}
                    </div>
                    {event.type === 'trip' && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="text-green-600 font-medium">
                          ${(event.data as TripLeg).cost}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          {(event.data as TripLeg).provider}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

