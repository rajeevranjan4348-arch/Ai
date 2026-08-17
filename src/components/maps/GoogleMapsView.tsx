import React, { useState, useEffect, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
  useMapsLibrary,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Navigation,
  Search,
  Coffee,
  Utensils,
  Fuel,
  TreePine,
  AlertCircle,
  LocateFixed,
  RefreshCw,
  ExternalLink,
  Car,
  Footprints,
  Bus,
  Bike,
  Sun,
  Moon,
  Globe,
  X,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export type MapTheme = 'standard' | 'dark' | 'satellite';
export type TravelModeType = 'DRIVING' | 'WALKING' | 'TRANSIT' | 'BICYCLING';

interface LocationState {
  lat: number;
  lng: number;
  accuracy?: number;
}

const DEFAULT_CENTER: LocationState = {
  lat: 37.7749,
  lng: -122.4194,
};

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

/* ── Places Search Overlay ── */
function PlacesSearchOverlay({
  currentLocation,
  onSelectPlace,
}: {
  currentLocation: LocationState;
  onSelectPlace: (place: { lat: number; lng: number; name: string; address?: string }) => void;
}) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = useCallback(
    async (queryStr: string) => {
      if (!placesLib || !queryStr.trim()) return;
      setIsSearching(true);
      try {
        const { places } = await placesLib.Place.searchByText({
          textQuery: queryStr,
          fields: ['displayName', 'location', 'formattedAddress', 'id'],
          locationBias: map?.getCenter() || currentLocation,
          maxResultCount: 6,
        });

        if (places && places.length > 0) {
          setSearchResults(places);
        } else {
          toast.info(`No places found for "${queryStr}"`);
          setSearchResults([]);
        }
      } catch (err) {
        console.warn('Places search error:', err);
        toast.error('Search failed. Ensure Places API is enabled on your API Key.');
      } finally {
        setIsSearching(false);
      }
    },
    [placesLib, map, currentLocation]
  );

  const handleQuickCategory = (category: string) => {
    setSearchQuery(category);
    handleSearch(category);
  };

  return (
    <div className="absolute top-14 left-4 right-4 md:right-auto md:w-96 z-10 space-y-2">
      <div className="flex items-center gap-2 bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-2xl">
        <Search className="w-5 h-5 text-blue-400 shrink-0 ml-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch(searchQuery);
          }}
          placeholder="Search locations, coffee, food..."
          className="w-full bg-transparent text-white placeholder-white/50 text-sm focus:outline-none"
        />
        <button
          onClick={() => handleSearch(searchQuery)}
          disabled={isSearching}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
        >
          {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => handleQuickCategory('Cafe & Coffee')}
          className="flex items-center gap-1.5 px-3 py-1 bg-black/70 hover:bg-white/20 text-white/90 text-xs rounded-full border border-white/10 backdrop-blur-md transition-all shrink-0 cursor-pointer"
        >
          <Coffee className="w-3.5 h-3.5 text-amber-400" /> Cafe
        </button>
        <button
          onClick={() => handleQuickCategory('Restaurants & Food')}
          className="flex items-center gap-1.5 px-3 py-1 bg-black/70 hover:bg-white/20 text-white/90 text-xs rounded-full border border-white/10 backdrop-blur-md transition-all shrink-0 cursor-pointer"
        >
          <Utensils className="w-3.5 h-3.5 text-red-400" /> Food
        </button>
        <button
          onClick={() => handleQuickCategory('Gas Station')}
          className="flex items-center gap-1.5 px-3 py-1 bg-black/70 hover:bg-white/20 text-white/90 text-xs rounded-full border border-white/10 backdrop-blur-md transition-all shrink-0 cursor-pointer"
        >
          <Fuel className="w-3.5 h-3.5 text-emerald-400" /> Fuel
        </button>
        <button
          onClick={() => handleQuickCategory('Park')}
          className="flex items-center gap-1.5 px-3 py-1 bg-black/70 hover:bg-white/20 text-white/90 text-xs rounded-full border border-white/10 backdrop-blur-md transition-all shrink-0 cursor-pointer"
        >
          <TreePine className="w-3.5 h-3.5 text-green-400" /> Park
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className="bg-black/90 backdrop-blur-2xl border border-white/20 rounded-2xl p-2 shadow-2xl max-h-60 overflow-y-auto space-y-1">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] text-white/50 uppercase font-semibold">
            <span>Places Found</span>
            <button onClick={() => setSearchResults([])} className="hover:text-white cursor-pointer">
              Clear
            </button>
          </div>
          {searchResults.map((p) => (
            <button
              key={p.id || Math.random()}
              onClick={() => {
                if (p.location) {
                  const placeLoc = {
                    lat: typeof p.location.lat === 'function' ? p.location.lat() : p.location.lat,
                    lng: typeof p.location.lng === 'function' ? p.location.lng() : p.location.lng,
                    name: p.displayName || 'Selected Location',
                    address: p.formattedAddress,
                  };
                  onSelectPlace(placeLoc);
                  if (map) {
                    map.panTo({ lat: placeLoc.lat, lng: placeLoc.lng });
                    map.setZoom(15);
                  }
                  toast.success(`Selected: ${placeLoc.name}`);
                }
              }}
              className="w-full text-left p-2 hover:bg-white/10 rounded-xl transition-colors flex items-start gap-2 group cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-blue-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">{p.displayName}</div>
                {p.formattedAddress && (
                  <div className="text-[10px] text-white/60 truncate">{p.formattedAddress}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Directions & Route Overlay Component ── */
function DirectionsOverlay({
  userLocation,
  selectedPlace,
}: {
  userLocation: LocationState;
  selectedPlace: { lat: number; lng: number; name: string; address?: string } | null;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');

  const [isOpen, setIsOpen] = useState(false);
  const [origin, setOrigin] = useState(`${userLocation.lat},${userLocation.lng}`);
  const [destination, setDestination] = useState('');
  const [travelMode, setTravelMode] = useState<TravelModeType>('DRIVING');
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    steps: string[];
  } | null>(null);

  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  // Initialize Directions Service and Renderer
  useEffect(() => {
    if (!routesLib || !map) return;
    const service = new routesLib.DirectionsService();
    const renderer = new routesLib.DirectionsRenderer({
      map,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#3b82f6',
        strokeWeight: 6,
        strokeOpacity: 0.9,
      },
    });

    setDirectionsService(service);
    setDirectionsRenderer(renderer);

    return () => {
      renderer.setMap(null);
    };
  }, [routesLib, map]);

  // Update origin / destination when selectedPlace or userLocation changes
  useEffect(() => {
    if (userLocation) {
      setOrigin(`${userLocation.lat.toFixed(5)},${userLocation.lng.toFixed(5)}`);
    }
  }, [userLocation]);

  useEffect(() => {
    if (selectedPlace) {
      setDestination(selectedPlace.address || selectedPlace.name || `${selectedPlace.lat},${selectedPlace.lng}`);
      setIsOpen(true);
    }
  }, [selectedPlace]);

  const handleCalculateRoute = useCallback(() => {
    if (!directionsService || !directionsRenderer) {
      toast.error('Directions service loading...');
      return;
    }

    if (!origin.trim() || !destination.trim()) {
      toast.error('Please enter both origin and destination');
      return;
    }

    setIsCalculating(true);

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode[travelMode],
      },
      (result, status) => {
        setIsCalculating(false);
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
          const route = result.routes[0]?.legs[0];
          if (route) {
            setRouteInfo({
              distance: route.distance?.text || 'N/A',
              duration: route.duration?.text || 'N/A',
              steps: route.steps.map((s) => s.instructions.replace(/<[^>]*>?/gm, '')).slice(0, 5),
            });
            toast.success(`Route found: ${route.distance?.text}, ${route.duration?.text}`);
          }
        } else {
          console.warn('Directions request failed:', status);
          toast.error(`Route calculation failed (${status})`);
        }
      }
    );
  }, [directionsService, directionsRenderer, origin, destination, travelMode]);

  const handleClearRoute = () => {
    if (directionsRenderer) {
      directionsRenderer.setDirections({ routes: [] } as any);
    }
    setRouteInfo(null);
  };

  return (
    <div className="absolute top-14 right-4 z-10 font-sans">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-2xl border border-blue-400/30 backdrop-blur-xl text-xs font-semibold transition-all transform active:scale-95 cursor-pointer"
        >
          <Navigation className="w-4 h-4" />
          <span>Directions</span>
        </button>
      ) : (
        <div className="w-80 md:w-96 bg-black/90 backdrop-blur-2xl border border-white/20 rounded-2xl p-3 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Navigation className="w-4 h-4 text-blue-400" />
              <span>Route & Directions</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Travel Mode Selector */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
            <button
              onClick={() => setTravelMode('DRIVING')}
              className={`flex flex-col items-center py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                travelMode === 'DRIVING' ? 'bg-blue-600 text-white shadow-md' : 'text-white/60 hover:text-white'
              }`}
            >
              <Car className="w-4 h-4 mb-0.5" />
              Drive
            </button>
            <button
              onClick={() => setTravelMode('WALKING')}
              className={`flex flex-col items-center py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                travelMode === 'WALKING' ? 'bg-blue-600 text-white shadow-md' : 'text-white/60 hover:text-white'
              }`}
            >
              <Footprints className="w-4 h-4 mb-0.5" />
              Walk
            </button>
            <button
              onClick={() => setTravelMode('TRANSIT')}
              className={`flex flex-col items-center py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                travelMode === 'TRANSIT' ? 'bg-blue-600 text-white shadow-md' : 'text-white/60 hover:text-white'
              }`}
            >
              <Bus className="w-4 h-4 mb-0.5" />
              Transit
            </button>
            <button
              onClick={() => setTravelMode('BICYCLING')}
              className={`flex flex-col items-center py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                travelMode === 'BICYCLING' ? 'bg-blue-600 text-white shadow-md' : 'text-white/60 hover:text-white'
              }`}
            >
              <Bike className="w-4 h-4 mb-0.5" />
              Bike
            </button>
          </div>

          {/* Origin & Destination Inputs */}
          <div className="space-y-2">
            <div className="relative">
              <span className="absolute left-2.5 top-2.5 text-[10px] font-bold text-emerald-400 uppercase">A</span>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Origin (e.g., My Location)"
                className="w-full bg-white/10 text-white placeholder-white/40 text-xs rounded-xl pl-8 pr-2.5 py-2 border border-white/10 focus:outline-none focus:border-blue-400"
              />
            </div>
            <div className="relative">
              <span className="absolute left-2.5 top-2.5 text-[10px] font-bold text-rose-400 uppercase">B</span>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Destination (e.g., Taj Mahal, Agra)"
                className="w-full bg-white/10 text-white placeholder-white/40 text-xs rounded-xl pl-8 pr-2.5 py-2 border border-white/10 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* Calculate & Clear Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCalculateRoute}
              disabled={isCalculating}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isCalculating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5" />
              )}
              <span>Find Route</span>
            </button>

            {routeInfo && (
              <button
                onClick={handleClearRoute}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Route Summary Results */}
          {routeInfo && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-blue-300 font-bold">
                <span>Distance: {routeInfo.distance}</span>
                <span>Est. Time: {routeInfo.duration}</span>
              </div>
              {routeInfo.steps.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-white/10 text-[11px] text-white/70">
                  <div className="font-semibold text-white/90">First Steps:</div>
                  {routeInfo.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <ArrowRight className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Map Content ── */
function MapContent({
  userLocation,
  selectedPlace,
  isLocating,
  onLocateMe,
  onSelectPlace,
}: {
  userLocation: LocationState;
  selectedPlace: { lat: number; lng: number; name: string; address?: string } | null;
  isLocating: boolean;
  onLocateMe: () => void;
  onSelectPlace: (place: { lat: number; lng: number; name: string; address?: string } | null) => void;
}) {
  const map = useMap();
  const [userMarkerRef, userMarker] = useAdvancedMarkerRef();
  const [placeMarkerRef, placeMarker] = useAdvancedMarkerRef();
  const [userWindowOpen, setUserWindowOpen] = useState(false);
  const [placeWindowOpen, setPlaceWindowOpen] = useState(true);

  useEffect(() => {
    if (map && userLocation) {
      map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
    }
  }, [map, userLocation]);

  return (
    <>
      <PlacesSearchOverlay
        currentLocation={userLocation}
        onSelectPlace={(place) => {
          onSelectPlace(place);
          setPlaceWindowOpen(true);
        }}
      />

      <DirectionsOverlay userLocation={userLocation} selectedPlace={selectedPlace} />

      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
        <button
          onClick={onLocateMe}
          disabled={isLocating}
          className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl border border-blue-400/30 backdrop-blur-xl flex items-center gap-2 text-xs font-medium transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
          title="Recenter on My Location"
        >
          <LocateFixed className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">My Location</span>
        </button>
      </div>

      <AdvancedMarker
        ref={userMarkerRef}
        position={{ lat: userLocation.lat, lng: userLocation.lng }}
        onClick={() => setUserWindowOpen(true)}
      >
        <div className="relative flex items-center justify-center">
          <span className="absolute w-8 h-8 bg-blue-500/40 rounded-full animate-ping" />
          <Pin background="#2563eb" glyphColor="#ffffff" borderColor="#1e40af" />
        </div>
      </AdvancedMarker>

      {userWindowOpen && (
        <InfoWindow anchor={userMarker} onCloseClick={() => setUserWindowOpen(false)}>
          <div className="p-1 text-slate-900 font-sans">
            <div className="flex items-center gap-1.5 font-bold text-sm text-blue-700">
              <Navigation className="w-4 h-4" />
              <span>Your Current Location</span>
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Latitude: {userLocation.lat.toFixed(5)} <br />
              Longitude: {userLocation.lng.toFixed(5)}
            </div>
            {userLocation.accuracy && (
              <div className="text-[10px] text-slate-400 mt-1">
                Accuracy: ±{Math.round(userLocation.accuracy)} meters
              </div>
            )}
          </div>
        </InfoWindow>
      )}

      {selectedPlace && (
        <>
          <AdvancedMarker
            ref={placeMarkerRef}
            position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
            onClick={() => setPlaceWindowOpen(true)}
          >
            <Pin background="#ea580c" glyphColor="#ffffff" borderColor="#c2410c" />
          </AdvancedMarker>

          {placeWindowOpen && (
            <InfoWindow anchor={placeMarker} onCloseClick={() => setPlaceWindowOpen(false)}>
              <div className="p-1 text-slate-900 font-sans max-w-xs">
                <div className="font-bold text-sm text-slate-900">{selectedPlace.name}</div>
                {selectedPlace.address && (
                  <div className="text-xs text-slate-600 mt-0.5">{selectedPlace.address}</div>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold mt-2 hover:underline"
                >
                  Get Directions <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </InfoWindow>
          )}
        </>
      )}
    </>
  );
}

export function GoogleMapsView({
  className = '',
  initialLat,
  initialLng,
  title = 'Google Maps Location Hub',
}: {
  className?: string;
  initialLat?: number;
  initialLng?: number;
  title?: string;
}) {
  const [userLocation, setUserLocation] = useState<LocationState>(() => ({
    lat: initialLat || DEFAULT_CENTER.lat,
    lng: initialLng || DEFAULT_CENTER.lng,
  }));
  const [isLocating, setIsLocating] = useState(false);
  const [mapTheme, setMapTheme] = useState<MapTheme>('standard');
  const [selectedPlace, setSelectedPlace] = useState<{
    lat: number;
    lng: number;
    name: string;
    address?: string;
  } | null>(null);

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported in browser');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: LocationState = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setUserLocation(coords);
        setIsLocating(false);
        toast.success('Centered on your live GPS location');
      },
      (err) => {
        console.warn('Geolocation permission error:', err);
        setIsLocating(false);
        toast.info('Using default map coordinates (Grant location access in browser)');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  useEffect(() => {
    handleGetLocation();
  }, [handleGetLocation]);

  if (!hasValidKey) {
    return (
      <div className="flex items-center justify-center min-h-[500px] h-full w-full bg-slate-950 text-white p-6 rounded-3xl border border-white/10 font-sans">
        <div className="text-center max-w-lg space-y-4">
          <div className="inline-flex p-4 bg-amber-500/20 text-amber-400 rounded-3xl border border-amber-500/30">
            <AlertCircle className="w-10 h-10 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-white">Google Maps API Key Required</h2>
          <p className="text-sm text-slate-300">
            To view interactive maps, search live places, and display route directions, please configure your API key.
          </p>

          <div className="bg-black/60 rounded-2xl p-4 text-left text-xs space-y-2 border border-white/10">
            <p className="font-semibold text-blue-400">Step 1: Get an API Key</p>
            <p className="text-slate-300">
              Visit{' '}
              <a
                href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline font-mono"
              >
                Google Maps Platform Console
              </a>{' '}
              to generate a key.
            </p>

            <p className="font-semibold text-blue-400 pt-2">Step 2: Add Key to AI Studio Secrets</p>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              <li>
                Open <strong>Settings</strong> (⚙️ gear icon, <strong>top-right corner</strong>)
              </li>
              <li>
                Select <strong>Secrets</strong>
              </li>
              <li>
                Set secret name to <code>GOOGLE_MAPS_PLATFORM_KEY</code>
              </li>
              <li>Paste your key and press Enter</li>
            </ul>
            <p className="text-slate-400 text-[11px] pt-1">
              The application will automatically rebuild once your secret is saved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-[600px] min-h-[500px] rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-slate-900 ${className}`}>
      {/* Top Header & Theme Toggler */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 py-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-2xl border border-white/10 pointer-events-auto">
          <MapPin className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-white">{title}</span>
        </div>

        {/* Theme Toggler Buttons */}
        <div className="flex items-center gap-1 bg-black/80 backdrop-blur-xl p-1 rounded-2xl border border-white/15 pointer-events-auto shadow-lg">
          <button
            onClick={() => {
              setMapTheme('standard');
              toast.info('Standard Map Style');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
              mapTheme === 'standard' ? 'bg-blue-600 text-white shadow' : 'text-white/60 hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Standard</span>
          </button>

          <button
            onClick={() => {
              setMapTheme('dark');
              toast.info('Dark Theme Map Style');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
              mapTheme === 'dark' ? 'bg-blue-600 text-white shadow' : 'text-white/60 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-blue-300" />
            <span className="hidden sm:inline">Dark</span>
          </button>

          <button
            onClick={() => {
              setMapTheme('satellite');
              toast.info('Satellite Hybrid Style');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
              mapTheme === 'satellite' ? 'bg-blue-600 text-white shadow' : 'text-white/60 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden sm:inline">Satellite</span>
          </button>
        </div>
      </div>

      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={{ lat: userLocation.lat, lng: userLocation.lng }}
          defaultZoom={13}
          mapId={mapTheme === 'satellite' ? undefined : 'DEMO_MAP_ID'}
          mapTypeId={mapTheme === 'satellite' ? 'hybrid' : 'roadmap'}
          styles={mapTheme === 'dark' ? (DARK_MAP_STYLE as any) : null}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          <MapContent
            userLocation={userLocation}
            selectedPlace={selectedPlace}
            isLocating={isLocating}
            onLocateMe={handleGetLocation}
            onSelectPlace={setSelectedPlace}
          />
        </Map>
      </APIProvider>
    </div>
  );
}

