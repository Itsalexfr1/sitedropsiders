import defaultThemes from '../data/blindtest_themes.json';

export interface BlindTestTheme {
  id: string;
  title: string;
  description: string;
  deezerPlaylistId: string;
  deezerPlaylistUrl?: string;
  coverUrl?: string;
  color: string;
  badge?: string;
  trackCount?: number;
  enabled: boolean;
}

export interface DeezerTrack {
  id: string | number;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  previewUrl: string;
  duration?: number;
}

export interface BlindTestRound {
  id: string;
  correctTrack: DeezerTrack;
  options: DeezerTrack[];
}

const STORAGE_KEY = 'dropsiders_blindtest_themes_v1';

/**
 * Extracts a Deezer playlist ID from various formats:
 * - Direct ID: "3264808726"
 * - URL: "https://www.deezer.com/fr/playlist/3264808726"
 * - Short URL / parameters: "https://www.deezer.com/playlist/3264808726?utm_source=..."
 */
export function extractDeezerPlaylistId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/(?:deezer\.com\/(?:[a-z]{2}\/)?playlist\/)(\d+)/i);
  if (match && match[1]) {
    return match[1];
  }
  const genericMatch = trimmed.match(/playlist\/(\d+)/i);
  return genericMatch ? genericMatch[1] : null;
}

/**
 * Fetch a Deezer playlist with multiple CORS fallback mechanisms:
 * 1. Cloudflare / Vite proxy: `/api/deezer/playlist/${id}`
 * 2. Public CORS proxy: allorigins.win
 * 3. Public CORS proxy: corsproxy.io
 */
export async function fetchDeezerPlaylist(
  playlistIdOrUrl: string
): Promise<{ title: string; coverUrl: string; tracks: DeezerTrack[]; rawCount: number }> {
  const id = extractDeezerPlaylistId(playlistIdOrUrl);
  if (!id) {
    throw new Error("L'ID ou le lien de la playlist Deezer est invalide.");
  }

  const deezerDirectUrl = `https://api.deezer.com/playlist/${id}`;
  const endpoints = [
    `/api/deezer/playlist/${id}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(deezerDirectUrl)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(deezerDirectUrl)}`,
  ];

  let rawData: any = null;
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data && (data.tracks || data.id || data.title)) {
        rawData = data;
        break;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!rawData) {
    throw new Error(
      lastError?.message ||
        "Impossible de charger la playlist Deezer. Vérifiez que la playlist est bien publique."
    );
  }

  if (rawData.error) {
    throw new Error(rawData.error.message || "Erreur Deezer: Playlist introuvable ou privée.");
  }

  const rawTracks: any[] = rawData.tracks?.data || [];
  
  // Filter only tracks with playable MP3 preview
  const tracks: DeezerTrack[] = rawTracks
    .filter((t: any) => t.preview && t.preview.length > 5)
    .map((t: any) => ({
      id: t.id,
      title: cleanTrackTitle(t.title_short || t.title),
      artist: t.artist?.name || 'Artiste Inconnu',
      album: t.album?.title || '',
      coverUrl:
        t.album?.cover_xl ||
        t.album?.cover_big ||
        t.album?.cover_medium ||
        rawData.picture_xl ||
        rawData.picture_big ||
        '',
      previewUrl: t.preview,
      duration: t.duration || 30,
    }));

  return {
    title: rawData.title || 'Playlist Deezer',
    coverUrl: rawData.picture_xl || rawData.picture_big || rawData.picture_medium || '',
    tracks,
    rawCount: rawTracks.length,
  };
}

/**
 * Remove noisy suffixes like "(Radio Edit)", "[Official Audio]" to make guessing clean
 */
function cleanTrackTitle(title: string): string {
  if (!title) return '';
  return title
    .replace(/\s*\(Radio Edit\)/gi, '')
    .replace(/\s*\(Original Mix\)/gi, '')
    .replace(/\s*\(Extended Mix\)/gi, '')
    .replace(/\s*\[.*?\]/g, '')
    .trim();
}

/**
 * Generate randomized rounds for the blind test
 */
export function generateGameRounds(tracks: DeezerTrack[], roundCount = 10): BlindTestRound[] {
  if (!tracks || tracks.length < 4) {
    throw new Error('La playlist doit contenir au moins 4 morceaux avec extraits audio.');
  }

  // Shuffle all tracks
  const shuffled = [...tracks].sort(() => 0.5 - Math.random());
  const selectedCorrect = shuffled.slice(0, Math.min(roundCount, shuffled.length));

  return selectedCorrect.map((correct, index) => {
    // Pick 3 decoys from remaining tracks
    const otherTracks = tracks.filter((t) => t.id !== correct.id);
    const shuffledOthers = [...otherTracks].sort(() => 0.5 - Math.random());
    const decoys = shuffledOthers.slice(0, 3);

    const options = [correct, ...decoys].sort(() => 0.5 - Math.random());

    return {
      id: `round_${index + 1}_${correct.id}`,
      correctTrack: correct,
      options,
    };
  });
}

/**
 * Load Themes (API -> localStorage -> default JSON)
 */
export async function getBlindTestThemes(): Promise<BlindTestTheme[]> {
  try {
    const res = await fetch('/api/blindtest/themes');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch {
    // API not available, proceed to fallback
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  return defaultThemes as BlindTestTheme[];
}

/**
 * Save Themes (API + localStorage)
 */
export async function saveBlindTestThemes(themes: BlindTestTheme[]): Promise<boolean> {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));

  try {
    const res = await fetch('/api/blindtest/themes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ themes }),
    });
    return res.ok;
  } catch {
    return true; // Local storage is already saved
  }
}
