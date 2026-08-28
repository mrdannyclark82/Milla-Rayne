export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type WeatherKind = 'clear' | 'cloudy' | 'rain' | 'snow';

export interface AmbientState {
  timeOfDay: TimeOfDay;
  weather: WeatherKind;
  label: string;
  sky: string;
  skyFar: string;
  fetchedAt: number;
}

/** Rolla / south-central MO — home lab default until we store a preferred lat/lon. */
const DEFAULT_LAT = 37.9485;
const DEFAULT_LON = -91.7715;

export function getCurrentTimeOfDay(date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

/** WMO weather interpretation codes → coarse bucket. */
export function weatherFromCode(code: number): WeatherKind {
  if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86) {
    return 'snow';
  }
  if (
    code === 51 ||
    code === 53 ||
    code === 55 ||
    code === 56 ||
    code === 57 ||
    code === 61 ||
    code === 63 ||
    code === 65 ||
    code === 66 ||
    code === 67 ||
    code === 80 ||
    code === 81 ||
    code === 82 ||
    code === 95 ||
    code === 96 ||
    code === 99
  ) {
    return 'rain';
  }
  if (code === 1 || code === 2 || code === 3 || code === 45 || code === 48) {
    return 'cloudy';
  }
  return 'clear';
}

const SKY: Record<TimeOfDay, Record<WeatherKind, { near: string; far: string }>> = {
  dawn: {
    clear: { near: '#ffb48a', far: '#7a9ad4' },
    cloudy: { near: '#c9a090', far: '#6a7388' },
    rain: { near: '#8a9098', far: '#4a5560' },
    snow: { near: '#d8dce8', far: '#8a94a8' },
  },
  day: {
    clear: { near: '#87ceeb', far: '#4a90d9' },
    cloudy: { near: '#b0b8c4', far: '#6a7380' },
    rain: { near: '#6a7380', far: '#3a4450' },
    snow: { near: '#d0d8e4', far: '#8a9aaa' },
  },
  dusk: {
    clear: { near: '#ff8c5a', far: '#5a3a70' },
    cloudy: { near: '#a87868', far: '#4a3a50' },
    rain: { near: '#5a5868', far: '#2a2838' },
    snow: { near: '#b0a8b8', far: '#5a5068' },
  },
  night: {
    clear: { near: '#1a2040', far: '#050814' },
    cloudy: { near: '#1a1e2a', far: '#080a12' },
    rain: { near: '#12151c', far: '#050608' },
    snow: { near: '#2a3040', far: '#101418' },
  },
};

export function buildAmbient(
  timeOfDay: TimeOfDay,
  weather: WeatherKind,
  fetchedAt = Date.now()
): AmbientState {
  const sky = SKY[timeOfDay][weather];
  return {
    timeOfDay,
    weather,
    label: `${timeOfDay} · ${weather}`,
    sky: sky.near,
    skyFar: sky.far,
    fetchedAt,
  };
}

export function fallbackAmbient(): AmbientState {
  return buildAmbient(getCurrentTimeOfDay(), 'clear');
}

export async function fetchAmbient(signal?: AbortSignal): Promise<AmbientState> {
  const timeOfDay = getCurrentTimeOfDay();
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${DEFAULT_LAT}` +
      `&longitude=${DEFAULT_LON}&current=weather_code&timezone=America%2FChicago`;
    const r = await fetch(url, { signal, credentials: 'omit' });
    if (!r.ok) return buildAmbient(timeOfDay, 'clear');
    const d = (await r.json()) as { current?: { weather_code?: number } };
    const code = Number(d.current?.weather_code ?? 0);
    return buildAmbient(timeOfDay, weatherFromCode(code));
  } catch {
    return buildAmbient(timeOfDay, 'clear');
  }
}
