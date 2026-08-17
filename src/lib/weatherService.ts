export interface WeatherData {
  city: string;
  country: string;
  temperatureC: number;
  temperatureF: number;
  condition: string;
  humidity?: number;
  windSpeedKmH?: number;
  latitude: number;
  longitude: number;
}

// Map WMO Weather Codes to Human-Readable Conditions
function getWeatherConditionLabel(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1 || code === 2 || code === 3) return 'Partly cloudy';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
}

/**
 * 1. Get user IP location & weather fallback
 */
export async function getIpLocationAndWeather(): Promise<WeatherData | null> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.latitude && data.longitude) {
      const weather = await getWeatherByCoords(
        data.latitude,
        data.longitude,
        data.city || 'Current Location',
        data.country_name || ''
      );
      return weather;
    }
  } catch (e) {
    console.warn('IP geolocator failed:', e);
  }
  return null;
}

/**
 * 2. Weather by Coordinates using Open-Meteo (100% free, reliable, no key required)
 */
export async function getWeatherByCoords(
  lat: number,
  lon: number,
  cityName = 'Current Location',
  countryName = ''
): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.current_weather) {
      const cw = data.current_weather;
      const code = cw.weathercode;
      const condition = getWeatherConditionLabel(code);
      const tempC = Math.round(cw.temperature);
      const tempF = Math.round((tempC * 9) / 5 + 32);

      return {
        city: cityName,
        country: countryName,
        temperatureC: tempC,
        temperatureF: tempF,
        condition,
        windSpeedKmH: Math.round(cw.windspeed || 0),
        latitude: lat,
        longitude: lon,
      };
    }
  } catch (e) {
    console.warn('Open-Meteo weather fetch error:', e);
  }
  return null;
}

/**
 * 3. Search Weather for explicit target city (e.g., "London", "Tokyo", "Delhi", "New York")
 */
export async function getWeatherForCity(city: string): Promise<WeatherData | null> {
  try {
    const cleanCity = city.trim();
    if (!cleanCity) return null;

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanCity)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) return null;
    const geoData = await geoRes.json();
    if (geoData.results && geoData.results.length > 0) {
      const first = geoData.results[0];
      return await getWeatherByCoords(first.latitude, first.longitude, first.name, first.country || '');
    }
  } catch (e) {
    console.warn('City weather search failed:', e);
  }
  return null;
}

/**
 * 4. Extract target city name from query if user specifically asked about a city
 */
export function extractCityFromQuery(query: string): string | null {
  // Common weather query patterns
  const patterns = [
    /weather\s+(in|at|for|of)\s+([a-zA-Z\s,]+)/i,
    /temperature\s+(in|at|for|of)\s+([a-zA-Z\s,]+)/i,
    /how's\s+the\s+weather\s+in\s+([a-zA-Z\s,]+)/i,
    /how\s+is\s+the\s+weather\s+in\s+([a-zA-Z\s,]+)/i,
    /forecast\s+(for|in)\s+([a-zA-Z\s,]+)/i,
    /climate\s+(in|at|for)\s+([a-zA-Z\s,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) {
      const rawTarget = match[2] || match[1];
      if (rawTarget) {
        const cityCandidate = rawTarget
          .replace(/\b(today|now|right now|this week|currently|please|tell me|what is)\b/gi, '')
          .replace(/[?.!]/g, '')
          .trim();

        if (cityCandidate.length > 1 && !['in', 'at', 'for', 'of', 'the'].includes(cityCandidate.toLowerCase())) {
          return cityCandidate;
        }
      }
    }
  }
  return null;
}

/**
 * 5. Automatically detect user's city/weather OR query target city, and generate prompt system context
 */
export async function getCityAndWeatherContext(query: string): Promise<string> {
  const targetCity = extractCityFromQuery(query);
  let weatherData: WeatherData | null = null;

  if (targetCity) {
    weatherData = await getWeatherForCity(targetCity);
  }

  if (!weatherData) {
    // Attempt browser geolocation first
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (p) => resolve(p),
            () => resolve(null),
            { timeout: 3000 }
          );
        });
        if (pos) {
          weatherData = await getWeatherByCoords(pos.coords.latitude, pos.coords.longitude, 'Detected Local City');
        }
      } catch (e) {}
    }

    // IP Fallback if browser location unavailable
    if (!weatherData) {
      weatherData = await getIpLocationAndWeather();
    }
  }

  if (weatherData) {
    const isExplicitWeatherQuery = /\b(weather|forecast|temperature|temp|climate|celsius|fahrenheit|sunny|rainy|cloudy|windy|rain|snow|umbrella|outside|forecasts|hot|cold|degrees)\b/i.test(query) || !!targetCity;

    if (isExplicitWeatherQuery) {
      return `[REAL-TIME LOCATION & WEATHER CONTEXT: City: ${weatherData.city}${weatherData.country ? `, ${weatherData.country}` : ''} | Current Temperature: ${weatherData.temperatureC}°C (${weatherData.temperatureF}°F) | Conditions: ${weatherData.condition}${weatherData.windSpeedKmH ? ` | Wind Speed: ${weatherData.windSpeedKmH} km/h` : ''}. Use this live weather data to give a direct, personalized weather answer.]`;
    }

    return `[REAL-TIME LOCATION CONTEXT: City: ${weatherData.city}${weatherData.country ? `, ${weatherData.country}` : ''}. Note: This is silent background context. Do NOT mention weather, temperature, or location unless the user explicitly asked about it.]`;
  }

  return `[REAL-TIME CONTEXT: Current Date & Time: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}]`;
}
