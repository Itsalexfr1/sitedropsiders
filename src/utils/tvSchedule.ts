export interface TVVideo {
    id: string;
    title: string;
    description: string;
    youtubeId: string;
    duration?: number;
}

export interface PromoVideo {
    id: string;
    youtubeId: string;
    title: string;
    duration?: number;
}

export interface TVScheduleBlock {
    id: string;
    name: string;
    title: string;
    timeSlot: string;
    startHour: number; // 0..23
    endHour: number; // 1..24 (24 = midnight)
    color: string;
    emoji: string;
    randomize: boolean;
    days?: number[]; // [1..6, 0] where 1=Lundi, ..., 6=Samedi, 0=Dimanche. Empty/undefined = tous les jours (7/7)
    videos: TVVideo[];
}

export const DAYS_OF_WEEK = [
    { id: 1, value: 1, label: 'Lundi', short: 'Lun', initial: 'L' },
    { id: 2, value: 2, label: 'Mardi', short: 'Mar', initial: 'M' },
    { id: 3, value: 3, label: 'Mercredi', short: 'Mer', initial: 'M' },
    { id: 4, value: 4, label: 'Jeudi', short: 'Jeu', initial: 'J' },
    { id: 5, value: 5, label: 'Vendredi', short: 'Ven', initial: 'V' },
    { id: 6, value: 6, label: 'Samedi', short: 'Sam', initial: 'S' },
    { id: 0, value: 0, label: 'Dimanche', short: 'Dim', initial: 'D' },
] as const;

export const ALL_DAYS: number[] = [1, 2, 3, 4, 5, 6, 0];
export const WEEKDAYS: number[] = [1, 2, 3, 4, 5];
export const WEEKEND_DAYS: number[] = [6, 0];

export interface TVScheduleSegment {
    type: 'main' | 'promo';
    index: number;
    video: TVVideo | PromoVideo;
    duration: number;
}

export const STORAGE_TV_BLOCKS_KEY = 'dropsiders_tv_blocks';
export const STORAGE_PLAYLIST_KEY = 'dropsiders_tv_playlist_v2';
export const STORAGE_PROMOS_KEY = 'dropsiders_tv_promos_v2';
export const STORAGE_DURATIONS_KEY = 'dropsiders_tv_durations';

