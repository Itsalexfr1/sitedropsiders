import { 
    DEFAULT_TV_BLOCKS, 
    parseArtistAndEvent, 
    formatDurationExact, 
    DAYS_OF_WEEK, 
    ALL_DAYS, 
    WEEKDAYS, 
    WEEKEND_DAYS 
} from './tvSchedule';

export { DAYS_OF_WEEK, ALL_DAYS, WEEKDAYS, WEEKEND_DAYS, formatDurationExact };

export const STORAGE_RADIO_BLOCKS_KEY = 'dropsiders_radio_blocks';

export interface RadioTrackItem {
    id: string;
    title: string;
    artist?: string;
    youtubeId: string;
    duration?: number; // seconds
    category?: 'liveset' | 'clip';
    addedAt?: number;
}

export interface RadioScheduleBlock {
    id: string;
    name: string;
    title: string;
    timeSlot: string;
    startHour: number; // 0..23
    endHour: number; // 1..24 (24 = minuit)
    color: string;
    emoji: string;
    randomize: boolean;
    days?: number[]; // [1..6, 0] où 1=Lun, 6=Sam, 0=Dim. Vide ou absent = 7j/7
    tracks: RadioTrackItem[];
}

export interface ComputedRadioScheduleItem {
    id: string;
    blockId: string;
    blockTitle: string;
    blockColor: string;
    blockEmoji: string;
    title: string;
    artist: string;
    event: string;
    youtubeId: string;
    startTime: string;
    endTime: string;
    startSecondsFromMidnight: number;
    durationSeconds: number;
    durationFormatted: string;
    isCurrentlyLive: boolean;
    category?: 'liveset' | 'clip';
}

// Extraction de pistes vidéo par défaut pour alimenter les blocs de la radio
function createTrack(id: string, title: string, youtubeId: string, duration: number, category: 'liveset' | 'clip'): RadioTrackItem {
    const { artist } = parseArtistAndEvent(title);
    return {
        id,
        title,
        artist: artist || 'Artiste',
        youtubeId,
        duration,
        category,
        addedAt: Date.now()
    };
}

