import React, { useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Navigation, MapPin, ExternalLink, Compass, Search } from 'lucide-react';
import { toast } from 'sonner';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export interface MiniMapPlaceCardProps {
  query: string;
  placeTitle?: string;
  placeAddress?: string;
  lat?: number;
  lng?: number;
}

// Known landmark coordinates lookup for instant offline/fast rendering
const LANDMARK_COORDINATES: Record<string, { title: string; address: string; lat: number; lng: number }> = {
  'taj mahal': {
    title: 'Taj Mahal',
    address: 'Dharmapuri, Forest Colony, Tajganj, Agra, Uttar Pradesh 282001, India',
    lat: 27.1751,
    lng: 78.0421,
  },
  'india gate': {
    title: 'India Gate',
    address: 'Kartavya Path, India Gate, New Delhi, Delhi 110001, India',
    lat: 28.6129,
    lng: 77.2295,
  },
  'red fort': {
    title: 'Red Fort (Lal Qila)',
    address: 'Netaji Subhash Marg, Lal Qila, Chandni Chowk, New Delhi, Delhi 110006, India',
    lat: 28.6562,
    lng: 77.241,
  },
  'mumbai': {
    title: 'Mumbai',
    address: 'Maharashtra, India',
    lat: 19.076,
    lng: 72.8777,
  },
  'delhi airport': {
    title: 'Indira Gandhi International Airport (DEL)',
    address: 'New Delhi, Delhi 110037, India',
    lat: 28.5562,
    lng: 77.10,
  },
  'jaipur': {
    title: 'Jaipur (The Pink City)',
    address: 'Rajasthan, India',
    lat: 26.9124,
    lng: 75.7873,
  },
  'hotels near jaipur': {
    title: 'Hotels in Jaipur',
    address: 'Jaipur City Center, Rajasthan, India',
    lat: 26.9124,
    lng: 75.7873,
  },
  'restaurants near me': {
    title: 'Nearby Dining & Cafes',
    address: 'Current Location Vicinity, New Delhi, Delhi',
    lat: 28.6139,
    lng: 77.209,
  },
};

export const MiniMapPlaceCard: React.FC<MiniMapPlaceCardProps> = ({
  query,
  placeTitle: initTitle,
  placeAddress: initAddr,
  lat: initLat,
  lng: initLng,
}) => {
  const cleanQuery = query.toLowerCase().trim();
  const preset = LANDMARK_COORDINATES[cleanQuery];

  const [title, setTitle] = useState<string>(initTitle || preset?.title || query);
  const [address, setAddress] = useState<string>(initAddr || preset?.address || 'Searching location details...');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initLat ?? preset?.lat ?? 28.6139,
    lng: initLng ?? preset?.lng ?? 77.209,
  });
  const [isLoading, setIsLoading] = useState<boolean>(!preset && !initLat);

  // Attempt Google Places Search if API is present
  useEffect(() => {
    if (preset || (initLat && initLng)) {
      setIsLoading(false);
      return;
    }

    if (!window.google?.maps?.places) {
      // Fallback geocoding or preset match
      setIsLoading(false);
      return;
    }

    try {
      const dummyElem = document.createElement('div');
      const service = new google.maps.places.PlacesService(dummyElem);

      service.findPlaceFromQuery(
        {
          query: query,
          fields: ['name', 'formatted_address', 'geometry'],
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
            const p = results[0];
            if (p.name) setTitle(p.name);
            if (p.formatted_address) setAddress(p.formatted_address);
            if (p.geometry?.location) {
              setCoords({
                lat: p.geometry.location.lat(),
                lng: p.geometry.location.lng(),
              });
            }
          }
          setIsLoading(false);
        }
      );
    } catch (err) {
      console.warn('Places query failed:', err);
      setIsLoading(false);
    }
  }, [query, preset, initLat, initLng]);

  const handleDirections = () => {
    const dest = encodeURIComponent(address || title || query);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank', 'noopener,noreferrer');
    toast.info(`Opening directions to ${title}`);
  };

  const handleOpenMap = () => {
    const q = encodeURIComponent(address || title || query);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank', 'noopener,noreferrer');
    toast.info(`Opening ${title} in Google Maps`);
  };

  return (
    <div className="w-[340px] max-w-full my-2 bg-card text-card-foreground border border-border rounded-[18px] overflow-hidden shadow-lg transition-all hover:shadow-xl font-sans">
      {/* ── MAP CONTAINER (210px) ── */}
      <div className="h-[210px] w-full relative bg-muted flex items-center justify-center overflow-hidden">
        {hasValidKey ? (
          <APIProvider apiKey={API_KEY}>
            <Map
              defaultCenter={coords}
              center={coords}
              defaultZoom={15}
              gestureHandling="cooperative"
              disableDefaultUI={true}
              zoomControl={true}
              mapId="MINI_MAP_CARD_ID"
              className="w-full h-full"
            >
              <AdvancedMarker position={coords}>
                <Pin background="#ef4444" glyphColor="#ffffff" borderColor="#991b1b" />
              </AdvancedMarker>
            </Map>
          </APIProvider>
        ) : (
          /* Interactive Fallback Map Tile Canvas with Marker */
          <div className="w-full h-full relative bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
            {/* Grid Pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />
            {/* Pulsing Cursed/GPS Ring */}
            <div className="absolute w-24 h-24 rounded-full bg-cyan-500/20 animate-ping pointer-events-none" />
            
            {/* Drop Marker */}
            <div className="relative z-10 flex flex-col items-center animate-bounce">
              <div className="p-2.5 rounded-full bg-rose-600 text-white shadow-lg shadow-rose-600/50 border-2 border-white">
                <MapPin className="w-6 h-6 fill-white" />
              </div>
              <div className="w-3 h-1 bg-black/40 rounded-full blur-[1px] mt-1" />
            </div>

            {/* Coordinates Badge */}
            <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-cyan-300 border border-white/10 flex items-center gap-1">
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>
                {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
              </span>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center text-xs text-muted-foreground gap-2 z-20">
            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span>Finding location...</span>
          </div>
        )}
      </div>

      {/* ── PLACE INFO SECTION ── */}
      <div className="p-3.5 space-y-3 bg-card">
        <div>
          <h3 className="text-base font-bold text-foreground leading-tight truncate">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-snug">
            {address}
          </p>
        </div>

        {/* ── MAP ACTION BUTTONS ── */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleDirections}
            className="flex-1 py-2.5 px-3 rounded-[11px] bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Directions</span>
          </button>

          <button
            onClick={handleOpenMap}
            className="flex-1 py-2.5 px-3 rounded-[11px] bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-border cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Map</span>
          </button>
        </div>
      </div>
    </div>
  );
};
