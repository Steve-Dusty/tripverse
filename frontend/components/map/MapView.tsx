'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Waypoint, TripLeg } from '@/lib/mock-data';

// Mapbox token and style
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic3RldmVkdXN0eSIsImEiOiJjbWd4am05Z2IxZXhyMmtwdTg1cnU4cmYxIn0.zpfFRf-6xH6ivorwg_ZJ3w';
const MAPBOX_STYLE = 'mapbox://styles/stevedusty/cmgxjv2fy006001smfwbi0u3a';

interface MapViewProps {
  waypoints: Waypoint[];
  selectedItinerary?: { legs: TripLeg[] };
}

export function MapView({ waypoints, selectedItinerary }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log('Initializing map...', mapContainer.current);
    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center: [-115.1398, 36.1699], // Center on Vegas area
      zoom: 5,
      attributionControl: false, // Remove watermark
      projection: 'globe' as any, // 3D globe view
    });

    map.current.on('load', () => {
      console.log('Map loaded successfully!');
      setMapLoaded(true);
    });

    map.current.on('error', (e) => {
      console.error('Map error:', e);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers and layers
    const markers = document.getElementsByClassName('mapboxgl-marker');
    while (markers[0]) {
      markers[0].remove();
    }

    if (map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }

    // Add waypoint markers
    waypoints.forEach((waypoint) => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.border = '3px solid white';
      
      if (waypoint.type === 'origin') {
        el.style.backgroundColor = '#10b981'; // green
      } else if (waypoint.type === 'destination') {
        el.style.backgroundColor = '#ef4444'; // red
      } else {
        el.style.backgroundColor = '#3b82f6'; // blue
      }

      new mapboxgl.Marker(el)
        .setLngLat([waypoint.lng, waypoint.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-2"><strong>${waypoint.name}</strong><br/><span class="text-xs">${waypoint.type}</span></div>`
          )
        )
        .addTo(map.current!);
    });

    // Draw route if itinerary is selected
    if (selectedItinerary && waypoints.length >= 2) {
      const coordinates = waypoints.map((wp) => [wp.lng, wp.lat]);

      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        },
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#6366f1',
          'line-width': 4,
          'line-opacity': 0.8,
        },
      });

      // Fit bounds to show all waypoints
      const bounds = new mapboxgl.LngLatBounds();
      waypoints.forEach((wp) => bounds.extend([wp.lng, wp.lat]));
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [waypoints, selectedItinerary, mapLoaded]);


  return (
    <div className="relative h-full w-full bg-gray-800" style={{ height: '100%', minHeight: '500px' }}>
      <div 
        ref={mapContainer} 
        className="h-full w-full"
        style={{ height: '100%', minHeight: '500px' }}
      />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Loading Map...</div>
            <div className="text-sm text-gray-300">Initializing Mapbox</div>
          </div>
        </div>
      )}
      <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm backdrop-blur-sm">
        <div className="font-semibold mb-1">Legend</div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Origin</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Waypoint</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Destination</span>
        </div>
      </div>
    </div>
  );
}

