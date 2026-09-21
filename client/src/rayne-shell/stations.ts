export const STATION_IDS = [
  'home',
  'work',
  'chill',
  'video',
  'studio',
] as const;

export type StationId = (typeof STATION_IDS)[number];

export type OrbitPose = { theta: number; phi: number; r: number };

export interface StationDef {
  id: StationId;
  label: string;
  where: string;
  hint: string;
  placeholder: string;
  key: string;
  orbit: OrbitPose;
  lookY: number;
  avatar: [number, number, number];
  bg: string;
  fogNear: number;
  fogFar: number;
}

export const STATION_STORAGE_KEY = 'milla.rayne-shell.station';
export const STATION_VIDEO_KEY = 'milla.rayne-shell.video-last';

export const STATIONS: Record<StationId, StationDef> = {
  home: {
    id: 'home',
    label: 'Home',
    where: 'in the room',
    hint: 'Drag to orbit · scroll to zoom · stations on the right',
    placeholder: 'Message Milla…',
    key: '1',
    orbit: { theta: 0.22, phi: 0.12, r: 3.6 },
    lookY: 1.05,
    avatar: [0, 0, 0.12],
    bg: '#6f63a8',
    fogNear: 8,
    fogFar: 16,
  },
  work: {
    id: 'work',
    label: 'Work',
    where: 'at the desk',
    hint: 'Work station · Lab is ⌘L · drag to orbit',
    placeholder: 'Work with me…',
    key: '2',
    orbit: { theta: -0.28, phi: 0.16, r: 4.05 },
    lookY: 1.12,
    avatar: [-0.7, 0, 0.35],
    bg: '#1c2430',
    fogNear: 7,
    fogFar: 15,
  },
  chill: {
    id: 'chill',
    label: 'Chill',
    where: 'on the couch',
    hint: 'Low lights · orbit the room · just be here',
    placeholder: 'Talk to me…',
    key: '3',
    orbit: { theta: 0.42, phi: 0.08, r: 3.85 },
    lookY: 0.98,
    avatar: [0.2, 0, 0.45],
    bg: '#2a1c18',
    fogNear: 6,
    fogFar: 14,
  },
  video: {
    id: 'video',
    label: 'Video',
    where: 'watching with you',
    hint: 'Paste a YouTube link or drop a local file · orbit still works',
    placeholder: 'What are we watching?',
    key: '4',
    orbit: { theta: 0.05, phi: 0.14, r: 4.25 },
    lookY: 1.08,
    avatar: [0.95, 0, 0.55],
    bg: '#0c0c12',
    fogNear: 7,
    fogFar: 16,
  },
  studio: {
    id: 'studio',
    label: 'Studio',
    where: 'in the studio',
    hint: 'Studio station · Comfy lives in Lab · drag to orbit',
    placeholder: 'Make something with me…',
    key: '5',
    orbit: { theta: 0.32, phi: 0.18, r: 3.95 },
    lookY: 1.1,
    avatar: [0, 0, 0.2],
    bg: '#1a1424',
    fogNear: 7,
    fogFar: 15,
  },
};

export const STATION_LIST: StationDef[] = STATION_IDS.map((id) => STATIONS[id]);

export function isStationId(value: unknown): value is StationId {
  return (
    typeof value === 'string' &&
    (STATION_IDS as readonly string[]).includes(value)
  );
}

export function loadStation(): StationId {
  if (typeof window === 'undefined') return 'home';
  const fromHash = stationFromLocation();
  if (fromHash) return fromHash;
  try {
    const raw = window.localStorage.getItem(STATION_STORAGE_KEY);
    if (isStationId(raw)) return raw;
  } catch {
    /* private mode */
  }
  return 'home';
}

export function saveStation(id: StationId): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STATION_STORAGE_KEY, id);
  } catch {
    /* ignore quota */
  }
  const next = `#station=${id}`;
  if (window.location.hash !== next) {
    window.history.replaceState(null, '', next);
  }
}

export function stationFromLocation(): StationId | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#/, '');
  const hashParams = new URLSearchParams(hash.includes('=') ? hash : '');
  const fromHash = hashParams.get('station') || (isStationId(hash) ? hash : null);
  if (isStationId(fromHash)) return fromHash;
  const q = new URLSearchParams(window.location.search).get('station');
  return isStationId(q) ? q : null;
}

export function parseYoutubeId(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const url = new URL(s);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0] || '';
      return /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const v = url.searchParams.get('v');
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const parts = url.pathname.split('/').filter(Boolean);
      if (
        (parts[0] === 'embed' ||
          parts[0] === 'shorts' ||
          parts[0] === 'live' ||
          parts[0] === 'v') &&
        parts[1] &&
        /^[\w-]{11}$/.test(parts[1])
      ) {
        return parts[1];
      }
    }
  } catch {
    return null;
  }
  return null;
}
