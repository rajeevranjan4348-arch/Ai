import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  useMapsLibrary,
  useAdvancedMarkerRef,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Navigation,
  ExternalLink,
  LocateFixed,
  ArrowRight,
  Clock,
  Compass,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export interface MapRouteCardProps {
  originName?: string;
  destinationName?: string;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  distance?: string;
  duration?: string;
}

// Inner route calculation and map line renderer
function RouteLineRenderer({
  origin,
  destination,
  onRouteCalculated,
}: {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  onRouteCalculated?: (dist: string, dur: string) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map) return;

    // Clear existing polylines
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    // Compute route using modern Routes API
    routesLib.Route.computeRoutes({
      origin: origin,
      destination: destination,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    })
      .then(({ routes }) => {
        if (routes && routes[0]) {
          const mainRoute = routes[0];
          const newPolylines = mainRoute.createPolylines({
            polylineOptions: {
              strokeColor: '#2563eb', // Vibrant blue route line like in screenshot
              strokeWeight: 6,
              strokeOpacity: 0.9,
            },
          });

          newPolylines.forEach((p) => p.setMap(map));
          polylinesRef.current = newPolylines;

          if (mainRoute.viewport) {
            map.fitBounds(mainRoute.viewport, {
              top: 50,
              bottom: 50,
              left: 50,
              right: 50,
            });
          }

          if (onRouteCalculated) {
            const distM = mainRoute.distanceMeters || 0;
            const durMs = mainRoute.durationMillis || 0;
            const distKm = (distM / 1000).toFixed(1) + ' km';
            const durMins = Math.round(durMs / (1000 * 60));
            const durHours = (durMins / 60).toFixed(1) + ' hrs';
            const durText = durMins > 60 ? durHours : `${durMins} mins`;
            onRouteCalculated(distKm, durText);
          }
        }
      })
      .catch((err) => {
        console.warn('Routes API fallback line:', err);
        // Fallback fallback polyline if Routes API service is restricted
        if (window.google?.maps) {
          const line = new window.google.maps.Polyline({
            path: [origin, destination],
            geodesic: true,
            strokeColor: '#2563eb',
            strokeOpacity: 0.9,
            strokeWeight: 5,
          });
          line.setMap(map);
          polylinesRef.current = [line];

          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(origin);
          bounds.extend(destination);
          map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
        }
      });

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
    };
  }, [routesLib, map, origin.lat, origin.lng, destination.lat, destination.lng]);

  return null;
}

