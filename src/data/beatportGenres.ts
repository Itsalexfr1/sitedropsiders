export interface BeatportGenreMeta {
  id: number;
  slug: string;
  name: string;
  aliases: string[];
}

export const BEATPORT_GENRES: BeatportGenreMeta[] = [
  { id: 95, slug: "140-deep-dubstep-grime", name: "140 / Deep Dubstep / Grime", aliases: ["140", "deep dubstep", "grime", "140 deep dubstep grime"] },
  { id: 89, slug: "afro-house", name: "Afro House", aliases: ["afro", "afro house"] },
  { id: 98, slug: "amapiano", name: "Amapiano", aliases: ["amapiano", "piano"] },
  { id: 100, slug: "ambient-experimental", name: "Ambient / Experimental", aliases: ["ambient", "experimental", "ambient experimental"] },
  { id: 85, slug: "bass-club", name: "Bass / Club", aliases: ["bass club", "club", "bass / club"] },
  { id: 91, slug: "bass-house", name: "Bass House", aliases: ["bass house"] },
  { id: 101, slug: "brazilian-funk", name: "Brazilian Funk", aliases: ["funk", "baile funk", "brazilian funk"] },
  { id: 9, slug: "breaks-breakbeat-uk-bass", name: "Breaks / Breakbeat / UK Bass", aliases: ["breaks", "breakbeat", "uk bass", "breaks breakbeat uk bass"] },
  { id: 39, slug: "dance-pop", name: "Dance / Pop", aliases: ["dance", "dance pop", "pop", "dance / pop"] },
  { id: 12, slug: "deep-house", name: "Deep House", aliases: ["deep house"] },
  { id: 16, slug: "dj-tools-acapellas", name: "DJ Tools / Acapellas", aliases: ["dj tools", "acapellas", "acapella", "tools", "dj tools acapellas"] },
  { id: 63, slug: "downtempo", name: "Downtempo", aliases: ["chillout", "down tempo", "downtempo"] },
  { id: 1, slug: "drum-bass", name: "Drum & Bass", aliases: ["drum & bass", "drum and bass", "drum n bass", "dnb", "drum bass", "drum-bass", "drum'n'bass"] },
  { id: 18, slug: "dubstep", name: "Dubstep", aliases: ["dubstep"] },
  { id: 94, slug: "electro-classic-detroit-modern", name: "Electro (Classic / Detroit / Modern)", aliases: ["electro", "electro classic", "detroit electro", "electro classic detroit modern"] },
  { id: 3, slug: "electronica", name: "Electronica", aliases: ["electronica"] },
  { id: 81, slug: "funky-house", name: "Funky House", aliases: ["funky house", "funky"] },
  { id: 8, slug: "hard-dance-hardcore-neo-rave", name: "Hard Dance / Hardcore / Neo Rave", aliases: ["hard dance", "hardcore", "neo rave", "hardstyle", "hard dance / hardcore / neo rave", "neorave", "hard dance hardcore neo rave", "hard dance neo rave"] },
  { id: 2, slug: "hard-techno", name: "Hard Techno", aliases: ["hard techno", "hardtechno", "schranz", "industrial techno"] },
  { id: 5, slug: "house", name: "House", aliases: ["house"] },
  { id: 37, slug: "indie-dance", name: "Indie Dance", aliases: ["indie dance", "indie"] },
  { id: 112, slug: "indie-tech", name: "Indie Tech", aliases: ["indie tech"] },
  { id: 97, slug: "jackin-house", name: "Jackin House", aliases: ["jackin house", "jackin"] },
  { id: 111, slug: "latin-electronic", name: "Latin Electronic", aliases: ["latin electronic", "latin"] },
  { id: 96, slug: "mainstage", name: "Mainstage", aliases: ["mainstage", "edm", "big room", "festival"] },
  { id: 90, slug: "melodic-house-techno", name: "Melodic House & Techno", aliases: ["melodic house & techno", "melodic techno", "melodic house", "melodic", "melodic house techno"] },
  { id: 14, slug: "minimal-deep-tech", name: "Minimal / Deep Tech", aliases: ["minimal / deep tech", "minimal", "deep tech", "minimal tech", "minimal deep tech"] },
  { id: 50, slug: "nu-disco-disco", name: "Nu Disco / Disco", aliases: ["nu disco / disco", "nu disco", "disco", "nudisco", "nu disco disco"] },
  { id: 93, slug: "organic-house", name: "Organic House", aliases: ["organic house", "downtempo house"] },
  { id: 15, slug: "progressive-house", name: "Progressive House", aliases: ["progressive house", "prog house", "progressive"] },
  { id: 13, slug: "psy-trance", name: "Psy-Trance", aliases: ["psy-trance", "psy trance", "psytrance", "goa"] },
  { id: 11, slug: "tech-house", name: "Tech House", aliases: ["tech house"] },
  { id: 6, slug: "techno-peak-time-driving", name: "Techno (Peak Time / Driving)", aliases: ["techno", "peak time techno", "driving techno", "techno peak time driving", "techno (peak time / driving)", "peak time"] },
  { id: 92, slug: "techno-raw-deep-hypnotic", name: "Techno (Raw / Deep / Hypnotic)", aliases: ["raw techno", "deep techno", "hypnotic techno", "techno raw deep hypnotic", "techno (raw / deep / hypnotic)"] },
  { id: 7, slug: "trance-main-floor", name: "Trance (Main Floor)", aliases: ["trance", "main floor trance", "uplifting trance", "trance main floor", "trance (main floor)"] },
  { id: 99, slug: "trance-raw-deep-hypnotic", name: "Trance (Raw / Deep / Hypnotic)", aliases: ["raw trance", "deep trance", "hypnotic trance", "trance raw deep hypnotic", "trance (raw / deep / hypnotic)"] },
  { id: 38, slug: "trap-future-bass", name: "Trap / Future Bass", aliases: ["trap / future bass", "trap", "future bass", "trap future bass"] },
  { id: 86, slug: "uk-garage-bassline", name: "UK Garage / Bassline", aliases: ["uk garage / bassline", "uk garage", "bassline", "ukg", "garage", "uk garage bassline"] }
];