export const DEFAULT_TV_BLOCKS: TVScheduleBlock[] = [
    {
        id: 'bloc_1',
        name: 'Bloc 1 · Clips',
        title: 'Morning Clips',
        timeSlot: '06h - 10h',
        startHour: 6,
        endHour: 10,
        color: '#f59e0b',
        emoji: '🌅',
        randomize: true,
        videos: [
            {
                id: 'b1_1',
                title: 'Tomorrowland Belgium 2026 | Official Aftermovie',
                description: 'Diffusé sur DropsidersTV · Morning Clips',
                youtubeId: 'k5yQBhDnrvM',
                duration: 900
            },
            {
                id: 'b1_2',
                title: 'Anyma | Live from Atomium - Brussels, Belgium',
                description: 'Diffusé sur DropsidersTV · Morning Clips',
                youtubeId: 'oRb_81stwy8',
                duration: 2700
            },
            {
                id: 'b1_3',
                title: 'Porter Robinson Live at EDC Las Vegas 2026 (Official Full Set)',
                description: 'Diffusé sur DropsidersTV · Morning Clips',
                youtubeId: 'zkT8FjfBjYI',
                duration: 3600
            },
            {
                id: 'b1_4',
                title: 'Paul Kalkbrenner | Tomorrowland 2023',
                description: 'Diffusé sur DropsidersTV · Morning Clips',
                youtubeId: 'NsBiI-LyVm4',
                duration: 4200
            }
        ]
    },
    {
        id: 'bloc_2',
        name: 'Bloc 2 · Relive Festivals',
        title: 'Relive Festivals',
        timeSlot: '10h - 14h',
        startHour: 10,
        endHour: 14,
        color: '#06b6d4',
        emoji: '🎪',
        randomize: true,
        videos: [
            {
                id: 'b2_1',
                title: 'Fisher WE2 | Tomorrowland 2026',
                description: 'Diffusé sur DropsidersTV · Relive Festivals',
                youtubeId: 'DuXXMZLfAkQ',
                duration: 4500
            },
            {
                id: 'b2_2',
                title: 'The Chainsmokers Live at EDC Las Vegas 2026 (Official Full Set)',
                description: 'Diffusé sur DropsidersTV · Relive Festivals',
                youtubeId: '3AQ_Srbe1lQ',
                duration: 4200
            },
            {
                id: 'b2_3',
                title: 'Nicky Romero WE2 | Tomorrowland 2026',
                description: 'Diffusé sur DropsidersTV · Relive Festivals',
                youtubeId: 'TsyGMhx8izw',
                duration: 3600
            },
            {
                id: 'b2_4',
                title: 'Dimitri Vegas B2B Nico Moreno WE2 | Tomorrowland 2026',
                description: 'Diffusé sur DropsidersTV · Relive Festivals',
                youtubeId: 'OTKgBZS8if0',
                duration: 3600
            },
            {
                id: 'b2_5',
                title: 'Wiley Live @ Lost Lands 2025 - Full Set',
                description: 'Diffusé sur DropsidersTV · Relive Festivals',
                youtubeId: '8YbWq5urfww',
                duration: 3600
            }
        ]
    },
    {
        id: 'bloc_3',
        name: 'Bloc 3 · Day Time',
        title: 'Day Time',
        timeSlot: '14h - 18h',
        startHour: 14,
        endHour: 18,
        color: '#10b981',
        emoji: '☀️',
        randomize: true,
        videos: [
            {
                id: 'b3_1',
                title: 'JOHN SUMMIT LIVE @ ULTRA MIAMI MAIN STAGE 2026',
                description: 'Diffusé sur DropsidersTV · Day Time',
                youtubeId: 'aloPGSlq31Y',
                duration: 4500
            },
            {
                id: 'b3_2',
                title: 'Laidback Luke B2B Chuckie Live at EDC Las Vegas 2026',
                description: 'Diffusé sur DropsidersTV · Day Time',
                youtubeId: 'IzsShRhd5cw',
                duration: 3600
            },
            {
                id: 'b3_3',
                title: 'Mau P | Awakenings Festival 2026',
                description: 'Diffusé sur DropsidersTV · Day Time',
                youtubeId: 'CNGB66x4ygk',
                duration: 5400
            },
            {
                id: 'b3_4',
                title: 'Tinlicker (DJ Set) Live at EDC Las Vegas 2026',
                description: 'Diffusé sur DropsidersTV · Day Time',
                youtubeId: 'WyMR1oHCCEo',
                duration: 4200
            },
            {
                id: 'b3_5',
                title: 'HAYLA Live at EDC Las Vegas 2026 (Official Full Set)',
                description: 'Diffusé sur DropsidersTV · Day Time',
                youtubeId: 'IIquvML5M4M',
                duration: 3600
            }
        ]
    },
    {
        id: 'bloc_4',
        name: 'Bloc 4 · Prime Time',
        title: 'Prime Time Dropsiders',
        timeSlot: '18h - 00h',
        startHour: 18,
        endHour: 24,
        color: '#ff1241',
        emoji: '⭐',
        randomize: true,
        videos: [
            {
                id: 'b4_1',
                title: 'DJ SNAKE LIVE @ ULTRA MIAMI MAIN STAGE 2026',
                description: 'Diffusé sur DropsidersTV · Prime Time Dropsiders',
                youtubeId: 'hSq5aGvBJ04',
                duration: 4500
            },
            {
                id: 'b4_2',
                title: 'Swedish House Mafia Live at Ultra Music Festival (Miami 2026)',
                description: 'Diffusé sur DropsidersTV · Prime Time Dropsiders',
                youtubeId: 'byHTUyYS7bA',
                duration: 5400
            },
            {
                id: 'b4_3',
                title: 'ERIC PRYDZ LIVE @ ULTRA MUSIC FESTIVAL MIAMI 2026',
                description: 'Diffusé sur DropsidersTV · Prime Time Dropsiders',
                youtubeId: 'hU-z3iV0LOg',
                duration: 5400
            },
            {
                id: 'b4_4',
                title: 'Kaskade Live at EDC Las Vegas 2026',
                description: 'Diffusé sur DropsidersTV · Prime Time Dropsiders',
                youtubeId: 'l5wro3bMZWc',
                duration: 4500
            },
            {
                id: 'b4_5',
                title: 'Ray Volpe Live @ Lost Lands 2025 - Full Set',
                description: 'Diffusé sur DropsidersTV · Prime Time Dropsiders',
                youtubeId: 'nyaGV-jeST8',
                duration: 3600
            },
            {
                id: 'b4_6',
                title: 'WORSHIP @ ULTRA MUSIC FESTIVAL MIAMI 2026 | UMF',
                description: 'Diffusé sur DropsidersTV · Prime Time Dropsiders',
                youtubeId: 'V2lD_pq5c3M',
                duration: 4200
            }
        ]
    },
    {
        id: 'bloc_5',
        name: 'Bloc 5 · La Nuit',
        title: 'La Nuit Dropsiders',
        timeSlot: '00h - 06h',
        startHour: 0,
        endHour: 6,
        color: '#8b5cf6',
        emoji: '🌙',
        randomize: true,
        videos: [
            {
                id: 'b5_1',
                title: 'RÜFÜS DU SOL (DJ SET) - Mayan Warrior - Burning Man 2024',
                description: 'Diffusé sur DropsidersTV · La Nuit Dropsiders',
                youtubeId: 'eQ-OVsdK-hM',
                duration: 5400
            },
            {
                id: 'b5_2',
                title: 'Keinemusik (&ME, Rampa, Adam Port) - Mayan Warrior - Burning Man 2022',
                description: 'Diffusé sur DropsidersTV · La Nuit Dropsiders',
                youtubeId: '2ECWX8GdDvA',
                duration: 7200
            },
            {
                id: 'b5_3',
                title: 'SVDDEN DEATH Presents: VOYD Live @ Lost Lands 2025 - Full Set',
                description: 'Diffusé sur DropsidersTV · La Nuit Dropsiders',
                youtubeId: 'DYlcCkyYDnA',
                duration: 4500
            },
            {
                id: 'b5_4',
                title: 'Carl Cox x Playground - Burning Man 2025',
                description: 'Diffusé sur DropsidersTV · La Nuit Dropsiders',
                youtubeId: 'iyCsXPYxa6k',
                duration: 5400
            },
            {
                id: 'b5_5',
                title: 'Joris Voorn Vinyl Only Techno Set | Upclose 2026',
                description: 'Diffusé sur DropsidersTV · La Nuit Dropsiders',
                youtubeId: '4JkIGKt1AHw',
                duration: 5400
            },
            {
                id: 'b5_6',
                title: 'D-Block & S-te-Fan | Defqon.1 2026',
                description: 'Diffusé sur DropsidersTV · La Nuit Dropsiders',
                youtubeId: 'IEJUg98lIHs',
                duration: 3600
            }
        ]
    }
];