export const MapRouteCard: React.FC<MapRouteCardProps> = ({
  originName = 'My Location',
  destinationName = 'Rajasthan',
  originLat: defaultOriginLat = 28.6139, // New Delhi default origin
  originLng: defaultOriginLng = 77.209,
  destLat: defaultDestLat = 26.9124, // Rajasthan / Jaipur default
  destLng: defaultDestLng = 75.7873,
  distance: initialDistance = '280 km',
  duration: initialDuration = '4.5 hrs',
}) => {
  const [origin, setOrigin] = useState({ lat: defaultOriginLat, lng: defaultOriginLng });
  const [destination] = useState({ lat: defaultDestLat, lng: defaultDestLng });
  const [calculatedDist, setCalculatedDist] = useState(initialDistance);
  const [calculatedDur, setCalculatedDur] = useState(initialDuration);
  const [isLocating, setIsLocating] = useState(false);
  const [originMarkerRef, originMarker] = useAdvancedMarkerRef();
  const [destMarkerRef, destMarker] = useAdvancedMarkerRef();
  const [originWindowOpen, setOriginWindowOpen] = useState(false);
  const [destWindowOpen, setDestWindowOpen] = useState(false);

  // Request user's real GPS coordinates
  const handleLocateOrigin = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsLocating(false);
        toast.success('Updated origin to your current GPS position');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    handleLocateOrigin();
  }, [handleLocateOrigin]);

  const mapsDeepLink = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;

  const handleOpenGoogleMaps = () => {
    window.open(mapsDeepLink, '_blank', 'noopener,noreferrer');
    toast.success(`Opening directions to ${destinationName} in Google Maps`);
  };

  const handleShareRoute = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Route: ${originName} to ${destinationName}`,
          text: `Check out driving route from ${originName} to ${destinationName}`,
          url: mapsDeepLink,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(mapsDeepLink);
      toast.success('Route link copied to clipboard!');
    }
  };

  return (
    <div className="my-4 w-full max-w-xl rounded-3xl border border-white/15 bg-gradient-to-b from-zinc-900/95 via-zinc-950 to-black overflow-hidden shadow-2xl backdrop-blur-xl relative font-sans group">
      {/* Header Info Bar */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white truncate">
                {originName} <span className="text-blue-400">→</span> {destinationName}
              </h4>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60 mt-0.5">
              <span className="flex items-center gap-1">
                <Navigation className="w-3 h-3 text-blue-400" /> {calculatedDist}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" /> {calculatedDur} drive
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleShareRoute}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="Share Route"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenGoogleMaps}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all transform active:scale-95 cursor-pointer"
          >
            <span>Navigate</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Embedded Google Map Canvas */}
      <div className="relative w-full h-[280px] sm:h-[320px] bg-slate-950">
        {!hasValidKey ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-white space-y-2">
            <MapPin className="w-8 h-8 text-amber-400 animate-bounce" />
            <p className="text-xs font-semibold">Google Maps API Key Required for Live Preview</p>
            <button
              onClick={handleOpenGoogleMaps}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl font-medium"
            >
              Open Route in Google Maps
            </button>
          </div>
        ) : (
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map
              defaultCenter={origin}
              defaultZoom={7}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
              gestureHandling="cooperative"
              disableDefaultUI={false}
            >
              <RouteLineRenderer
                origin={origin}
                destination={destination}
                onRouteCalculated={(dist, dur) => {
                  setCalculatedDist(dist);
                  setCalculatedDur(dur);
                }}
              />

              {/* Origin Marker */}
              <AdvancedMarker
                ref={originMarkerRef}
                position={origin}
                onClick={() => setOriginWindowOpen(true)}
              >
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-6 h-6 bg-blue-500/50 rounded-full animate-ping" />
                  <Pin background="#2563eb" glyphColor="#ffffff" borderColor="#1d4ed8" />
                </div>
              </AdvancedMarker>

              {/* Destination Marker */}
              <AdvancedMarker
                ref={destMarkerRef}
                position={destination}
                onClick={() => setDestWindowOpen(true)}
              >
                <Pin background="#ea580c" glyphColor="#ffffff" borderColor="#c2410c" />
              </AdvancedMarker>

              {originWindowOpen && (
                <InfoWindow anchor={originMarker} onCloseClick={() => setOriginWindowOpen(false)}>
                  <div className="p-1 text-slate-900 text-xs font-bold">{originName}</div>
                </InfoWindow>
              )}

              {destWindowOpen && (
                <InfoWindow anchor={destMarker} onCloseClick={() => setDestWindowOpen(false)}>
                  <div className="p-1 text-slate-900 text-xs font-bold">{destinationName}</div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        )}

        {/* GPS Recenter overlay button */}
        <div className="absolute bottom-3 left-3 z-10">
          <button
            onClick={handleLocateOrigin}
            disabled={isLocating}
            className="p-2 bg-black/80 hover:bg-black text-white rounded-xl border border-white/20 backdrop-blur-md shadow-lg flex items-center gap-1.5 text-[11px] font-medium transition-all"
            title="Recenter Origin to My Location"
          >
            <LocateFixed className={`w-3.5 h-3.5 text-blue-400 ${isLocating ? 'animate-spin' : ''}`} />
            <span>GPS Location</span>
          </button>
        </div>
      </div>

      {/* Footer Navigation Bar */}
      <div className="p-3 bg-black/80 border-t border-white/10 flex items-center justify-between text-xs text-white/70">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Real-time Driving Path Calculated</span>
        </div>
        <button
          onClick={handleOpenGoogleMaps}
          className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 hover:underline"
        >
          View Full Turn-by-Turn Map <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