export function cleanGenreQuery(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\b[nN]\b/g, ' and ')
    .replace(/['"/\\+-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveBeatportGenre(query: string): BeatportGenreMeta {
  if (!query) return BEATPORT_GENRES.find(g => g.slug === 'house')!;
  const rawLower = query.toLowerCase().trim();
  const cleaned = cleanGenreQuery(query);

  // 1. Direct match on slug
  let match = BEATPORT_GENRES.find(g => g.slug === rawLower || g.slug === cleaned.replace(/\s+/g, '-'));
  if (match) return match;

  // 2. Direct match on official name
  match = BEATPORT_GENRES.find(g => cleanGenreQuery(g.name) === cleaned);
  if (match) return match;

  // 3. Exact match on aliases
  match = BEATPORT_GENRES.find(g => g.aliases.some(a => cleanGenreQuery(a) === cleaned || a.toLowerCase() === rawLower));
  if (match) return match;

  // 4. Substring inclusion match (prioritize highest common length score)
  const candidates: Array<{ genre: BeatportGenreMeta; score: number }> = [];
  for (const g of BEATPORT_GENRES) {
    for (const a of [g.name, ...g.aliases]) {
      const ca = cleanGenreQuery(a);
      if (cleaned.includes(ca) || ca.includes(cleaned)) {
        const score = Math.min(ca.length, cleaned.length);
        candidates.push({ genre: g, score });
      }
    }
  }
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].genre;
  }

  return BEATPORT_GENRES.find(g => g.slug === 'house')!;
}



export function cleanTop10TrackTitle(name?: string, mixName?: string): string {
  let combined = (name || '').trim();
  const cleanMix = (mixName || '').trim();

  if (cleanMix && !combined.toLowerCase().includes(cleanMix.toLowerCase())) {
    const isGeneric = /^(original|extended|radio)(\s*(mix|version|edit|cut))?$/i.test(cleanMix);
    if (!isGeneric) {
      combined = `${combined} (${cleanMix})`;
    }
  }

  return combined
    .replace(/\s*\(\s*(?:original|extended)\s*(?:mix|version|edit|cut)?\s*\)/gi, '')
    .replace(/\s*\[\s*(?:original|extended)\s*(?:mix|version|edit|cut)?\s*\]/gi, '')
    .replace(/\s*-\s*(?:original|extended)\s*(?:mix|version|edit|cut)?\s*$/gi, '')
    .replace(/\bextended\s+remix\b/gi, 'Remix')
    .replace(/(\(\s*[^)]*?\b)extended\s+remix(\b[^)]*?\))/gi, '$1Remix$2')
    .replace(/(\(\s*[^)]*?)\bextended\s*([^)]*?\))/gi, '$1$2')
    .replace(/(\[\s*[^\]]*?)\bextended\s*([^\]]*?\])/gi, '$1$2')
    .replace(/\bextended\b\s*/gi, '')
    .replace(/\s*\(\s*\)/g, '')
    .replace(/\s*\[\s*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