/**
 * Deterministic pseudo-random shuffle seeded by a string (e.g. date + block ID)
 * This ensures all viewers worldwide get the exact same randomized playlist order on that day!
 */
export function getSeededShuffle<T>(items: T[], seedStr: string): T[] {
    if (!items || items.length <= 1) return [...items];
    const arr = [...items];
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
        hash = (hash << 5) - hash + seedStr.charCodeAt(i);
        hash |= 0;
    }
    let seed = Math.abs(hash) || 12345;
    const random = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Checks if a given hour (0..23) falls inside a block's time range,
 * correctly handling midnight wrap-around (e.g. 22h to 04h or 18h to 24h/00h).
 */
export function isHourInBlock(b: TVScheduleBlock, h: number): boolean {
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
 * Computes elapsed seconds since the block started, taking into account wrap-around across midnight.
 */
export function getElapsedSecondsInBlock(b: TVScheduleBlock, now: Date = new Date()): number {
    let hoursDiff = now.getHours() - (b.startHour ?? 0);
    if (hoursDiff < 0) hoursDiff += 24;
    return Math.max(0, hoursDiff * 3600 + now.getMinutes() * 60 + now.getSeconds());
}

/**
 * Generates a clean human-readable timeSlot string: e.g. "06h - 10h", "18h - 00h"
 */
export function formatTimeSlot(startHour: number, endHour: number): string {
    const s = `${String(startHour).padStart(2, '0')}h`;
    const endNorm = endHour === 24 || endHour === 0 ? '00' : String(endHour).padStart(2, '0');
    const e = `${endNorm}h`;
    return `${s} - ${e}`;
}

/**
 * Checks if a block is scheduled to air on a given day of the week (0..6 where 0=Sunday, 1=Monday).
 * If `days` is empty, undefined or has 7 days, it airs every day.
 */
export function isBlockActiveOnDay(b: TVScheduleBlock, dayOfWeek: number): boolean {
    if (!b.days || !Array.isArray(b.days) || b.days.length === 0 || b.days.length === 7) {
        return true;
    }
    return b.days.includes(dayOfWeek);
}

/**
 * Trie automatiquement les émissions / blocs dans l'ordre chronologique de diffusion.
 * Le cycle de programmation TV débute à 06h00 (matin) et s'achève avec le bloc de nuit (00h-06h).
 */
export function sortBlocksByBroadcastOrder(blocks: TVScheduleBlock[], autoRenumber: boolean = false): TVScheduleBlock[] {
    if (!Array.isArray(blocks) || blocks.length <= 1) return blocks || [];

    const sorted = [...blocks].sort((a, b) => {
        // Décalage pour démarrer à 6h (06h = 0, 10h = 4, 18h = 12, 00h/minuit = 18, 04h = 22)
        const offsetA = ((a.startHour ?? 0) - 6 + 24) % 24;
        const offsetB = ((b.startHour ?? 0) - 6 + 24) % 24;
        if (offsetA !== offsetB) return offsetA - offsetB;
        return (a.endHour ?? 24) - (b.endHour ?? 24);
    });

    if (!autoRenumber) return sorted;

    // Renumérotation automatique optionnelle "Bloc 1", "Bloc 2"...
    return sorted.map((b, idx) => {
        const num = idx + 1;
        let nextName = b.name;
        if (b.name && /Bloc\s+\d+/i.test(b.name)) {
            nextName = b.name.replace(/Bloc\s+\d+/i, `Bloc ${num}`);
        }
        return {
            ...b,
            name: nextName
        };
    });
}

/**
 * Returns all blocks scheduled for a specific day of the week (0..6), sorted in broadcast chronological order.
 */
export function getBlocksForDay(blocks: TVScheduleBlock[], dayOfWeek: number): TVScheduleBlock[] {
    const list = Array.isArray(blocks) && blocks.length > 0 ? blocks : DEFAULT_TV_BLOCKS;
    const filtered = list.filter(b => isBlockActiveOnDay(b, dayOfWeek));
    return sortBlocksByBroadcastOrder(filtered);
}

/**
 * Formats a block's active days into a clean readable label (e.g. "7j/7", "Lun - Ven", "Sam - Dim", etc.).
 */
export function formatBlockDays(days?: number[]): string {
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
 * Returns the currently active block based on the current hour (0..23) and day of week (0..6).
 * Priority is given to blocks specifically programmed for the current day.
 */
export function getActiveTVBlock(blocks: TVScheduleBlock[], currentHour?: number, currentDay?: number): TVScheduleBlock {
    const list = Array.isArray(blocks) && blocks.length > 0 ? blocks : DEFAULT_TV_BLOCKS;
    const now = new Date();
    const h = currentHour !== undefined ? currentHour : now.getHours();
    const d = currentDay !== undefined ? currentDay : now.getDay();

    // 1. Look for a block programmed specifically for today matching this hour
    const todayBlocks = list.filter(b => isBlockActiveOnDay(b, d));
    const todayMatch = todayBlocks.find(b => isHourInBlock(b, h));
    if (todayMatch) return todayMatch;

    // 2. Fallback to any block matching this hour (e.g. standard schedule)
    const anyHourMatch = list.find(b => isHourInBlock(b, h));
    if (anyHourMatch) return anyHourMatch;

    return todayBlocks[0] || list[0] || DEFAULT_TV_BLOCKS[0];
}

/**
 * Builds the TV playback segments for a block, optionally interleaving promo clips
 */
export function buildBlockSegments(
    videos: TVVideo[],
    promos: PromoVideo[],
    durationsMap: Record<string, number> = {}
): TVScheduleSegment[] {
    if (!videos || videos.length === 0) return [];

    const segments: TVScheduleSegment[] = [];
    const hasPromos = Array.isArray(promos) && promos.length > 0;

    for (let i = 0; i < videos.length; i++) {
        const v = videos[i];
        if (!v) continue;
        const dur = (durationsMap && durationsMap[v.youtubeId]) || v.duration || 3600;
        segments.push({
            type: 'main',
            index: i,
            video: v,
            duration: Math.max(15, dur)
        });

        if (hasPromos) {
            const promoIdx = i % promos.length;
            const promo = promos[promoIdx];
            if (promo) {
                const pDur = (durationsMap && durationsMap[promo.youtubeId]) || promo.duration || 60;
                segments.push({
                    type: 'promo',
                    index: promoIdx,
                    video: promo,
                    duration: Math.max(5, pDur)
                });
            }
        }
    }

    return segments;
}

/**
 * Calculates the current live playback position within a block given elapsed seconds since block start
 */
export function calculateBlockLivePosition(
    segments: TVScheduleSegment[],
    elapsedSecondsInBlock: number
): { index: number; isPromo: boolean; startSeconds: number } {
    if (!segments || segments.length === 0) {
        return { index: 0, isPromo: false, startSeconds: 0 };
    }

    const totalCycle = segments.reduce((sum, s) => sum + s.duration, 0);
    if (totalCycle <= 0) {
        return { index: 0, isPromo: false, startSeconds: 0 };
    }

    let cyclePos = Math.floor(Math.max(0, elapsedSecondsInBlock)) % totalCycle;

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (cyclePos < seg.duration) {
            return {
                index: seg.index,
                isPromo: seg.type === 'promo',
                startSeconds: Math.floor(cyclePos)
            };
        }
        cyclePos -= seg.duration;
    }

    const first = segments[0];
    return {
        index: first.index,
        isPromo: first.type === 'promo',
        startSeconds: 0
    };
}
