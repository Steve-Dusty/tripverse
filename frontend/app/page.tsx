'use client';

import { useState, useEffect } from 'react';
import { MapView } from '@/components/map/MapView';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { ActionsBar } from '@/components/actions/ActionsBar';
import { DetailsPane } from '@/components/details/DetailsPane';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  mockWaypoints,
  mockItineraries,
  mockStays,
  mockLivingInfo,
  Itinerary,
} from '@/lib/mock-data';

export default function Dashboard() {
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | undefined>(mockItineraries[0]);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  useEffect(() => {
    // Auto-select first itinerary
    if (!selectedItinerary && mockItineraries.length > 0) {
      setSelectedItinerary(mockItineraries[0]);
    }
  }, [selectedItinerary]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background">
      {/* Top Actions Bar */}
      <header className="h-16 border-b-2 border-border px-6 flex items-center justify-between bg-card shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-primary drop-shadow-lg">
            AI Travel Planner
          </h1>
          <p className="text-xs text-muted-foreground">
            Smart itinerary planning powered by AI
          </p>
        </div>
        <ActionsBar selectedItineraryId={selectedItinerary?.id} />
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - Chat Only */}
        <aside className="w-96 border-r-2 border-border bg-card shadow-xl flex-shrink-0 z-10">
          <ChatPanel />
        </aside>

        {/* Map - Covers entire remaining space */}
        <main className="flex-1 relative h-full">
          <MapView
            waypoints={mockWaypoints}
            selectedItinerary={selectedItinerary}
          />
        </main>

        {/* Right Sidebar - OVERLAY that covers the map */}
        {rightCollapsed ? (
          /* Collapsed state - minimal overlay with just the button */
          <aside className="absolute right-0 top-0 w-12 h-full border-l-2 border-border bg-card shadow-xl z-20 flex items-center justify-center" style={{ backgroundColor: 'hsl(217 28% 16%)' }}>
            <Button
              onClick={() => setRightCollapsed(!rightCollapsed)}
              size="icon"
              variant="outline"
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </aside>
        ) : (
          /* Expanded state - full overlay */
          <aside className="absolute right-0 top-0 w-[420px] h-full border-l-2 border-border bg-card shadow-xl z-20" style={{ backgroundColor: 'hsl(217 28% 16%)' }}>
            <Button
              onClick={() => setRightCollapsed(!rightCollapsed)}
              size="icon"
              variant="outline"
              className="absolute right-2 top-4 z-10 h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <DetailsPane
              selectedItinerary={selectedItinerary}
              stays={mockStays}
              livingInfo={mockLivingInfo}
              documents={[]}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