export const DEFAULT_RADIO_BLOCKS: RadioScheduleBlock[] = [
    {
        id: 'radio_bloc_1',
        name: 'Émission 1 · Morning Vibes',
        title: 'Morning Vibes Electro',
        timeSlot: '06h - 12h',
        startHour: 6,
        endHour: 12,
        color: '#f59e0b',
        emoji: '🌅',
        randomize: true,
        days: [1, 2, 3, 4, 5, 6, 0],
        tracks: [
            createTrack('rb_1_1', 'RÜFÜS DU SOL (DJ SET) - Mayan Warrior - Burning Man 2024', 'eQ-OVsdK-hM', 5400, 'liveset'),
            createTrack('rb_1_2', 'Tomorrowland Belgium 2026 | Official Aftermovie', 'k5yQBhDnrvM', 900, 'clip'),
            createTrack('rb_1_3', 'TOMAN | Awakenings Festival 2026', '5hj5UTZR_Ss', 5400, 'liveset'),
            createTrack('rb_1_4', 'Mau P | Awakenings Festival 2026', 'CNGB66x4ygk', 5400, 'liveset')
        ]
    },
    {
        id: 'radio_bloc_2',
        name: 'Émission 2 · Day Clubbing',
        title: 'Day Vibes & Clubbing',
        timeSlot: '12h - 18h',
        startHour: 12,
        endHour: 18,
        color: '#06b6d4',
        emoji: '☀️',
        randomize: true,
        days: [1, 2, 3, 4, 5, 6, 0],
        tracks: [
            createTrack('rb_2_1', 'Fisher WE2 | Tomorrowland 2026', 'DuXXMZLfAkQ', 3600, 'liveset'),
            createTrack('rb_2_2', 'JOHN SUMMIT LIVE @ ULTRA MIAMI MAIN STAGE 2026', 'aloPGSlq31Y', 4500, 'liveset'),
            createTrack('rb_2_3', 'The Chainsmokers Live at EDC Las Vegas 2026 (Official Full Set)', '3AQ_Srbe1lQ', 4500, 'liveset'),
            createTrack('rb_2_4', 'Laidback Luke B2B Chuckie Live at EDC Las Vegas 2026', 'IzsShRhd5cw', 4500, 'liveset')
        ]
    },
    {
        id: 'radio_bloc_3',
        name: 'Émission 3 · Sunset Warmup',
        title: 'Sunset House & Warmup',
        timeSlot: '18h - 22h',
        startHour: 18,
        endHour: 22,
        color: '#f97316',
        emoji: '🌇',
        randomize: true,
        days: [1, 2, 3, 4, 5, 6, 0],
        tracks: [
            createTrack('rb_3_1', 'Keinemusik (&ME, Rampa, Adam Port) - Mayan Warrior - Burning Man 2022', '2ECWX8GdDvA', 7200, 'liveset'),
            createTrack('rb_3_2', 'Mita Gami & Meir Briskman Orchestra Set - Mayan Warrior', 'm8EAmSvzgAQ', 5400, 'liveset'),
            createTrack('rb_3_3', 'Joris Voorn x Kevin de Vries | Awakenings Festival 2026', '_MqFasX6Fas', 5400, 'liveset')
        ]
    },
    {
        id: 'radio_bloc_4',
        name: 'Émission 4 · Festival Peaktime',
        title: 'Festival Peaktime 100%',
        timeSlot: '22h - 02h',
        startHour: 22,
        endHour: 2,
        color: '#ff1241',
        emoji: '🎪',
        randomize: true,
        days: [1, 2, 3, 4, 5, 6, 0],
        tracks: [
            createTrack('rb_4_1', 'ERIC PRYDZ LIVE @ ULTRA MUSIC FESTIVAL MIAMI 2026', 'hU-z3iV0LOg', 3600, 'liveset'),
            createTrack('rb_4_2', 'Kaskade Live at EDC Las Vegas 2026', 'l5wro3bMZWc', 4500, 'liveset'),
            createTrack('rb_4_3', 'Dimitri Vegas B2B Nico Moreno WE2 | Tomorrowland 2026', 'OTKgBZS8if0', 3600, 'liveset'),
            createTrack('rb_4_4', 'WORSHIP @ ULTRA MUSIC FESTIVAL MIAMI 2026 | UMF', 'V2lD_pq5c3M', 3600, 'liveset')
        ]
    },
    {
        id: 'radio_bloc_5',
        name: 'Émission 5 · Afterhours Bass & Hard',
        title: 'Afterhours Bass & Hard',
        timeSlot: '02h - 06h',
        startHour: 2,
        endHour: 6,
        color: '#8b5cf6',
        emoji: '🌙',
        randomize: true,
        days: [1, 2, 3, 4, 5, 6, 0],
        tracks: [
            createTrack('rb_5_1', 'Wiley Live @ Lost Lands 2025 - Full Set', '8YbWq5urfww', 3600, 'liveset'),
            createTrack('rb_5_2', 'Ray Volpe Live @ Lost Lands 2025 - Full Set', 'nyaGV-jeST8', 3600, 'liveset'),
            createTrack('rb_5_3', 'D-Block & S-te-Fan | Defqon.1 2026', 'IEJUg98lIHs', 3600, 'liveset'),
            createTrack('rb_5_4', 'Coone | Defqon.1 2026', 'fsHgYLT_FCc', 3600, 'liveset')
        ]
    }
];

/**
 * Heure de Paris en secondes depuis minuit
 */
export function getParisSeconds(): number {
    const now = new Date();
    try {
        const pStr = now.toLocaleString('en-US', { timeZone: 'Europe/Paris', hour12: false });
        const p = new Date(pStr);
        return p.getHours() * 3600 + p.getMinutes() * 60 + p.getSeconds();
    } catch {
        return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    }
}

