import React, { useState, useEffect } from 'react';
import {
  WeatherData,
  getWeatherByCoords,
  getIpLocationAndWeather,
  getWeatherForCity
} from '@/lib/weatherService';

interface WeatherWidgetProps {
  location?: string;
  country?: string;
  date?: string;
  temp?: string;
  scale?: string;
  initialCity?: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  location: propLocation,
  country: propCountry,
  date: propDate,
  temp: propTemp,
  scale: propScale = 'Celsius',
  initialCity
}) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [useFahrenheit, setUseFahrenheit] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchLiveWeather() {
      setLoading(true);
      let data: WeatherData | null = null;

      // 1. If explicit initialCity passed or propLocation passed
      if (initialCity) {
        data = await getWeatherForCity(initialCity);
      } else if (propLocation && propLocation !== 'Current Location') {
        data = await getWeatherForCity(propLocation);
      }

      // 2. Browser Geolocation API if available
      if (!data && typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition | null>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve(pos),
              () => resolve(null),
              { timeout: 4000 }
            );
          });

          if (position) {
            data = await getWeatherByCoords(
              position.coords.latitude,
              position.coords.longitude,
              'Your Location'
            );
          }
        } catch (e) {
          console.warn('Geolocation fallback:', e);
        }
      }

      // 3. Fallback to IP location weather
      if (!data) {
        data = await getIpLocationAndWeather();
      }

      if (isMounted) {
        setWeatherData(data);
        setLoading(false);
      }
    }

    fetchLiveWeather();

    return () => {
      isMounted = false;
    };
  }, [initialCity, propLocation]);

  const formattedDate = propDate || new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  const displayCity = weatherData?.city || propLocation || 'Your Location';
  const displayCountry = weatherData?.country || propCountry || '';
  
  const displayTempC = weatherData ? `${weatherData.temperatureC}°` : propTemp || '22°';
  const displayTempF = weatherData ? `${weatherData.temperatureF}°` : '72°';
  const currentTemp = useFahrenheit ? displayTempF : displayTempC;
  const currentScale = useFahrenheit ? 'Fahrenheit' : propScale;

  return (
    <div
      className="weather-card shadow-2xl my-3 cursor-pointer hover:scale-[1.02] transition-transform duration-200 select-none"
      onClick={() => setUseFahrenheit(prev => !prev)}
      title="Click to toggle Celsius / Fahrenheit"
    >
      <div className="weather-container">
        <div className="cloud front">
          <span className="left-front"></span>
          <span className="right-front"></span>
        </div>
        <span className="sun sunshine"></span>
        <span className="sun"></span>
        <div className="cloud back">
          <span className="left-back"></span>
          <span className="right-back"></span>
        </div>
      </div>

      <div className="weather-card-header">
        <span>
          {loading ? 'Detecting Location...' : displayCity}
          {displayCountry ? <><br />{displayCountry}</> : null}
        </span>
        <span>{formattedDate}</span>
      </div>

      <span className="weather-temp">
        {loading ? '--°' : currentTemp}
      </span>

      <div className="weather-temp-scale">
        <span>{weatherData?.condition ? `${weatherData.condition} • ` : ''}{currentScale}</span>
      </div>
    </div>
  );
};

export default WeatherWidget;
