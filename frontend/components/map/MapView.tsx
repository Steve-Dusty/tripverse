'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Waypoint, TripLeg } from '@/lib/mock-data';

// Mapbox token and style
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic3RldmVkdXN0eSIsImEiOiJjbWd4am05Z2IxZXhyMmtwdTg1cnU4cmYxIn0.zpfFRf-6xH6ivorwg_ZJ3w';
// Using Mapbox Standard Style (v3.0 beta) - no style URL needed, defaults to Standard
const MAPBOX_STYLE = 'mapbox://styles/mapbox/standard-beta';

interface MapViewProps {
  waypoints: Waypoint[];
  selectedItinerary?: { legs: TripLeg[] };
}

export function MapView({ waypoints, selectedItinerary }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routeData, setRouteData] = useState<any | null>(null);
  const originMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log('Initializing map...', mapContainer.current);
    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center: [-115.1398, 36.1699], // Center on Vegas area
      zoom: 5,
      pitch: 45, // 3D tilt for better 3D effect
      bearing: 0, // Rotation angle
      attributionControl: false, // Remove watermark
      projection: 'globe' as any, // 3D globe view
    });

    map.current.on('load', () => {
      console.log('Map loaded successfully!');
      setMapLoaded(true);
      
      // Configure Mapbox Standard Style features
      try {
        // Set lighting preset to dusk for a more dramatic look
        map.current.setConfigProperty('basemap', 'lightPreset', 'dusk');
        
        // Configure label visibility for cleaner look
        map.current.setConfigProperty('basemap', 'showPlaceLabel', true);
        map.current.setConfigProperty('basemap', 'showRoadLabels', true);
        map.current.setConfigProperty('basemap', 'showPointOfInterestLabels', true);
        map.current.setConfigProperty('basemap', 'showTransitLabels', false);
        
        console.log('Mapbox Standard Style configured successfully!');
      } catch (error) {
        console.warn('Could not configure Standard Style features:', error);
      }
    });

    map.current.on('error', (e) => {
      console.error('Map error:', e);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Poll backend for latest route JSON and store locally
  useEffect(() => {
    let isMounted = true;
    const fetchLatestRoute = async () => {
      try {
        const res = await fetch('http://localhost:8000/route/latest');
        if (res.status === 204) return; // no route yet
        if (!res.ok) return;
        const json = await res.json();
        if (!isMounted) return;
        setRouteData(json);
      } catch {}
    };

    fetchLatestRoute();
    const id = setInterval(fetchLatestRoute, 3000);
    return () => { isMounted = false; clearInterval(id); };
  }, []);

  // Render MCP route and markers when routeData updates
  useEffect(() => {
    if (!map.current || !mapLoaded || !routeData) return;
    const m = map.current;
    const route = routeData?.routes?.[0];
    const geometry = route?.geometry; // GeoJSON LineString
    if (!geometry) return;

    const feature = { type: 'Feature', properties: {}, geometry } as any;
    const collection = { type: 'FeatureCollection', features: [feature] } as any;

    // Update or add source/layer
    if (m.getSource('route')) {
      (m.getSource('route') as mapboxgl.GeoJSONSource).setData(collection as any);
    } else {
      m.addSource('route', { type: 'geojson', data: collection } as any);
      if (!m.getLayer('route')) {
        m.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#4F46E5', 'line-width': 5 },
        } as any);
      }
    }

    const coords: [number, number][] = geometry.coordinates || [];
    if (coords.length >= 2) {
      const start = coords[0];
      const end = coords[coords.length - 1];

      originMarkerRef.current?.remove();
      destinationMarkerRef.current?.remove();

      const makeDot = (color: string) => {
        const el = document.createElement('div');
        el.style.width = '14px';
        el.style.height = '14px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = color;
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 0 6px rgba(0,0,0,0.5)';
        return el;
      };

      originMarkerRef.current = new mapboxgl.Marker(makeDot('#22c55e')).setLngLat(start as any).addTo(m);
      destinationMarkerRef.current = new mapboxgl.Marker(makeDot('#ef4444')).setLngLat(end as any).addTo(m);

      const bounds = new mapboxgl.LngLatBounds();
      coords.forEach((c) => bounds.extend(c as any));
      m.fitBounds(bounds, { padding: 60 });
    }
  }, [routeData, mapLoaded]);
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
    </div>
  );
}