/**
 * Jour de la semaine à Paris (0=Dimanche, 1=Lundi ... 6=Samedi)
 */
export function getParisDayOfWeek(): number {
    const now = new Date();
    try {
        const pStr = now.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
        const p = new Date(pStr);
        return p.getDay();
    } catch {
        return now.getDay();
    }
}

/**
 * Vérifie si une heure (0..23) appartient à un bloc horaire
 */
export function isHourInRadioBlock(b: RadioScheduleBlock, h: number): boolean {
    const start = b.startHour ?? 0;
    const rawEnd = b.endHour ?? 24;
    const end = rawEnd === 0 ? 24 : rawEnd;

    if (start < end) {
        return h >= start && h < end;
    } else if (start > end) {
        return h >= start || h < end;
    } else {
        return true;
    }
}

/**
 * Vérifie si un bloc est actif un jour donné (0..6 où 0=Dimanche)
 */
export function isRadioBlockActiveOnDay(b: RadioScheduleBlock, dayOfWeek: number): boolean {
    if (!b.days || !Array.isArray(b.days) || b.days.length === 0 || b.days.length === 7) {
        return true;
    }
    return b.days.includes(dayOfWeek);
}

/**
 * Formatage lisible des jours d'une émission radio
 */
export function formatRadioBlockDays(days?: number[]): string {
    if (!days || !Array.isArray(days) || days.length === 0 || days.length === 7) {
        return '7j/7 (Tous les jours)';
    }
    const sorted = [...days].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
    const isWeekdays = sorted.length === 5 && sorted.every(d => [1, 2, 3, 4, 5].includes(d));
    if (isWeekdays) return 'Lun - Ven (Semaine)';
    const isWeekend = sorted.length === 2 && sorted.includes(6) && sorted.includes(0);
    if (isWeekend) return 'Sam - Dim (Week-end)';
    const dayNames: Record<number, string> = { 1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Jeu', 5: 'Ven', 6: 'Sam', 0: 'Dim' };
    return sorted.map(d => dayNames[d] || String(d)).join(', ');
}

/**
 * Formatage créneau horaire
 */
export function formatRadioTimeSlot(startHour: number, endHour: number): string {
    const s = `${String(startHour).padStart(2, '0')}h`;
    const endNorm = endHour === 24 || endHour === 0 ? '00' : String(endHour).padStart(2, '0');
    const e = `${endNorm}h`;
    return `${s} - ${e}`;
}

/**
 * Tri chronologique de diffusion (06h00 -> 06h00)
 */
export function sortRadioBlocksByBroadcastOrder(blocks: RadioScheduleBlock[], autoRenumber: boolean = false): RadioScheduleBlock[] {
    if (!Array.isArray(blocks) || blocks.length <= 1) return blocks || [];

    const sorted = [...blocks].sort((a, b) => {
        const offsetA = ((a.startHour ?? 0) - 6 + 24) % 24;
        const offsetB = ((b.startHour ?? 0) - 6 + 24) % 24;
        if (offsetA !== offsetB) return offsetA - offsetB;
        return (a.endHour ?? 24) - (b.endHour ?? 24);
    });

    if (!autoRenumber) return sorted;

    return sorted.map((b, idx) => {
        const num = idx + 1;
        let nextName = b.name;
        if (b.name && /Émission\s+\d+/i.test(b.name)) {
            nextName = b.name.replace(/Émission\s+\d+/i, `Émission ${num}`);
        }
        return {
            ...b,
            name: nextName
        };
    });
}

/**
 * Retourne le bloc actuellement en direct selon le jour et l'heure
 */
export function getActiveRadioBlock(blocks: RadioScheduleBlock[], currentHour?: number, currentDay?: number): RadioScheduleBlock {
    const list = Array.isArray(blocks) && blocks.length > 0 ? blocks : DEFAULT_RADIO_BLOCKS;
    const nowHour = currentHour !== undefined ? currentHour : Math.floor(getParisSeconds() / 3600);
    const nowDay = currentDay !== undefined ? currentDay : getParisDayOfWeek();

    // 1. Chercher un bloc programmé pour aujourd'hui sur cette heure
    const todayBlocks = list.filter(b => isRadioBlockActiveOnDay(b, nowDay));
    const todayMatch = todayBlocks.find(b => isHourInRadioBlock(b, nowHour));
    if (todayMatch) return todayMatch;

    // 2. Chercher dans tous les blocs si pas de match spécifique aujourd'hui
    const anyMatch = list.find(b => isHourInRadioBlock(b, nowHour));
    if (anyMatch) return anyMatch;

    return list[0];
}

/**
 * Calcule la grille 24/7 de la radio pour une journée donnée
 */
export function computeRadioDaySchedule(
    blocks: RadioScheduleBlock[],
    date: Date = new Date()
): ComputedRadioScheduleItem[] {
    const list = Array.isArray(blocks) && blocks.length > 0 ? blocks : DEFAULT_RADIO_BLOCKS;
    const dayOfWeek = date.getDay();
    const activeBlocks = list.filter(b => isRadioBlockActiveOnDay(b, dayOfWeek));
    const sorted = sortRadioBlocksByBroadcastOrder(activeBlocks.length > 0 ? activeBlocks : list);

    const nowSec = getParisSeconds();
    const items: ComputedRadioScheduleItem[] = [];

    sorted.forEach((block) => {
        const startH = block.startHour ?? 0;
        let endH = block.endHour ?? 24;
        if (endH === 0) endH = 24;

        let blockDurationHours = endH - startH;
        if (blockDurationHours <= 0) blockDurationHours += 24;
        const blockDurationSec = blockDurationHours * 3600;

        const blockStartSec = startH * 3600;
        const blockEndSec = blockStartSec + blockDurationSec;

        const tracks = block.tracks && block.tracks.length > 0
            ? block.tracks
            : [{
                id: `${block.id}_fallback`,
                title: `${block.title} - Continuous Mix`,
                artist: 'DROPSIDERS RADIO',
                youtubeId: '8YbWq5urfww',
                duration: 3600,
                category: 'liveset' as const
            }];

        let cursor = 0;
        let trackIdx = 0;

        while (cursor < blockDurationSec && trackIdx < 100) {
            const track = tracks[trackIdx % tracks.length];
            const dur = track.duration && track.duration > 0 ? track.duration : 3600;
            const itemStartFromMidnight = (blockStartSec + cursor) % 86400;
            const itemEndFromMidnight = (itemStartFromMidnight + dur) % 86400;

            const sH = Math.floor(itemStartFromMidnight / 3600);
            const sM = Math.floor((itemStartFromMidnight % 3600) / 60);
            const eH = Math.floor(itemEndFromMidnight / 3600);
            const eM = Math.floor((itemEndFromMidnight % 3600) / 60);

            const isLive = (itemStartFromMidnight <= itemEndFromMidnight)
                ? (nowSec >= itemStartFromMidnight && nowSec < itemEndFromMidnight)
                : (nowSec >= itemStartFromMidnight || nowSec < itemEndFromMidnight);

            const { artist } = parseArtistAndEvent(track.title);

            items.push({
                id: `${block.id}_t_${trackIdx}_${track.id || track.youtubeId}`,
                blockId: block.id,
                blockTitle: block.title,
                blockColor: block.color,
                blockEmoji: block.emoji,
                title: track.title,
                artist: track.artist || artist || 'Artiste',
                event: block.title,
                youtubeId: track.youtubeId,
                startTime: `${String(sH).padStart(2, '0')}h${String(sM).padStart(2, '0')}`,
                endTime: `${String(eH).padStart(2, '0')}h${String(eM).padStart(2, '0')}`,
                startSecondsFromMidnight: itemStartFromMidnight,
                durationSeconds: dur,
                durationFormatted: formatDurationExact(dur),
                isCurrentlyLive: isLive,
                category: track.category
            });

            cursor += dur;
            trackIdx++;
        }
    });

    return items;
}
