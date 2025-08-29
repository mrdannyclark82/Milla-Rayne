export interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export async function getCurrentWeather(city: string): Promise<WeatherData | null> {
  const API_KEY = process.env.OPENWEATHER_API_KEY;
  
  if (!API_KEY) {
    throw new Error("OpenWeatherMap API key not found");
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // City not found
      }
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      city: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      icon: data.weather[0].icon,
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw error;
  }
}

export function formatWeatherResponse(weather: WeatherData): string {
  const emoji = getWeatherEmoji(weather.icon);
  
  return `${emoji} **Weather in ${weather.city}, ${weather.country}**

🌡️ **Temperature:** ${weather.temperature}°C
☁️ **Conditions:** ${weather.description.charAt(0).toUpperCase() + weather.description.slice(1)}
💧 **Humidity:** ${weather.humidity}%
💨 **Wind Speed:** ${weather.windSpeed} m/s

The weather looks ${getWeatherDescription(weather.temperature, weather.description)}! ${getWeatherAdvice(weather.temperature, weather.description)}`;
}

function getWeatherEmoji(icon: string): string {
  const iconMap: { [key: string]: string } = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️',
  };
  return iconMap[icon] || '🌤️';
}

function getWeatherDescription(temp: number, description: string): string {
  if (temp >= 30) return "quite hot";
  if (temp >= 20) return "pleasant";
  if (temp >= 10) return "cool";
  if (temp >= 0) return "cold";
  return "very cold";
}

function getWeatherAdvice(temp: number, description: string): string {
  if (description.includes("rain")) {
    return "Don't forget your umbrella!";
  }
  if (description.includes("snow")) {
    return "Bundle up and stay warm!";
  }
  if (temp >= 30) {
    return "Stay hydrated and find some shade!";
  }
  if (temp <= 0) {
    return "Dress warmly and be careful of icy conditions!";
  }
  return "Have a wonderful day!";
}